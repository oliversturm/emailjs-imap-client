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

function buildSORTCommand(sortProgram, query = {}, options = {}) {
  let command = {
    command: options.byUid ? 'UID SORT' : 'SORT'
  };

  const { term: queryTerm, isAscii } = buildTerm(query);
  const sortTerm = [{ type: 'SEQUENCE', value: sortProgram }];
  const charsetTerm = [{
    type: 'atom',
    value: 'CHARSET'
  }, {
    type: 'atom',
    value: isAscii ? 'US-ASCII' : 'UTF-8'
  }];
  command.attributes = charsetTerm.concat(sortTerm, queryTerm);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21tYW5kLWJ1aWxkZXIuanMiXSwibmFtZXMiOlsiYnVpbGRGRVRDSENvbW1hbmQiLCJidWlsZFhPQXV0aDJUb2tlbiIsImJ1aWxkU0VBUkNIQ29tbWFuZCIsImJ1aWxkU09SVENvbW1hbmQiLCJidWlsZFNUT1JFQ29tbWFuZCIsInNlcXVlbmNlIiwiaXRlbXMiLCJvcHRpb25zIiwiY29tbWFuZCIsImJ5VWlkIiwiYXR0cmlidXRlcyIsInR5cGUiLCJ2YWx1ZSIsInZhbHVlQXNTdHJpbmciLCJ1bmRlZmluZWQiLCJxdWVyeSIsImZvckVhY2giLCJpdGVtIiwidG9VcHBlckNhc2UiLCJ0cmltIiwidGVzdCIsInB1c2giLCJjbWQiLCJjb25jYXQiLCJlIiwibGVuZ3RoIiwicG9wIiwiY2hhbmdlZFNpbmNlIiwidXNlciIsInRva2VuIiwiYXV0aERhdGEiLCJqb2luIiwiYnVpbGRUZXJtIiwibGlzdCIsImlzQXNjaWkiLCJPYmplY3QiLCJrZXlzIiwia2V5IiwicGFyYW1zIiwiZm9ybWF0RGF0ZSIsImRhdGUiLCJ0b1VUQ1N0cmluZyIsInJlcGxhY2UiLCJlc2NhcGVQYXJhbSIsInBhcmFtIiwicHJvdG90eXBlIiwidG9TdHJpbmciLCJjYWxsIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwidG9Mb3dlckNhc2UiLCJ0ZXJtIiwidW5zaGlmdCIsInNvcnRQcm9ncmFtIiwicXVlcnlUZXJtIiwic29ydFRlcm0iLCJjaGFyc2V0VGVybSIsImFjdGlvbiIsImZsYWdzIiwic2lsZW50IiwiZmxhZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFnQmdCQSxpQixHQUFBQSxpQjtRQWlFQUMsaUIsR0FBQUEsaUI7UUF3R0FDLGtCLEdBQUFBLGtCO1FBdUJBQyxnQixHQUFBQSxnQjtRQXVCQUMsaUIsR0FBQUEsaUI7O0FBdk9oQjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFLQTs7Ozs7Ozs7QUFRTyxTQUFTSixpQkFBVCxDQUEyQkssUUFBM0IsRUFBcUNDLEtBQXJDLEVB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TUFEYTtBQUVuQkMsV0FBTztBQUZZLEdBQUQsRUFHakI7QUFDREQsVUFBTSxNQURMO0FBRURDLFdBQU9zQixVQUFVLFVBQVYsR0FBdUI7QUFGN0IsR0FIaUIsQ0FBcEI7QUFPQTFCLFVBQVFFLFVBQVIsR0FBcUIrQyxZQUFZbEMsTUFBWixDQUFtQmlDLFFBQW5CLEVBQTZCRCxTQUE3QixDQUFyQjs7QUFHQSxTQUFPL0MsT0FBUDtBQUNEOztBQUVEOzs7QUFHTyxTQUFTSixpQkFBVCxDQUEyQkMsUUFBM0IsRUFBcUNxRCxTQUFTLEVBQTlDLEVBQWtEQyxRQUFRLEVBQTFELEVBQThEcEQsVUFBVSxFQUF4RSxFQUE0RTtBQUNqRixNQUFJQyxVQUFVO0FBQ1pBLGFBQVNELFFBQVFFLEtBQVIsR0FBZ0IsV0FBaEIsR0FBOEIsT0FEM0I7QUFFWkMsZ0JBQVksQ0FBQztBQUNYQyxZQUFNLFVBREs7QUFFWEMsYUFBT1A7QUFGSSxLQUFEO0FBRkEsR0FBZDs7QUFRQUcsVUFBUUUsVUFBUixDQUFtQlcsSUFBbkIsQ0FBd0I7QUFDdEJWLFVBQU0sTUFEZ0I7QUFFdEJDLFdBQU84QyxPQUFPeEMsV0FBUCxNQUF3QlgsUUFBUXFELE1BQVIsR0FBaUIsU0FBakIsR0FBNkIsRUFBckQ7QUFGZSxHQUF4Qjs7QUFLQXBELFVBQVFFLFVBQVIsQ0FBbUJXLElBQW5CLENBQXdCc0MsTUFBTVQsR0FBTixDQUFXVyxJQUFELElBQVU7QUFDMUMsV0FBTztBQUNMbEQsWUFBTSxNQUREO0FBRUxDLGFBQU9pRDtBQUZGLEtBQVA7QUFJRCxHQUx1QixDQUF4Qjs7QUFPQSxTQUFPckQsT0FBUDtBQUNEIiwiZmlsZSI6ImNvbW1hbmQtYnVpbGRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhcnNlciB9IGZyb20gJ2VtYWlsanMtaW1hcC1oYW5kbGVyJ1xuaW1wb3J0IHsgZW5jb2RlIH0gZnJvbSAnZW1haWxqcy1taW1lLWNvZGVjJ1xuaW1wb3J0IHsgZW5jb2RlIGFzIGVuY29kZUJhc2U2NCB9IGZyb20gJ2VtYWlsanMtYmFzZTY0J1xuaW1wb3J0IHtcbiAgZnJvbVR5cGVkQXJyYXksXG4gIHRvVHlwZWRBcnJheVxufSBmcm9tICcuL2NvbW1vbidcblxuLyoqXG4gKiBCdWlsZHMgYSBGRVRDSCBjb21tYW5kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2UgcmFuZ2Ugc2VsZWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IGl0ZW1zIExpc3Qgb2YgZWxlbWVudHMgdG8gZmV0Y2ggKGVnLiBgWyd1aWQnLCAnZW52ZWxvcGUnXWApLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25hbCBvcHRpb25zIG9iamVjdC4gVXNlIGB7YnlVaWQ6dHJ1ZX1gIGZvciBgVUlEIEZFVENIYFxuICogQHJldHVybnMge09iamVjdH0gU3RydWN0dXJlZCBJTUFQIGNvbW1hbmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRkVUQ0hDb21tYW5kKHNlcXVlbmNlLCBpdGVtcywgb3B0aW9ucykge1xuICBsZXQgY29tbWFuZCA9IHtcbiAgICBjb21tYW5kOiBvcHRpb25zLmJ5VWlkID8gJ1VJRCBGRVRDSCcgOiAnRkVUQ0gnLFxuICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICB0eXBlOiAnU0VRVUVOQ0UnLFxuICAgICAgdmFsdWU6IHNlcXVlbmNlXG4gICAgfV1cbiAgfVxuXG4gIGlmIChvcHRpb25zLnZhbHVlQXNTdHJpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbW1hbmQudmFsdWVBc1N0cmluZyA9IG9wdGlvbnMudmFsdWVBc1N0cmluZ1xuICB9XG5cbiAgbGV0IHF1ZXJ5ID0gW11cblxuICBpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgaXRlbSA9IGl0ZW0udG9VcHBlckNhc2UoKS50cmltKClcblxuICAgIGlmICgvXlxcdyskLy50ZXN0KGl0ZW0pKSB7XG4gICAgICAvLyBhbHBoYW51bSBzdHJpbmdzIGNhbiBiZSB1c2VkIGRpcmVjdGx5XG4gICAgICBxdWVyeS5wdXNoKHtcbiAgICAgICAgdHlwZTogJ0FUT00nLFxuICAgICAgICB2YWx1ZTogaXRlbVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKGl0ZW0pIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIHBhcnNlIHRoZSB2YWx1ZSBhcyBhIGZha2UgY29tbWFuZCwgdXNlIG9ubHkgdGhlIGF0dHJpYnV0ZXMgYmxvY2tcbiAgICAgICAgY29uc3QgY21kID0gcGFyc2VyKHRvVHlwZWRBcnJheSgnKiBaICcgKyBpdGVtKSlcbiAgICAgICAgcXVlcnkgPSBxdWVyeS5jb25jYXQoY21kLmF0dHJpYnV0ZXMgfHwgW10pXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGlmIHBhcnNlIGZhaWxlZCwgdXNlIHRoZSBvcmlnaW5hbCBzdHJpbmcgYXMgb25lIGVudGl0eVxuICAgICAgICBxdWVyeS5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnQVRPTScsXG4gICAgICAgICAgdmFsdWU6IGl0ZW1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgaWYgKHF1ZXJ5Lmxlbmd0aCA9PT0gMSkge1xuICAgIHF1ZXJ5ID0gcXVlcnkucG9wKClcbiAgfVxuXG4gIGNvbW1hbmQuYXR0cmlidXRlcy5wdXNoKHF1ZXJ5KVxuXG4gIGlmIChvcHRpb25zLmNoYW5nZWRTaW5jZSkge1xuICAgIGNvbW1hbmQuYXR0cmlidXRlcy5wdXNoKFt7XG4gICAgICB0eXBlOiAnQVRPTScsXG4gICAgICB2YWx1ZTogJ0NIQU5HRURTSU5DRSdcbiAgICB9LCB7XG4gICAgICB0eXBlOiAnQVRPTScsXG4gICAgICB2YWx1ZTogb3B0aW9ucy5jaGFuZ2VkU2luY2VcbiAgICB9XSlcbiAgfVxuXG4gIHJldHVybiBjb21tYW5kXG59XG5cbi8qKlxuICogQnVpbGRzIGEgbG9naW4gdG9rZW4gZm9yIFhPQVVUSDIgYXV0aGVudGljYXRpb24gY29tbWFuZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VyIEUtbWFpbCBhZGRyZXNzIG9mIHRoZSB1c2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gdG9rZW4gVmFsaWQgYWNjZXNzIHRva2VuIGZvciB0aGUgdXNlclxuICogQHJldHVybiB7U3RyaW5nfSBCYXNlNjQgZm9ybWF0dGVkIGxvZ2luIHRva2VuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFhPQXV0aDJUb2tlbih1c2VyID0gJycsIHRva2VuKSB7XG4gIGxldCBhdXRoRGF0YSA9IFtcbiAgICBgdXNlcj0ke3VzZXJ9YCxcbiAgICBgYXV0aD1CZWFyZXIgJHt0b2tlbn1gLFxuICAgICcnLFxuICAgICcnXG4gIF1cbiAgcmV0dXJuIGVuY29kZUJhc2U2NChhdXRoRGF0YS5qb2luKCdcXHgwMScpKVxufVxuXG5sZXQgYnVpbGRUZXJtID0gKHF1ZXJ5KSA9PiB7XG4gIGxldCBsaXN0ID0gW11cbiAgbGV0IGlzQXNjaWkgPSB0cnVlXG5cbiAgT2JqZWN0LmtleXMocXVlcnkpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIGxldCBwYXJhbXMgPSBbXVxuICAgIGxldCBmb3JtYXREYXRlID0gKGRhdGUpID0+IGRhdGUudG9VVENTdHJpbmcoKS5yZXBsYWNlKC9eXFx3KywgMD8oXFxkKykgKFxcdyspIChcXGQrKS4qLywgJyQxLSQyLSQzJylcbiAgICBsZXQgZXNjYXBlUGFyYW0gPSAocGFyYW0pID0+IHtcbiAgICAgIGlmICh0eXBlb2YgcGFyYW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgdmFsdWU6IHBhcmFtXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHBhcmFtID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoL1tcXHUwMDgwLVxcdUZGRkZdLy50ZXN0KHBhcmFtKSkge1xuICAgICAgICAgIGlzQXNjaWkgPSBmYWxzZVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnbGl0ZXJhbCcsXG4gICAgICAgICAgICB2YWx1ZTogZnJvbVR5cGVkQXJyYXkoZW5jb2RlKHBhcmFtKSkgLy8gY2FzdCB1bmljb2RlIHN0cmluZyB0byBwc2V1ZG8tYmluYXJ5IGFzIGltYXAtaGFuZGxlciBjb21waWxlcyBzdHJpbmdzIGFzIG9jdGV0c1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgIHZhbHVlOiBwYXJhbVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChwYXJhbSkgPT09ICdbb2JqZWN0IERhdGVdJykge1xuICAgICAgICAvLyBSRkMgMzUwMSBhbGxvd3MgZm9yIGRhdGVzIHRvIGJlIHBsYWNlZCBpblxuICAgICAgICAvLyBkb3VibGUtcXVvdGVzIG9yIGxlZnQgd2l0aG91dCBxdW90ZXMuICBTb21lXG4gICAgICAgIC8vIHNlcnZlcnMgKFlhbmRleCksIGRvIG5vdCBsaWtlIHRoZSBkb3VibGUgcXVvdGVzLFxuICAgICAgICAvLyBzbyB3ZSB0cmVhdCB0aGUgZGF0ZSBhcyBhbiBhdG9tLlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdhdG9tJyxcbiAgICAgICAgICB2YWx1ZTogZm9ybWF0RGF0ZShwYXJhbSlcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHBhcmFtKSkge1xuICAgICAgICByZXR1cm4gcGFyYW0ubWFwKGVzY2FwZVBhcmFtKVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBidWlsZFRlcm0ocGFyYW0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFyYW1zLnB1c2goe1xuICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgdmFsdWU6IGtleS50b1VwcGVyQ2FzZSgpXG4gICAgfSk7XG5cbiAgICBbXS5jb25jYXQocXVlcnlba2V5XSB8fCBbXSkuZm9yRWFjaCgocGFyYW0pID0+IHtcbiAgICAgIHN3aXRjaCAoa2V5LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgY2FzZSAndWlkJzpcbiAgICAgICAgICBwYXJhbSA9IHtcbiAgICAgICAgICAgIHR5cGU6ICdzZXF1ZW5jZScsXG4gICAgICAgICAgICB2YWx1ZTogcGFyYW1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgLy8gVGhlIEdtYWlsIGV4dGVuc2lvbiB2YWx1ZXMgb2YgWC1HTS1USFJJRCBhbmRcbiAgICAgICAgLy8gWC1HTS1NU0dJRCBhcmUgZGVmaW5lZCB0byBiZSB1bnNpZ25lZCA2NC1iaXQgaW50ZWdlcnNcbiAgICAgICAgLy8gYW5kIHRoZXkgbXVzdCBub3QgYmUgcXVvdGVkIHN0cmluZ3Mgb3IgdGhlIHNlcnZlclxuICAgICAgICAvLyB3aWxsIHJlcG9ydCBhIHBhcnNlIGVycm9yLlxuICAgICAgICBjYXNlICd4LWdtLXRocmlkJzpcbiAgICAgICAgY2FzZSAneC1nbS1tc2dpZCc6XG4gICAgICAgICAgcGFyYW0gPSB7XG4gICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgIHZhbHVlOiBwYXJhbVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHBhcmFtID0gZXNjYXBlUGFyYW0ocGFyYW0pXG4gICAgICB9XG4gICAgICBpZiAocGFyYW0pIHtcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zLmNvbmNhdChwYXJhbSB8fCBbXSlcbiAgICAgIH1cbiAgICB9KVxuICAgIGxpc3QgPSBsaXN0LmNvbmNhdChwYXJhbXMgfHwgW10pXG4gIH0pXG5cbiAgcmV0dXJuIHsgdGVybTogbGlzdCwgaXNBc2NpaSB9XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYSBzZWFyY2ggcXVlcnkgaW50byBhbiBJTUFQIGNvbW1hbmQuIFF1ZXJpZXMgYXJlIGNvbXBvc2VkIGFzIG9iamVjdHNcbiAqIHdoZXJlIGtleXMgYXJlIHNlYXJjaCB0ZXJtcyBhbmQgdmFsdWVzIGFyZSB0ZXJtIGFyZ3VtZW50cy4gT25seSBzdHJpbmdzLFxuICogbnVtYmVycyBhbmQgRGF0ZXMgYXJlIHVzZWQuIElmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwgdGhlIG1lbWJlcnMgb2YgaXRcbiAqIGFyZSBwcm9jZXNzZWQgc2VwYXJhdGVseSAodXNlIHRoaXMgZm9yIHRlcm1zIHRoYXQgcmVxdWlyZSBtdWx0aXBsZSBwYXJhbXMpLlxuICogSWYgdGhlIHZhbHVlIGlzIGEgRGF0ZSwgaXQgaXMgY29udmVydGVkIHRvIHRoZSBmb3JtIG9mIFwiMDEtSmFuLTE5NzBcIi5cbiAqIFN1YnF1ZXJpZXMgKE9SLCBOT1QpIGFyZSBtYWRlIHVwIG9mIG9iamVjdHNcbiAqXG4gKiAgICB7dW5zZWVuOiB0cnVlLCBoZWFkZXI6IFtcInN1YmplY3RcIiwgXCJoZWxsbyB3b3JsZFwiXX07XG4gKiAgICBTRUFSQ0ggVU5TRUVOIEhFQURFUiBcInN1YmplY3RcIiBcImhlbGxvIHdvcmxkXCJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgU2VhcmNoIHF1ZXJ5XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuYnlVaWRdIElmIHR1cmUsIHVzZSBVSUQgU0VBUkNIIGluc3RlYWQgb2YgU0VBUkNIXG4gKiBAcmV0dXJuIHtPYmplY3R9IElNQVAgY29tbWFuZCBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU0VBUkNIQ29tbWFuZChxdWVyeSA9IHt9LCBvcHRpb25zID0ge30pIHtcbiAgbGV0IGNvbW1hbmQgPSB7XG4gICAgY29tbWFuZDogb3B0aW9ucy5ieVVpZCA/ICdVSUQgU0VBUkNIJyA6ICdTRUFSQ0gnXG4gIH1cblxuICBjb25zdCB7IHRlcm0sIGlzQXNjaWkgfSA9IGJ1aWxkVGVybShxdWVyeSlcbiAgY29tbWFuZC5hdHRyaWJ1dGVzID0gdGVybVxuXG4gIC8vIElmIGFueSBzdHJpbmcgaW5wdXQgaXMgdXNpbmcgOGJpdCBieXRlcywgcHJlcGVuZCB0aGUgb3B0aW9uYWwgQ0hBUlNFVCBhcmd1bWVudFxuICBpZiAoIWlzQXNjaWkpIHtcbiAgICBjb21tYW5kLmF0dHJpYnV0ZXMudW5zaGlmdCh7XG4gICAgICB0eXBlOiAnYXRvbScsXG4gICAgICB2YWx1ZTogJ1VURi04J1xuICAgIH0pXG4gICAgY29tbWFuZC5hdHRyaWJ1dGVzLnVuc2hpZnQoe1xuICAgICAgdHlwZTogJ2F0b20nLFxuICAgICAgdmFsdWU6ICdDSEFSU0VUJ1xuICAgIH0pXG4gIH1cblxuICByZXR1cm4gY29tbWFuZFxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTT1JUQ29tbWFuZChzb3J0UHJvZ3JhbSwgcXVlcnkgPSB7fSwgb3B0aW9ucyA9IHt9KSB7XG4gIGxldCBjb21tYW5kID0ge1xuICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIFNPUlQnIDogJ1NPUlQnXG4gIH1cblxuICBjb25zdCB7IHRlcm06IHF1ZXJ5VGVybSwgaXNBc2NpaSB9ID0gYnVpbGRUZXJtKHF1ZXJ5KVxuICBjb25zdCBzb3J0VGVybSA9IFt7IHR5cGU6ICdTRVFVRU5DRScsIHZhbHVlOiBzb3J0UHJvZ3JhbSB9XVxuICBjb25zdCBjaGFyc2V0VGVybSA9IFt7XG4gICAgdHlwZTogJ2F0b20nLFxuICAgIHZhbHVlOiAnQ0hBUlNFVCdcbiAgfSwge1xuICAgIHR5cGU6ICdhdG9tJyxcbiAgICB2YWx1ZTogaXNBc2NpaSA/ICdVUy1BU0NJSScgOiAnVVRGLTgnXG4gIH1dO1xuICBjb21tYW5kLmF0dHJpYnV0ZXMgPSBjaGFyc2V0VGVybS5jb25jYXQoc29ydFRlcm0sIHF1ZXJ5VGVybSk7XG5cblxuICByZXR1cm4gY29tbWFuZFxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gSU1BUCBTVE9SRSBjb21tYW5kIGZyb20gdGhlIHNlbGVjdGVkIGFyZ3VtZW50c1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTVE9SRUNvbW1hbmQoc2VxdWVuY2UsIGFjdGlvbiA9ICcnLCBmbGFncyA9IFtdLCBvcHRpb25zID0ge30pIHtcbiAgbGV0IGNvbW1hbmQgPSB7XG4gICAgY29tbWFuZDogb3B0aW9ucy5ieVVpZCA/ICdVSUQgU1RPUkUnIDogJ1NUT1JFJyxcbiAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgdHlwZTogJ3NlcXVlbmNlJyxcbiAgICAgIHZhbHVlOiBzZXF1ZW5jZVxuICAgIH1dXG4gIH1cblxuICBjb21tYW5kLmF0dHJpYnV0ZXMucHVzaCh7XG4gICAgdHlwZTogJ2F0b20nLFxuICAgIHZhbHVlOiBhY3Rpb24udG9VcHBlckNhc2UoKSArIChvcHRpb25zLnNpbGVudCA/ICcuU0lMRU5UJyA6ICcnKVxuICB9KVxuXG4gIGNvbW1hbmQuYXR0cmlidXRlcy5wdXNoKGZsYWdzLm1hcCgoZmxhZykgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnYXRvbScsXG4gICAgICB2YWx1ZTogZmxhZ1xuICAgIH1cbiAgfSkpXG5cbiAgcmV0dXJuIGNvbW1hbmRcbn1cbiJdfQ==