'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildFETCHCommand = buildFETCHCommand;
exports.buildXOAuth2Token = buildXOAuth2Token;
exports.buildSEARCHCommand = buildSEARCHCommand;
exports.buildSORTCommand = buildSORTCommand;
exports.buildSTORECommand = buildSTORECommand;

var _emailjsImapHandler = require('emailjs-imap-handler');

var _emailjsMimeCodec = require('emailjs-mime-codec');

var _emailjsBase = require('emailjs-base64');

var _common = require('./common');

/**
 * Builds a FETCH command
 *
 * @param {String} sequence Message range selector
 * @param {Array} items List of elements to fetch (eg. `['uid', 'envelope']`).
 * @param {Object} [options] Optional options object. Use `{byUid:true}` for `UID FETCH`
 * @returns {Object} Structured IMAP command
 */
function buildFETCHCommand(sequence, items, options) {
  let command = {
    command: options.byUid ? 'UID FETCH' : 'FETCH',
    attributes: [{
      type: 'SEQUENCE',
      value: sequence
    }]
  };

  if (options.valueAsString !== undefined) {
    command.valueAsString = options.valueAsString;
  }

  let query = [];

  items.forEach(item => {
    item = item.toUpperCase().trim();

    if (/^\w+$/.test(item)) {
      // alphanum strings can be used directly
      query.push({
        type: 'ATOM',
        value: item
      });
    } else if (item) {
      try {
        // parse the value as a fake command, use only the attributes block
        const cmd = (0, _emailjsImapHandler.parser)((0, _common.toTypedArray)('* Z ' + item));
        query = query.concat(cmd.attributes || []);
      } catch (e) {
        // if parse failed, use the original string as one entity
        query.push({
          type: 'ATOM',
          value: item
        });
      }
    }
  });

  if (query.length === 1) {
    query = query.pop();
  }

  command.attributes.push(query);

  if (options.changedSince) {
    command.attributes.push([{
      type: 'ATOM',
      value: 'CHANGEDSINCE'
    }, {
      type: 'ATOM',
      value: options.changedSince
    }]);
  }

  return command;
}

/**
 * Builds a login token for XOAUTH2 authentication command
 *
 * @param {String} user E-mail address of the user
 * @param {String} token Valid access token for the user
 * @return {String} Base64 formatted login token
 */
function buildXOAuth2Token(user = '', token) {
  let authData = [`user=${user}`, `auth=Bearer ${token}`, '', ''];
  return (0, _emailjsBase.encode)(authData.join('\x01'));
}

let buildTerm = query => {
  let list = [];
  let isAscii = true;

  Object.keys(query).forEach(key => {
    let params = [];
    let formatDate = date => date.toUTCString().replace(/^\w+, 0?(\d+) (\w+) (\d+).*/, '$1-$2-$3');
    let escapeParam = param => {
      if (typeof param === 'number') {
        return {
          type: 'number',
          value: param
        };
      } else if (typeof param === 'string') {
        if (/[\u0080-\uFFFF]/.test(param)) {
          isAscii = false;
          return {
            type: 'literal',
            value: (0, _common.fromTypedArray)((0, _emailjsMimeCodec.encode)(param)) // cast unicode string to pseudo-binary as imap-handler compiles strings as octets
          };
        }
        return {
          type: 'string',
          value: param
        };
      } else if (Object.prototype.toString.call(param) === '[object Date]') {
        // RFC 3501 allows for dates to be placed in
        // double-quotes or left without quotes.  Some
        // servers (Yandex), do not like the double quotes,
        // so we treat the date as an atom.
        return {
          type: 'atom',
          value: formatDate(param)
        };
      } else if (Array.isArray(param)) {
        return param.map(escapeParam);
      } else if (typeof param === 'object') {
        return buildTerm(param);
      }
    };

    params.push({
      type: 'atom',
      value: key.toUpperCase()
    });

    [].concat(query[key] || []).forEach(param => {
      switch (key.toLowerCase()) {
        case 'uid':
          param = {
            type: 'sequence',
            value: param
          };
          break;
        // The Gmail extension values of X-GM-THRID and
        // X-GM-MSGID are defined to be unsigned 64-bit integers
        // and they must not be quoted strings or the server
        // will report a parse error.
        case 'x-gm-thrid':
        case 'x-gm-msgid':
          param = {
            type: 'number',
            value: param
          };
          break;
        default:
          param = escapeParam(param);
      }
      if (param) {
        params = params.concat(param || []);
      }
    });
    list = list.concat(params || []);
  });

  return { term: list, isAscii };
};

/**
 * Compiles a search query into an IMAP command. Queries are composed as objects
 * where keys are search terms and values are term arguments. Only strings,
 * numbers and Dates are used. If the value is an array, the members of it
 * are processed separately (use this for terms that require multiple params).
 * If the value is a Date, it is converted to the form of "01-Jan-1970".
 * Subqueries (OR, NOT) are made up of objects
 *
 *    {unseen: true, header: ["subject", "hello world"]};
 *    SEARCH UNSEEN HEADER "subject" "hello world"
 *
 * @param {Object} query Search query
 * @param {Object} [options] Option object
 * @param {Boolean} [options.byUid] If ture, use UID SEARCH instead of SEARCH
 * @return {Object} IMAP command object
 */
function buildSEARCHCommand(query = {}, options = {}) {
  let command = {
    command: options.byUid ? 'UID SEARCH' : 'SEARCH'
  };

  const { term, isAscii } = buildTerm(query);
  command.attributes = term;

  // If any string input is using 8bit bytes, prepend the optional CHARSET argument
  if (!isAscii) {
    command.attributes.unshift({
      type: 'atom',
      value: 'UTF-8'
    });
    command.attributes.unshift({
      type: 'atom',
      value: 'CHARSET'
    });
  }

  return command;
}

function buildSORTCommand(sortProgram = [], query = {}, options = {}) {
  let command = {
    command: options.byUid ? 'UID SORT' : 'SORT'
  };

  const { term: queryTerm, isAscii } = buildTerm(query);
  const sortTerm = sortProgram.map(s => ({ type: 'ATOM', value: s }));
  const charsetTerm = [{
    type: 'atom',
    value: 'CHARSET'
  }, {
    type: 'atom',
    value: isAscii ? 'US-ASCII' : 'UTF-8'
  }];
  command.attributes = sortTerm.concat(charsetTerm, queryTerm);

  return command;
}

/**
 * Creates an IMAP STORE command from the selected arguments
 */
function buildSTORECommand(sequence, action = '', flags = [], options = {}) {
  let command = {
    command: options.byUid ? 'UID STORE' : 'STORE',
    attributes: [{
      type: 'sequence',
      value: sequence
    }]
  };

  command.attributes.push({
    type: 'atom',
    value: action.toUpperCase() + (options.silent ? '.SILENT' : '')
  });

  command.attributes.push(flags.map(flag => {
    return {
      type: 'atom',
      value: flag
    };
  }));

  return command;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kLWJ1aWxkZXIuanMiXSwibmFtZXMiOlsiYnVpbGRGRVRDSENvbW1hbmQiLCJidWlsZFhPQXV0aDJUb2tlbiIsImJ1aWxkU0VBUkNIQ29tbWFuZCIsImJ1aWxkU09SVENvbW1hbmQiLCJidWlsZFNUT1JFQ29tbWFuZCIsInNlcXVlbmNlIiwiaXRlbXMiLCJvcHRpb25zIiwiY29tbWFuZCIsImJ5VWlkIiwiYXR0cmlidXRlcyIsInR5cGUiLCJ2YWx1ZSIsInZhbHVlQXNTdHJpbmciLCJ1bmRlZmluZWQiLCJxdWVyeSIsImZvckVhY2giLCJpdGVtIiwidG9VcHBlckNhc2UiLCJ0cmltIiwidGVzdCIsInB1c2giLCJjbWQiLCJjb25jYXQiLCJlIiwibGVuZ3RoIiwicG9wIiwiY2hhbmdlZFNpbmNlIiwidXNlciIsInRva2VuIiwiYXV0aERhdGEiLCJqb2luIiwiYnVpbGRUZXJtIiwibGlzdCIsImlzQXNjaWkiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwicGFyYW1zIiwiZm9ybWF0RGF0ZSIsImRhdGUiLCJ0b1VUQ1N0cmluZyIsInJlcGxhY2UiLCJlc2NhcGVQYXJhbSIsInBhcmFtIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwidG9Mb3dlckNhc2UiLCJ0ZXJtIiwidW5zaGlmdCIsInNvcnRQcm9ncmFtIiwicXVlcnlUZXJtIiwic29ydFRlcm0iLCJzIiwiY2hhcnNldFRlcm0iLCJhY3Rpb24iLCJmbGFncyIsInNpbGVudCIsImZsYWciXSwibWFwcGluZ3MiOiI7Ozs7O1FBZ0JnQkEsaUIsR0FBQUEsaUI7UUFpRUFDLGlCLEdBQUFBLGlCO1FBd0dBQyxrQixHQUFBQSxrQjtRQXVCQUMsZ0IsR0FBQUEsZ0I7UUF1QkFDLGlCLEdBQUFBLGlCOztBQXZPaEI7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBS0E7Ozs7Ozs7O0FBUU8sU0FBU0osaUJBQVQsQ0FBMkJLLFFBQTNCLEVBQXFDQyxLQUFy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QUFDQSxRQUFNQyxjQUFjLENBQUM7QUFDbkIvQyxVQUFNLE1BRGE7QUFFbkJDLFdBQU87QUFGWSxHQUFELEVBR2pCO0FBQ0RELFVBQU0sTUFETDtBQUVEQyxXQUFPc0IsVUFBVSxVQUFWLEdBQXVCO0FBRjdCLEdBSGlCLENBQXBCO0FBT0ExQixVQUFRRSxVQUFSLEdBQXFCOEMsU0FBU2pDLE1BQVQsQ0FBZ0JtQyxXQUFoQixFQUE2QkgsU0FBN0IsQ0FBckI7O0FBR0EsU0FBTy9DLE9BQVA7QUFDRDs7QUFFRDs7O0FBR08sU0FBU0osaUJBQVQsQ0FBMkJDLFFBQTNCLEVBQXFDc0QsU0FBUyxFQUE5QyxFQUFrREMsUUFBUSxFQUExRCxFQUE4RHJELFVBQVUsRUFBeEUsRUFBNEU7QUFDakYsTUFBSUMsVUFBVTtBQUNaQSxhQUFTRCxRQUFRRSxLQUFSLEdBQWdCLFdBQWhCLEdBQThCLE9BRDNCO0FBRVpDLGdCQUFZLENBQUM7QUFDWEMsWUFBTSxVQURLO0FBRVhDLGFBQU9QO0FBRkksS0FBRDtBQUZBLEdBQWQ7O0FBUUFHLFVBQVFFLFVBQVIsQ0FBbUJXLElBQW5CLENBQXdCO0FBQ3RCVixVQUFNLE1BRGdCO0FBRXRCQyxXQUFPK0MsT0FBT3pDLFdBQVAsTUFBd0JYLFFBQVFzRCxNQUFSLEdBQWlCLFNBQWpCLEdBQTZCLEVBQXJEO0FBRmUsR0FBeEI7O0FBS0FyRCxVQUFRRSxVQUFSLENBQW1CVyxJQUFuQixDQUF3QnVDLE1BQU1WLEdBQU4sQ0FBV1ksSUFBRCxJQUFVO0FBQzFDLFdBQU87QUFDTG5ELFlBQU0sTUFERDtBQUVMQyxhQUFPa0Q7QUFGRixLQUFQO0FBSUQsR0FMdUIsQ0FBeEI7O0FBT0EsU0FBT3RELE9BQVA7QUFDRCIsImZpbGUiOiJjb21tYW5kLWJ1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXJzZXIgfSBmcm9tICdlbWFpbGpzLWltYXAtaGFuZGxlcidcbmltcG9ydCB7IGVuY29kZSB9IGZyb20gJ2VtYWlsanMtbWltZS1jb2RlYydcbmltcG9ydCB7IGVuY29kZSBhcyBlbmNvZGVCYXNlNjQgfSBmcm9tICdlbWFpbGpzLWJhc2U2NCdcbmltcG9ydCB7XG4gIGZyb21UeXBlZEFycmF5LFxuICB0b1R5cGVkQXJyYXlcbn0gZnJvbSAnLi9jb21tb24nXG5cbi8qKlxuICogQnVpbGRzIGEgRkVUQ0ggY29tbWFuZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBNZXNzYWdlIHJhbmdlIHNlbGVjdG9yXG4gKiBAcGFyYW0ge0FycmF5fSBpdGVtcyBMaXN0IG9mIGVsZW1lbnRzIHRvIGZldGNoIChlZy4gYFsndWlkJywgJ2VudmVsb3BlJ11gKS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QuIFVzZSBge2J5VWlkOnRydWV9YCBmb3IgYFVJRCBGRVRDSGBcbiAqIEByZXR1cm5zIHtPYmplY3R9IFN0cnVjdHVyZWQgSU1BUCBjb21tYW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZFVENIQ29tbWFuZChzZXF1ZW5jZSwgaXRlbXMsIG9wdGlvbnMpIHtcbiAgbGV0IGNvbW1hbmQgPSB7XG4gICAgY29tbWFuZDogb3B0aW9ucy5ieVVpZCA/ICdVSUQgRkVUQ0gnIDogJ0ZFVENIJyxcbiAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgdHlwZTogJ1NFUVVFTkNFJyxcbiAgICAgIHZhbHVlOiBzZXF1ZW5jZVxuICAgIH1dXG4gIH1cblxuICBpZiAob3B0aW9ucy52YWx1ZUFzU3RyaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb21tYW5kLnZhbHVlQXNTdHJpbmcgPSBvcHRpb25zLnZhbHVlQXNTdHJpbmdcbiAgfVxuXG4gIGxldCBxdWVyeSA9IFtdXG5cbiAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgIGl0ZW0gPSBpdGVtLnRvVXBwZXJDYXNlKCkudHJpbSgpXG5cbiAgICBpZiAoL15cXHcrJC8udGVzdChpdGVtKSkge1xuICAgICAgLy8gYWxwaGFudW0gc3RyaW5ncyBjYW4gYmUgdXNlZCBkaXJlY3RseVxuICAgICAgcXVlcnkucHVzaCh7XG4gICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgdmFsdWU6IGl0ZW1cbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChpdGVtKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBwYXJzZSB0aGUgdmFsdWUgYXMgYSBmYWtlIGNvbW1hbmQsIHVzZSBvbmx5IHRoZSBhdHRyaWJ1dGVzIGJsb2NrXG4gICAgICAgIGNvbnN0IGNtZCA9IHBhcnNlcih0b1R5cGVkQXJyYXkoJyogWiAnICsgaXRlbSkpXG4gICAgICAgIHF1ZXJ5ID0gcXVlcnkuY29uY2F0KGNtZC5hdHRyaWJ1dGVzIHx8IFtdKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBpZiBwYXJzZSBmYWlsZWQsIHVzZSB0aGUgb3JpZ2luYWwgc3RyaW5nIGFzIG9uZSBlbnRpdHlcbiAgICAgICAgcXVlcnkucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgICAgIHZhbHVlOiBpdGVtXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGlmIChxdWVyeS5sZW5ndGggPT09IDEpIHtcbiAgICBxdWVyeSA9IHF1ZXJ5LnBvcCgpXG4gIH1cblxuICBjb21tYW5kLmF0dHJpYnV0ZXMucHVzaChxdWVyeSlcblxuICBpZiAob3B0aW9ucy5jaGFuZ2VkU2luY2UpIHtcbiAgICBjb21tYW5kLmF0dHJpYnV0ZXMucHVzaChbe1xuICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgdmFsdWU6ICdDSEFOR0VEU0lOQ0UnXG4gICAgfSwge1xuICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgdmFsdWU6IG9wdGlvbnMuY2hhbmdlZFNpbmNlXG4gICAgfV0pXG4gIH1cblxuICByZXR1cm4gY29tbWFuZFxufVxuXG4vKipcbiAqIEJ1aWxkcyBhIGxvZ2luIHRva2VuIGZvciBYT0FVVEgyIGF1dGhlbnRpY2F0aW9uIGNvbW1hbmRcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlciBFLW1haWwgYWRkcmVzcyBvZiB0aGUgdXNlclxuICogQHBhcmFtIHtTdHJpbmd9IHRva2VuIFZhbGlkIGFjY2VzcyB0b2tlbiBmb3IgdGhlIHVzZXJcbiAqIEByZXR1cm4ge1N0cmluZ30gQmFzZTY0IGZvcm1hdHRlZCBsb2dpbiB0b2tlblxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRYT0F1dGgyVG9rZW4odXNlciA9ICcnLCB0b2tlbikge1xuICBsZXQgYXV0aERhdGEgPSBbXG4gICAgYHVzZXI9JHt1c2VyfWAsXG4gICAgYGF1dGg9QmVhcmVyICR7dG9rZW59YCxcbiAgICAnJyxcbiAgICAnJ1xuICBdXG4gIHJldHVybiBlbmNvZGVCYXNlNjQoYXV0aERhdGEuam9pbignXFx4MDEnKSlcbn1cblxubGV0IGJ1aWxkVGVybSA9IChxdWVyeSkgPT4ge1xuICBsZXQgbGlzdCA9IFtdXG4gIGxldCBpc0FzY2lpID0gdHJ1ZVxuXG4gIE9iamVjdC5rZXlzKHF1ZXJ5KS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBsZXQgcGFyYW1zID0gW11cbiAgICBsZXQgZm9ybWF0RGF0ZSA9IChkYXRlKSA9PiBkYXRlLnRvVVRDU3RyaW5nKCkucmVwbGFjZSgvXlxcdyssIDA/KFxcZCspIChcXHcrKSAoXFxkKykuKi8sICckMS0kMi0kMycpXG4gICAgbGV0IGVzY2FwZVBhcmFtID0gKHBhcmFtKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHBhcmFtID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgIHZhbHVlOiBwYXJhbVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKC9bXFx1MDA4MC1cXHVGRkZGXS8udGVzdChwYXJhbSkpIHtcbiAgICAgICAgICBpc0FzY2lpID0gZmFsc2VcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ2xpdGVyYWwnLFxuICAgICAgICAgICAgdmFsdWU6IGZyb21UeXBlZEFycmF5KGVuY29kZShwYXJhbSkpIC8vIGNhc3QgdW5pY29kZSBzdHJpbmcgdG8gcHNldWRvLWJpbmFyeSBhcyBpbWFwLWhhbmRsZXIgY29tcGlsZXMgc3RyaW5ncyBhcyBvY3RldHNcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICB2YWx1ZTogcGFyYW1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocGFyYW0pID09PSAnW29iamVjdCBEYXRlXScpIHtcbiAgICAgICAgLy8gUkZDIDM1MDEgYWxsb3dzIGZvciBkYXRlcyB0byBiZSBwbGFjZWQgaW5cbiAgICAgICAgLy8gZG91YmxlLXF1b3RlcyBvciBsZWZ0IHdpdGhvdXQgcXVvdGVzLiAgU29tZVxuICAgICAgICAvLyBzZXJ2ZXJzIChZYW5kZXgpLCBkbyBub3QgbGlrZSB0aGUgZG91YmxlIHF1b3RlcyxcbiAgICAgICAgLy8gc28gd2UgdHJlYXQgdGhlIGRhdGUgYXMgYW4gYXRvbS5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnYXRvbScsXG4gICAgICAgICAgdmFsdWU6IGZvcm1hdERhdGUocGFyYW0pXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShwYXJhbSkpIHtcbiAgICAgICAgcmV0dXJuIHBhcmFtLm1hcChlc2NhcGVQYXJhbSlcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHBhcmFtID09PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gYnVpbGRUZXJtKHBhcmFtKVxuICAgICAgfVxuICAgIH1cblxuICAgIHBhcmFtcy5wdXNoKHtcbiAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgIHZhbHVlOiBrZXkudG9VcHBlckNhc2UoKVxuICAgIH0pO1xuXG4gICAgW10uY29uY2F0KHF1ZXJ5W2tleV0gfHwgW10pLmZvckVhY2goKHBhcmFtKSA9PiB7XG4gICAgICBzd2l0Y2ggKGtleS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgJ3VpZCc6XG4gICAgICAgICAgcGFyYW0gPSB7XG4gICAgICAgICAgICB0eXBlOiAnc2VxdWVuY2UnLFxuICAgICAgICAgICAgdmFsdWU6IHBhcmFtXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIC8vIFRoZSBHbWFpbCBleHRlbnNpb24gdmFsdWVzIG9mIFgtR00tVEhSSUQgYW5kXG4gICAgICAgIC8vIFgtR00tTVNHSUQgYXJlIGRlZmluZWQgdG8gYmUgdW5zaWduZWQgNjQtYml0IGludGVnZXJzXG4gICAgICAgIC8vIGFuZCB0aGV5IG11c3Qgbm90IGJlIHF1b3RlZCBzdHJpbmdzIG9yIHRoZSBzZXJ2ZXJcbiAgICAgICAgLy8gd2lsbCByZXBvcnQgYSBwYXJzZSBlcnJvci5cbiAgICAgICAgY2FzZSAneC1nbS10aHJpZCc6XG4gICAgICAgIGNhc2UgJ3gtZ20tbXNnaWQnOlxuICAgICAgICAgIHBhcmFtID0ge1xuICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICB2YWx1ZTogcGFyYW1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBwYXJhbSA9IGVzY2FwZVBhcmFtKHBhcmFtKVxuICAgICAgfVxuICAgICAgaWYgKHBhcmFtKSB7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcy5jb25jYXQocGFyYW0gfHwgW10pXG4gICAgICB9XG4gICAgfSlcbiAgICBsaXN0ID0gbGlzdC5jb25jYXQocGFyYW1zIHx8IFtdKVxuICB9KVxuXG4gIHJldHVybiB7IHRlcm06IGxpc3QsIGlzQXNjaWkgfVxufVxuXG4vKipcbiAqIENvbXBpbGVzIGEgc2VhcmNoIHF1ZXJ5IGludG8gYW4gSU1BUCBjb21tYW5kLiBRdWVyaWVzIGFyZSBjb21wb3NlZCBhcyBvYmplY3RzXG4gKiB3aGVyZSBrZXlzIGFyZSBzZWFyY2ggdGVybXMgYW5kIHZhbHVlcyBhcmUgdGVybSBhcmd1bWVudHMuIE9ubHkgc3RyaW5ncyxcbiAqIG51bWJlcnMgYW5kIERhdGVzIGFyZSB1c2VkLiBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIHRoZSBtZW1iZXJzIG9mIGl0XG4gKiBhcmUgcHJvY2Vzc2VkIHNlcGFyYXRlbHkgKHVzZSB0aGlzIGZvciB0ZXJtcyB0aGF0IHJlcXVpcmUgbXVsdGlwbGUgcGFyYW1zKS5cbiAqIElmIHRoZSB2YWx1ZSBpcyBhIERhdGUsIGl0IGlzIGNvbnZlcnRlZCB0byB0aGUgZm9ybSBvZiBcIjAxLUphbi0xOTcwXCIuXG4gKiBTdWJxdWVyaWVzIChPUiwgTk9UKSBhcmUgbWFkZSB1cCBvZiBvYmplY3RzXG4gKlxuICogICAge3Vuc2VlbjogdHJ1ZSwgaGVhZGVyOiBbXCJzdWJqZWN0XCIsIFwiaGVsbG8gd29ybGRcIl19O1xuICogICAgU0VBUkNIIFVOU0VFTiBIRUFERVIgXCJzdWJqZWN0XCIgXCJoZWxsbyB3b3JsZFwiXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHF1ZXJ5IFNlYXJjaCBxdWVyeVxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb24gb2JqZWN0XG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLmJ5VWlkXSBJZiB0dXJlLCB1c2UgVUlEIFNFQVJDSCBpbnN0ZWFkIG9mIFNFQVJDSFxuICogQHJldHVybiB7T2JqZWN0fSBJTUFQIGNvbW1hbmQgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFNFQVJDSENvbW1hbmQocXVlcnkgPSB7fSwgb3B0aW9ucyA9IHt9KSB7XG4gIGxldCBjb21tYW5kID0ge1xuICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIFNFQVJDSCcgOiAnU0VBUkNIJ1xuICB9XG5cbiAgY29uc3QgeyB0ZXJtLCBpc0FzY2lpIH0gPSBidWlsZFRlcm0ocXVlcnkpXG4gIGNvbW1hbmQuYXR0cmlidXRlcyA9IHRlcm1cblxuICAvLyBJZiBhbnkgc3RyaW5nIGlucHV0IGlzIHVzaW5nIDhiaXQgYnl0ZXMsIHByZXBlbmQgdGhlIG9wdGlvbmFsIENIQVJTRVQgYXJndW1lbnRcbiAgaWYgKCFpc0FzY2lpKSB7XG4gICAgY29tbWFuZC5hdHRyaWJ1dGVzLnVuc2hpZnQoe1xuICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgdmFsdWU6ICdVVEYtOCdcbiAgICB9KVxuICAgIGNvbW1hbmQuYXR0cmlidXRlcy51bnNoaWZ0KHtcbiAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgIHZhbHVlOiAnQ0hBUlNFVCdcbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIGNvbW1hbmRcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU09SVENvbW1hbmQoc29ydFByb2dyYW0gPSBbXSwgcXVlcnkgPSB7fSwgb3B0aW9ucyA9IHt9KSB7XG4gIGxldCBjb21tYW5kID0ge1xuICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIFNPUlQnIDogJ1NPUlQnXG4gIH1cblxuICBjb25zdCB7IHRlcm06IHF1ZXJ5VGVybSwgaXNBc2NpaSB9ID0gYnVpbGRUZXJtKHF1ZXJ5KVxuICBjb25zdCBzb3J0VGVybSA9IHNvcnRQcm9ncmFtLm1hcChzID0+ICh7IHR5cGU6ICdBVE9NJywgdmFsdWU6IHMgfSkpO1xuICBjb25zdCBjaGFyc2V0VGVybSA9IFt7XG4gICAgdHlwZTogJ2F0b20nLFxuICAgIHZhbHVlOiAnQ0hBUlNFVCdcbiAgfSwge1xuICAgIHR5cGU6ICdhdG9tJyxcbiAgICB2YWx1ZTogaXNBc2NpaSA/ICdVUy1BU0NJSScgOiAnVVRGLTgnXG4gIH1dO1xuICBjb21tYW5kLmF0dHJpYnV0ZXMgPSBzb3J0VGVybS5jb25jYXQoY2hhcnNldFRlcm0sIHF1ZXJ5VGVybSk7XG5cblxuICByZXR1cm4gY29tbWFuZFxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gSU1BUCBTVE9SRSBjb21tYW5kIGZyb20gdGhlIHNlbGVjdGVkIGFyZ3VtZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTVE9SRUNvbW1hbmQoc2VxdWVuY2UsIGFjdGlvbiA9ICcnLCBmbGFncyA9IFtdLCBvcHRpb25zID0ge30pIHtcbiAgbGV0IGNvbW1hbmQgPSB7XG4gICAgY29tbWFuZDogb3B0aW9ucy5ieVVpZCA/ICdVSUQgU1RPUkUnIDogJ1NUT1JFJyxcbiAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgdHlwZTogJ3NlcXVlbmNlJyxcbiAgICAgIHZhbHVlOiBzZXF1ZW5jZVxuICAgIH1dXG4gIH1cblxuICBjb21tYW5kLmF0dHJpYnV0ZXMucHVzaCh7XG4gICAgdHlwZTogJ2F0b20nLFxuICAgIHZhbHVlOiBhY3Rpb24udG9VcHBlckNhc2UoKSArIChvcHRpb25zLnNpbGVudCA/ICcuU0lMRU5UJyA6ICcnKVxuICB9KVxuXG4gIGNvbW1hbmQuYXR0cmlidXRlcy5wdXNoKGZsYWdzLm1hcCgoZmxhZykgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnYXRvbScsXG4gICAgICB2YWx1ZTogZmxhZ1xuICAgIH1cbiAgfSkpXG5cbiAgcmV0dXJuIGNvbW1hbmRcbn1cbiJdfQ==