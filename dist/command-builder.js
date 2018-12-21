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
  const sortTerm = [sortProgram.map(s => ({ type: 'ATOM', value: s }))];
  const charsetTerm = [{
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kLWJ1aWxkZXIuanMiXSwibmFtZXMiOlsiYnVpbGRGRVRDSENvbW1hbmQiLCJidWlsZFhPQXV0aDJUb2tlbiIsImJ1aWxkU0VBUkNIQ29tbWFuZCIsImJ1aWxkU09SVENvbW1hbmQiLCJidWlsZFNUT1JFQ29tbWFuZCIsInNlcXVlbmNlIiwiaXRlbXMiLCJvcHRpb25zIiwiY29tbWFuZCIsImJ5VWlkIiwiYXR0cmlidXRlcyIsInR5cGUiLCJ2YWx1ZSIsInZhbHVlQXNTdHJpbmciLCJ1bmRlZmluZWQiLCJxdWVyeSIsImZvckVhY2giLCJpdGVtIiwidG9VcHBlckNhc2UiLCJ0cmltIiwidGVzdCIsInB1c2giLCJjbWQiLCJjb25jYXQiLCJlIiwibGVuZ3RoIiwicG9wIiwiY2hhbmdlZFNpbmNlIiwidXNlciIsInRva2VuIiwiYXV0aERhdGEiLCJqb2luIiwiYnVpbGRUZXJtIiwibGlzdCIsImlzQXNjaWkiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwicGFyYW1zIiwiZm9ybWF0RGF0ZSIsImRhdGUiLCJ0b1VUQ1N0cmluZyIsInJlcGxhY2UiLCJlc2NhcGVQYXJhbSIsInBhcmFtIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwidG9Mb3dlckNhc2UiLCJ0ZXJtIiwidW5zaGlmdCIsInNvcnRQcm9ncmFtIiwicXVlcnlUZXJtIiwic29ydFRlcm0iLCJzIiwiY2hhcnNldFRlcm0iLCJhY3Rpb24iLCJmbGFncyIsInNpbGVudCIsImZsYWciXSwibWFwcGluZ3MiOiI7Ozs7O1FBZ0JnQkEsaUIsR0FBQUEsaUI7UUFpRUFDLGlCLEdBQUFBLGlCO1FBd0dBQyxrQixHQUFBQSxrQjtRQXVCQUMsZ0IsR0FBQUEsZ0I7UUFvQkFDLGlCLEdBQUFBLGlCOztBQXBPaEI7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBS0E7Ozs7Ozs7O0FBUU8sU0FBU0osaUJBQVQsQ0FBMkJLLFFBQTNCLEVBQXFDQyxLQUFy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QUFELENBQWpCO0FBQ0EsUUFBTUMsY0FBYyxDQUFDO0FBQ25CL0MsVUFBTSxNQURhO0FBRW5CQyxXQUFPc0IsVUFBVSxVQUFWLEdBQXVCO0FBRlgsR0FBRCxDQUFwQjtBQUlBMUIsVUFBUUUsVUFBUixHQUFxQjhDLFNBQVNqQyxNQUFULENBQWdCbUMsV0FBaEIsRUFBNkJILFNBQTdCLENBQXJCOztBQUdBLFNBQU8vQyxPQUFQO0FBQ0Q7O0FBRUQ7OztBQUdPLFNBQVNKLGlCQUFULENBQTJCQyxRQUEzQixFQUFxQ3NELFNBQVMsRUFBOUMsRUFBa0RDLFFBQVEsRUFBMUQsRUFBOERyRCxVQUFVLEVBQXhFLEVBQTRFO0FBQ2pGLE1BQUlDLFVBQVU7QUFDWkEsYUFBU0QsUUFBUUUsS0FBUixHQUFnQixXQUFoQixHQUE4QixPQUQzQjtBQUVaQyxnQkFBWSxDQUFDO0FBQ1hDLFlBQU0sVUFESztBQUVYQyxhQUFPUDtBQUZJLEtBQUQ7QUFGQSxHQUFkOztBQVFBRyxVQUFRRSxVQUFSLENBQW1CVyxJQUFuQixDQUF3QjtBQUN0QlYsVUFBTSxNQURnQjtBQUV0QkMsV0FBTytDLE9BQU96QyxXQUFQLE1BQXdCWCxRQUFRc0QsTUFBUixHQUFpQixTQUFqQixHQUE2QixFQUFyRDtBQUZlLEdBQXhCOztBQUtBckQsVUFBUUUsVUFBUixDQUFtQlcsSUFBbkIsQ0FBd0J1QyxNQUFNVixHQUFOLENBQVdZLElBQUQsSUFBVTtBQUMxQyxXQUFPO0FBQ0xuRCxZQUFNLE1BREQ7QUFFTEMsYUFBT2tEO0FBRkYsS0FBUDtBQUlELEdBTHVCLENBQXhCOztBQU9BLFNBQU90RCxPQUFQO0FBQ0QiLCJmaWxlIjoiY29tbWFuZC1idWlsZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcGFyc2VyIH0gZnJvbSAnZW1haWxqcy1pbWFwLWhhbmRsZXInXG5pbXBvcnQgeyBlbmNvZGUgfSBmcm9tICdlbWFpbGpzLW1pbWUtY29kZWMnXG5pbXBvcnQgeyBlbmNvZGUgYXMgZW5jb2RlQmFzZTY0IH0gZnJvbSAnZW1haWxqcy1iYXNlNjQnXG5pbXBvcnQge1xuICBmcm9tVHlwZWRBcnJheSxcbiAgdG9UeXBlZEFycmF5XG59IGZyb20gJy4vY29tbW9uJ1xuXG4vKipcbiAqIEJ1aWxkcyBhIEZFVENIIGNvbW1hbmRcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSByYW5nZSBzZWxlY3RvclxuICogQHBhcmFtIHtBcnJheX0gaXRlbXMgTGlzdCBvZiBlbGVtZW50cyB0byBmZXRjaCAoZWcuIGBbJ3VpZCcsICdlbnZlbG9wZSddYCkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0LiBVc2UgYHtieVVpZDp0cnVlfWAgZm9yIGBVSUQgRkVUQ0hgXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBTdHJ1Y3R1cmVkIElNQVAgY29tbWFuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGRVRDSENvbW1hbmQoc2VxdWVuY2UsIGl0ZW1zLCBvcHRpb25zKSB7XG4gIGxldCBjb21tYW5kID0ge1xuICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIEZFVENIJyA6ICdGRVRDSCcsXG4gICAgYXR0cmlidXRlczogW3tcbiAgICAgIHR5cGU6ICdTRVFVRU5DRScsXG4gICAgICB2YWx1ZTogc2VxdWVuY2VcbiAgICB9XVxuICB9XG5cbiAgaWYgKG9wdGlvbnMudmFsdWVBc1N0cmluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29tbWFuZC52YWx1ZUFzU3RyaW5nID0gb3B0aW9ucy52YWx1ZUFzU3RyaW5nXG4gIH1cblxuICBsZXQgcXVlcnkgPSBbXVxuXG4gIGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICBpdGVtID0gaXRlbS50b1VwcGVyQ2FzZSgpLnRyaW0oKVxuXG4gICAgaWYgKC9eXFx3KyQvLnRlc3QoaXRlbSkpIHtcbiAgICAgIC8vIGFscGhhbnVtIHN0cmluZ3MgY2FuIGJlIHVzZWQgZGlyZWN0bHlcbiAgICAgIHF1ZXJ5LnB1c2goe1xuICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgIHZhbHVlOiBpdGVtXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAoaXRlbSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gcGFyc2UgdGhlIHZhbHVlIGFzIGEgZmFrZSBjb21tYW5kLCB1c2Ugb25seSB0aGUgYXR0cmlidXRlcyBibG9ja1xuICAgICAgICBjb25zdCBjbWQgPSBwYXJzZXIodG9UeXBlZEFycmF5KCcqIFogJyArIGl0ZW0pKVxuICAgICAgICBxdWVyeSA9IHF1ZXJ5LmNvbmNhdChjbWQuYXR0cmlidXRlcyB8fCBbXSlcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gaWYgcGFyc2UgZmFpbGVkLCB1c2UgdGhlIG9yaWdpbmFsIHN0cmluZyBhcyBvbmUgZW50aXR5XG4gICAgICAgIHF1ZXJ5LnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgICB2YWx1ZTogaXRlbVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBpZiAocXVlcnkubGVuZ3RoID09PSAxKSB7XG4gICAgcXVlcnkgPSBxdWVyeS5wb3AoKVxuICB9XG5cbiAgY29tbWFuZC5hdHRyaWJ1dGVzLnB1c2gocXVlcnkpXG5cbiAgaWYgKG9wdGlvbnMuY2hhbmdlZFNpbmNlKSB7XG4gICAgY29tbWFuZC5hdHRyaWJ1dGVzLnB1c2goW3tcbiAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgIHZhbHVlOiAnQ0hBTkdFRFNJTkNFJ1xuICAgIH0sIHtcbiAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgIHZhbHVlOiBvcHRpb25zLmNoYW5nZWRTaW5jZVxuICAgIH1dKVxuICB9XG5cbiAgcmV0dXJuIGNvbW1hbmRcbn1cblxuLyoqXG4gKiBCdWlsZHMgYSBsb2dpbiB0b2tlbiBmb3IgWE9BVVRIMiBhdXRoZW50aWNhdGlvbiBjb21tYW5kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXIgRS1tYWlsIGFkZHJlc3Mgb2YgdGhlIHVzZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0b2tlbiBWYWxpZCBhY2Nlc3MgdG9rZW4gZm9yIHRoZSB1c2VyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IEJhc2U2NCBmb3JtYXR0ZWQgbG9naW4gdG9rZW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkWE9BdXRoMlRva2VuKHVzZXIgPSAnJywgdG9rZW4pIHtcbiAgbGV0IGF1dGhEYXRhID0gW1xuICAgIGB1c2VyPSR7dXNlcn1gLFxuICAgIGBhdXRoPUJlYXJlciAke3Rva2VufWAsXG4gICAgJycsXG4gICAgJydcbiAgXVxuICByZXR1cm4gZW5jb2RlQmFzZTY0KGF1dGhEYXRhLmpvaW4oJ1xceDAxJykpXG59XG5cbmxldCBidWlsZFRlcm0gPSAocXVlcnkpID0+IHtcbiAgbGV0IGxpc3QgPSBbXVxuICBsZXQgaXNBc2NpaSA9IHRydWVcblxuICBPYmplY3Qua2V5cyhxdWVyeSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgbGV0IHBhcmFtcyA9IFtdXG4gICAgbGV0IGZvcm1hdERhdGUgPSAoZGF0ZSkgPT4gZGF0ZS50b1VUQ1N0cmluZygpLnJlcGxhY2UoL15cXHcrLCAwPyhcXGQrKSAoXFx3KykgKFxcZCspLiovLCAnJDEtJDItJDMnKVxuICAgIGxldCBlc2NhcGVQYXJhbSA9IChwYXJhbSkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICB2YWx1ZTogcGFyYW1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICgvW1xcdTAwODAtXFx1RkZGRl0vLnRlc3QocGFyYW0pKSB7XG4gICAgICAgICAgaXNBc2NpaSA9IGZhbHNlXG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdsaXRlcmFsJyxcbiAgICAgICAgICAgIHZhbHVlOiBmcm9tVHlwZWRBcnJheShlbmNvZGUocGFyYW0pKSAvLyBjYXN0IHVuaWNvZGUgc3RyaW5nIHRvIHBzZXVkby1iaW5hcnkgYXMgaW1hcC1oYW5kbGVyIGNvbXBpbGVzIHN0cmluZ3MgYXMgb2N0ZXRzXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgdmFsdWU6IHBhcmFtXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHBhcmFtKSA9PT0gJ1tvYmplY3QgRGF0ZV0nKSB7XG4gICAgICAgIC8vIFJGQyAzNTAxIGFsbG93cyBmb3IgZGF0ZXMgdG8gYmUgcGxhY2VkIGluXG4gICAgICAgIC8vIGRvdWJsZS1xdW90ZXMgb3IgbGVmdCB3aXRob3V0IHF1b3Rlcy4gIFNvbWVcbiAgICAgICAgLy8gc2VydmVycyAoWWFuZGV4KSwgZG8gbm90IGxpa2UgdGhlIGRvdWJsZSBxdW90ZXMsXG4gICAgICAgIC8vIHNvIHdlIHRyZWF0IHRoZSBkYXRlIGFzIGFuIGF0b20uXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgICAgIHZhbHVlOiBmb3JtYXREYXRlKHBhcmFtKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocGFyYW0pKSB7XG4gICAgICAgIHJldHVybiBwYXJhbS5tYXAoZXNjYXBlUGFyYW0pXG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkVGVybShwYXJhbSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJhbXMucHVzaCh7XG4gICAgICB0eXBlOiAnYXRvbScsXG4gICAgICB2YWx1ZToga2V5LnRvVXBwZXJDYXNlKClcbiAgICB9KTtcblxuICAgIFtdLmNvbmNhdChxdWVyeVtrZXldIHx8IFtdKS5mb3JFYWNoKChwYXJhbSkgPT4ge1xuICAgICAgc3dpdGNoIChrZXkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlICd1aWQnOlxuICAgICAgICAgIHBhcmFtID0ge1xuICAgICAgICAgICAgdHlwZTogJ3NlcXVlbmNlJyxcbiAgICAgICAgICAgIHZhbHVlOiBwYXJhbVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICAvLyBUaGUgR21haWwgZXh0ZW5zaW9uIHZhbHVlcyBvZiBYLUdNLVRIUklEIGFuZFxuICAgICAgICAvLyBYLUdNLU1TR0lEIGFyZSBkZWZpbmVkIHRvIGJlIHVuc2lnbmVkIDY0LWJpdCBpbnRlZ2Vyc1xuICAgICAgICAvLyBhbmQgdGhleSBtdXN0IG5vdCBiZSBxdW90ZWQgc3RyaW5ncyBvciB0aGUgc2VydmVyXG4gICAgICAgIC8vIHdpbGwgcmVwb3J0IGEgcGFyc2UgZXJyb3IuXG4gICAgICAgIGNhc2UgJ3gtZ20tdGhyaWQnOlxuICAgICAgICBjYXNlICd4LWdtLW1zZ2lkJzpcbiAgICAgICAgICBwYXJhbSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgdmFsdWU6IHBhcmFtXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcGFyYW0gPSBlc2NhcGVQYXJhbShwYXJhbSlcbiAgICAgIH1cbiAgICAgIGlmIChwYXJhbSkge1xuICAgICAgICBwYXJhbXMgPSBwYXJhbXMuY29uY2F0KHBhcmFtIHx8IFtdKVxuICAgICAgfVxuICAgIH0pXG4gICAgbGlzdCA9IGxpc3QuY29uY2F0KHBhcmFtcyB8fCBbXSlcbiAgfSlcblxuICByZXR1cm4geyB0ZXJtOiBsaXN0LCBpc0FzY2lpIH1cbn1cblxuLyoqXG4gKiBDb21waWxlcyBhIHNlYXJjaCBxdWVyeSBpbnRvIGFuIElNQVAgY29tbWFuZC4gUXVlcmllcyBhcmUgY29tcG9zZWQgYXMgb2JqZWN0c1xuICogd2hlcmUga2V5cyBhcmUgc2VhcmNoIHRlcm1zIGFuZCB2YWx1ZXMgYXJlIHRlcm0gYXJndW1lbnRzLiBPbmx5IHN0cmluZ3MsXG4gKiBudW1iZXJzIGFuZCBEYXRlcyBhcmUgdXNlZC4gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCB0aGUgbWVtYmVycyBvZiBpdFxuICogYXJlIHByb2Nlc3NlZCBzZXBhcmF0ZWx5ICh1c2UgdGhpcyBmb3IgdGVybXMgdGhhdCByZXF1aXJlIG11bHRpcGxlIHBhcmFtcykuXG4gKiBJZiB0aGUgdmFsdWUgaXMgYSBEYXRlLCBpdCBpcyBjb252ZXJ0ZWQgdG8gdGhlIGZvcm0gb2YgXCIwMS1KYW4tMTk3MFwiLlxuICogU3VicXVlcmllcyAoT1IsIE5PVCkgYXJlIG1hZGUgdXAgb2Ygb2JqZWN0c1xuICpcbiAqICAgIHt1bnNlZW46IHRydWUsIGhlYWRlcjogW1wic3ViamVjdFwiLCBcImhlbGxvIHdvcmxkXCJdfTtcbiAqICAgIFNFQVJDSCBVTlNFRU4gSEVBREVSIFwic3ViamVjdFwiIFwiaGVsbG8gd29ybGRcIlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeSBTZWFyY2ggcXVlcnlcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9uIG9iamVjdFxuICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5ieVVpZF0gSWYgdHVyZSwgdXNlIFVJRCBTRUFSQ0ggaW5zdGVhZCBvZiBTRUFSQ0hcbiAqIEByZXR1cm4ge09iamVjdH0gSU1BUCBjb21tYW5kIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTRUFSQ0hDb21tYW5kKHF1ZXJ5ID0ge30sIG9wdGlvbnMgPSB7fSkge1xuICBsZXQgY29tbWFuZCA9IHtcbiAgICBjb21tYW5kOiBvcHRpb25zLmJ5VWlkID8gJ1VJRCBTRUFSQ0gnIDogJ1NFQVJDSCdcbiAgfVxuXG4gIGNvbnN0IHsgdGVybSwgaXNBc2NpaSB9ID0gYnVpbGRUZXJtKHF1ZXJ5KVxuICBjb21tYW5kLmF0dHJpYnV0ZXMgPSB0ZXJtXG5cbiAgLy8gSWYgYW55IHN0cmluZyBpbnB1dCBpcyB1c2luZyA4Yml0IGJ5dGVzLCBwcmVwZW5kIHRoZSBvcHRpb25hbCBDSEFSU0VUIGFyZ3VtZW50XG4gIGlmICghaXNBc2NpaSkge1xuICAgIGNvbW1hbmQuYXR0cmlidXRlcy51bnNoaWZ0KHtcbiAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgIHZhbHVlOiAnVVRGLTgnXG4gICAgfSlcbiAgICBjb21tYW5kLmF0dHJpYnV0ZXMudW5zaGlmdCh7XG4gICAgICB0eXBlOiAnYXRvbScsXG4gICAgICB2YWx1ZTogJ0NIQVJTRVQnXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiBjb21tYW5kXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFNPUlRDb21tYW5kKHNvcnRQcm9ncmFtID0gW10sIHF1ZXJ5ID0ge30sIG9wdGlvbnMgPSB7fSkge1xuICBsZXQgY29tbWFuZCA9IHtcbiAgICBjb21tYW5kOiBvcHRpb25zLmJ5VWlkID8gJ1VJRCBTT1JUJyA6ICdTT1JUJ1xuICB9XG5cbiAgY29uc3QgeyB0ZXJtOiBxdWVyeVRlcm0sIGlzQXNjaWkgfSA9IGJ1aWxkVGVybShxdWVyeSlcbiAgY29uc3Qgc29ydFRlcm0gPSBbc29ydFByb2dyYW0ubWFwKHMgPT4gKHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogcyB9KSldO1xuICBjb25zdCBjaGFyc2V0VGVybSA9IFt7XG4gICAgdHlwZTogJ2F0b20nLFxuICAgIHZhbHVlOiBpc0FzY2lpID8gJ1VTLUFTQ0lJJyA6ICdVVEYtOCdcbiAgfV07XG4gIGNvbW1hbmQuYXR0cmlidXRlcyA9IHNvcnRUZXJtLmNvbmNhdChjaGFyc2V0VGVybSwgcXVlcnlUZXJtKTtcblxuXG4gIHJldHVybiBjb21tYW5kXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBJTUFQIFNUT1JFIGNvbW1hbmQgZnJvbSB0aGUgc2VsZWN0ZWQgYXJndW1lbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFNUT1JFQ29tbWFuZChzZXF1ZW5jZSwgYWN0aW9uID0gJycsIGZsYWdzID0gW10sIG9wdGlvbnMgPSB7fSkge1xuICBsZXQgY29tbWFuZCA9IHtcbiAgICBjb21tYW5kOiBvcHRpb25zLmJ5VWlkID8gJ1VJRCBTVE9SRScgOiAnU1RPUkUnLFxuICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICB0eXBlOiAnc2VxdWVuY2UnLFxuICAgICAgdmFsdWU6IHNlcXVlbmNlXG4gICAgfV1cbiAgfVxuXG4gIGNvbW1hbmQuYXR0cmlidXRlcy5wdXNoKHtcbiAgICB0eXBlOiAnYXRvbScsXG4gICAgdmFsdWU6IGFjdGlvbi50b1VwcGVyQ2FzZSgpICsgKG9wdGlvbnMuc2lsZW50ID8gJy5TSUxFTlQnIDogJycpXG4gIH0pXG5cbiAgY29tbWFuZC5hdHRyaWJ1dGVzLnB1c2goZmxhZ3MubWFwKChmbGFnKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgIHZhbHVlOiBmbGFnXG4gICAgfVxuICB9KSlcblxuICByZXR1cm4gY29tbWFuZFxufVxuIl19