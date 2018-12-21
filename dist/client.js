'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_CLIENT_ID = exports.STATE_LOGOUT = exports.STATE_SELECTED = exports.STATE_AUTHENTICATED = exports.STATE_NOT_AUTHENTICATED = exports.STATE_CONNECTING = exports.TIMEOUT_IDLE = exports.TIMEOUT_NOOP = exports.TIMEOUT_CONNECTION = undefined;

var _ramda = require('ramda');

var _emailjsUtf = require('emailjs-utf7');

var _commandParser = require('./command-parser');

var _commandBuilder = require('./command-builder');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _imap = require('./imap');

var _imap2 = _interopRequireDefault(_imap);

var _common = require('./common');

var _specialUse = require('./special-use');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const TIMEOUT_CONNECTION = exports.TIMEOUT_CONNECTION = 90 * 1000; // Milliseconds to wait for the IMAP greeting from the server
const TIMEOUT_NOOP = exports.TIMEOUT_NOOP = 60 * 1000; // Milliseconds between NOOP commands while idling
const TIMEOUT_IDLE = exports.TIMEOUT_IDLE = 60 * 1000; // Milliseconds until IDLE command is cancelled

const STATE_CONNECTING = exports.STATE_CONNECTING = 1;
const STATE_NOT_AUTHENTICATED = exports.STATE_NOT_AUTHENTICATED = 2;
const STATE_AUTHENTICATED = exports.STATE_AUTHENTICATED = 3;
const STATE_SELECTED = exports.STATE_SELECTED = 4;
const STATE_LOGOUT = exports.STATE_LOGOUT = 5;

const DEFAULT_CLIENT_ID = exports.DEFAULT_CLIENT_ID = {
  name: 'emailjs-imap-client'

  /**
   * emailjs IMAP client
   *
   * @constructor
   *
   * @param {String} [host='localhost'] Hostname to conenct to
   * @param {Number} [port=143] Port number to connect to
   * @param {Object} [options] Optional options object
   */
};class Client {
  constructor(host, port, options = {}) {
    this.timeoutConnection = TIMEOUT_CONNECTION;
    this.timeoutNoop = TIMEOUT_NOOP;
    this.timeoutIdle = TIMEOUT_IDLE;

    this.serverId = false; // RFC 2971 Server ID as key value pairs

    // Event placeholders
    this.oncert = null;
    this.onupdate = null;
    this.onselectmailbox = null;
    this.onclosemailbox = null;

    this._host = host;
    this._clientId = (0, _ramda.propOr)(DEFAULT_CLIENT_ID, 'id', options);
    this._state = false; // Current state
    this._authenticated = false; // Is the connection authenticated
    this._capability = []; // List of extensions the server supports
    this._selectedMailbox = false; // Selected mailbox
    this._enteredIdle = false;
    this._idleTimeout = false;
    this._enableCompression = !!options.enableCompression;
    this._auth = options.auth;
    this._requireTLS = !!options.requireTLS;
    this._ignoreTLS = !!options.ignoreTLS;

    this.client = new _imap2.default(host, port, options); // IMAP client object

    // Event Handlers
    this.client.onerror = this._onError.bind(this);
    this.client.oncert = cert => this.oncert && this.oncert(cert); // allows certificate handling for platforms w/o native tls support
    this.client.onidle = () => this._onIdle(); // start idling

    // Default handlers for untagged responses
    this.client.setHandler('capability', response => this._untaggedCapabilityHandler(response)); // capability updates
    this.client.setHandler('ok', response => this._untaggedOkHandler(response)); // notifications
    this.client.setHandler('exists', response => this._untaggedExistsHandler(response)); // message count has changed
    this.client.setHandler('expunge', response => this._untaggedExpungeHandler(response)); // message has been deleted
    this.client.setHandler('fetch', response => this._untaggedFetchHandler(response)); // message has been updated (eg. flag change)

    // Activate logging
    this.createLogger();
    this.logLevel = (0, _ramda.propOr)(_common.LOG_LEVEL_ALL, 'logLevel', options);
  }

  /**
   * Called if the lower-level ImapClient has encountered an unrecoverable
   * error during operation. Cleans up and propagates the error upwards.
   */
  _onError(err) {
    // make sure no idle timeout is pending anymore
    clearTimeout(this._idleTimeout);

    // propagate the error upwards
    this.onerror && this.onerror(err);
  }

  //
  //
  // PUBLIC API
  //
  //

  /**
   * Initiate connection to the IMAP server
   *
   * @returns {Promise} Promise when login procedure is complete
   */
  connect() {
    var _this = this;

    return _asyncToGenerator(function* () {
      try {
        yield _this._openConnection();
        _this._changeState(STATE_NOT_AUTHENTICATED);
        yield _this.updateCapability();
        yield _this.upgradeConnection();
        try {
          yield _this.updateId(_this._clientId);
        } catch (err) {
          _this.logger.warn('Failed to update server id!', err.message);
        }

        yield _this.login(_this._auth);
        yield _this.compressConnection();
        _this.logger.debug('Connection established, ready to roll!');
        _this.client.onerror = _this._onError.bind(_this);
      } catch (err) {
        _this.logger.error('Could not connect to server', err);
        _this.close(err); // we don't really care whether this works or not
        throw err;
      }
    })();
  }

  _openConnection() {
    return new Promise((resolve, reject) => {
      let connectionTimeout = setTimeout(() => reject(new Error('Timeout connecting to server')), this.timeoutConnection);
      this.logger.debug('Connecting to', this.client.host, ':', this.client.port);
      this._changeState(STATE_CONNECTING);
      this.client.connect().then(() => {
        this.logger.debug('Socket opened, waiting for greeting from the server...');

        this.client.onready = () => {
          clearTimeout(connectionTimeout);
          resolve();
        };

        this.client.onerror = err => {
          clearTimeout(connectionTimeout);
          reject(err);
        };
      }).catch(reject);
    });
  }

  /**
   * Logout
   *
   * Send LOGOUT, to which the server responds by closing the connection.
   * Use is discouraged if network status is unclear! If networks status is
   * unclear, please use #close instead!
   *
   * LOGOUT details:
   *   https://tools.ietf.org/html/rfc3501#section-6.1.3
   *
   * @returns {Promise} Resolves when server has closed the connection
   */
  logout() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      _this2._changeState(STATE_LOGOUT);
      _this2.logger.debug('Logging out...');
      yield _this2.client.logout();
      clearTimeout(_this2._idleTimeout);
    })();
  }

  /**
   * Force-closes the current connection by closing the TCP socket.
   *
   * @returns {Promise} Resolves when socket is closed
   */
  close(err) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      _this3._changeState(STATE_LOGOUT);
      clearTimeout(_this3._idleTimeout);
      _this3.logger.debug('Closing connection...');
      yield _this3.client.close(err);
      clearTimeout(_this3._idleTimeout);
    })();
  }

  /**
   * Runs ID command, parses ID response, sets this.serverId
   *
   * ID details:
   *   http://tools.ietf.org/html/rfc2971
   *
   * @param {Object} id ID as JSON object. See http://tools.ietf.org/html/rfc2971#section-3.3 for possible values
   * @returns {Promise} Resolves when response has been parsed
   */
  updateId(id) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (_this4._capability.indexOf('ID') < 0) return;

      _this4.logger.debug('Updating id...');

      const command = 'ID';
      const attributes = id ? [(0, _ramda.flatten)(Object.entries(id))] : [null];
      const response = yield _this4.exec({ command, attributes }, 'ID');
      const list = (0, _ramda.flatten)((0, _ramda.pathOr)([], ['payload', 'ID', '0', 'attributes', '0'], response).map(Object.values));
      const keys = list.filter(function (_, i) {
        return i % 2 === 0;
      });
      const values = list.filter(function (_, i) {
        return i % 2 === 1;
      });
      _this4.serverId = (0, _ramda.fromPairs)((0, _ramda.zip)(keys, values));
      _this4.logger.debug('Server id updated!', _this4.serverId);
    })();
  }

  _shouldSelectMailbox(path, ctx) {
    if (!ctx) {
      return true;
    }

    const previousSelect = this.client.getPreviouslyQueued(['SELECT', 'EXAMINE'], ctx);
    if (previousSelect && previousSelect.request.attributes) {
      const pathAttribute = previousSelect.request.attributes.find(attribute => attribute.type === 'STRING');
      if (pathAttribute) {
        return pathAttribute.value !== path;
      }
    }

    return this._selectedMailbox !== path;
  }

  /**
   * Runs SELECT or EXAMINE to open a mailbox
   *
   * SELECT details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.1
   * EXAMINE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.2
   *
   * @param {String} path Full path to mailbox
   * @param {Object} [options] Options object
   * @returns {Promise} Promise with information about the selected mailbox
   */
  selectMailbox(path, options = {}) {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      let query = {
        command: options.readOnly ? 'EXAMINE' : 'SELECT',
        attributes: [{ type: 'STRING', value: path }]
      };

      if (options.condstore && _this5._capability.indexOf('CONDSTORE') >= 0) {
        query.attributes.push([{ type: 'ATOM', value: 'CONDSTORE' }]);
      }

      _this5.logger.debug('Opening', path, '...');
      const response = yield _this5.exec(query, ['EXISTS', 'FLAGS', 'OK'], { ctx: options.ctx });
      let mailboxInfo = (0, _commandParser.parseSELECT)(response);

      _this5._changeState(STATE_SELECTED);

      if (_this5._selectedMailbox !== path && _this5.onclosemailbox) {
        yield _this5.onclosemailbox(_this5._selectedMailbox);
      }
      _this5._selectedMailbox = path;
      if (_this5.onselectmailbox) {
        yield _this5.onselectmailbox(path, mailboxInfo);
      }

      return mailboxInfo;
    })();
  }

  /**
   * Runs NAMESPACE command
   *
   * NAMESPACE details:
   *   https://tools.ietf.org/html/rfc2342
   *
   * @returns {Promise} Promise with namespace object
   */
  listNamespaces() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      if (_this6._capability.indexOf('NAMESPACE') < 0) return false;

      _this6.logger.debug('Listing namespaces...');
      const response = yield _this6.exec('NAMESPACE', 'NAMESPACE');
      return (0, _commandParser.parseNAMESPACE)(response);
    })();
  }

  /**
   * Runs LIST and LSUB commands. Retrieves a tree of available mailboxes
   *
   * LIST details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.8
   * LSUB details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.9
   *
   * @returns {Promise} Promise with list of mailboxes
   */
  listMailboxes() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      const tree = { root: true, children: [] };

      _this7.logger.debug('Listing mailboxes...');
      const listResponse = yield _this7.exec({ command: 'LIST', attributes: ['', '*'] }, 'LIST');
      const list = (0, _ramda.pathOr)([], ['payload', 'LIST'], listResponse);
      list.forEach(function (item) {
        const attr = (0, _ramda.propOr)([], 'attributes', item);
        if (attr.length < 3) return;

        const path = (0, _ramda.pathOr)('', ['2', 'value'], attr);
        const delim = (0, _ramda.pathOr)('/', ['1', 'value'], attr);
        const branch = _this7._ensurePath(tree, path, delim);
        branch.flags = (0, _ramda.propOr)([], '0', attr).map(function ({ value }) {
          return value || '';
        });
        branch.listed = true;
        (0, _specialUse.checkSpecialUse)(branch);
      });

      const lsubResponse = yield _this7.exec({ command: 'LSUB', attributes: ['', '*'] }, 'LSUB');
      const lsub = (0, _ramda.pathOr)([], ['payload', 'LSUB'], lsubResponse);
      lsub.forEach(function (item) {
        const attr = (0, _ramda.propOr)([], 'attributes', item);
        if (attr.length < 3) return;

        const path = (0, _ramda.pathOr)('', ['2', 'value'], attr);
        const delim = (0, _ramda.pathOr)('/', ['1', 'value'], attr);
        const branch = _this7._ensurePath(tree, path, delim);
        (0, _ramda.propOr)([], '0', attr).map(function (flag = '') {
          branch.flags = (0, _ramda.union)(branch.flags, [flag]);
        });
        branch.subscribed = true;
      });

      return tree;
    })();
  }

  /**
   * Create a mailbox with the given path.
   *
   * CREATE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.3
   *
   * @param {String} path
   *     The path of the mailbox you would like to create.  This method will
   *     handle utf7 encoding for you.
   * @returns {Promise}
   *     Promise resolves if mailbox was created.
   *     In the event the server says NO [ALREADYEXISTS], we treat that as success.
   */
  createMailbox(path) {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      _this8.logger.debug('Creating mailbox', path, '...');
      try {
        yield _this8.exec({ command: 'CREATE', attributes: [(0, _emailjsUtf.imapEncode)(path)] });
      } catch (err) {
        if (err && err.code === 'ALREADYEXISTS') {
          return;
        }
        throw err;
      }
    })();
  }

  /**
   * Delete a mailbox with the given path.
   *
   * DELETE details:
   *   https://tools.ietf.org/html/rfc3501#section-6.3.4
   *
   * @param {String} path
   *     The path of the mailbox you would like to delete.  This method will
   *     handle utf7 encoding for you.
   * @returns {Promise}
   *     Promise resolves if mailbox was deleted.
   */
  deleteMailbox(path) {
    this.logger.debug('Deleting mailbox', path, '...');
    return this.exec({ command: 'DELETE', attributes: [(0, _emailjsUtf.imapEncode)(path)] });
  }

  /**
   * Runs FETCH command
   *
   * FETCH details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.5
   * CHANGEDSINCE details:
   *   https://tools.ietf.org/html/rfc4551#section-3.3
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Sequence set, eg 1:* for all messages
   * @param {Object} [items] Message data item names or macro
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the fetched message info
   */
  listMessages(path, sequence, items = [{ fast: true }], options = {}) {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      _this9.logger.debug('Fetching messages', sequence, 'from', path, '...');
      const command = (0, _commandBuilder.buildFETCHCommand)(sequence, items, options);
      const response = yield _this9.exec(command, 'FETCH', {
        precheck: function (ctx) {
          return _this9._shouldSelectMailbox(path, ctx) ? _this9.selectMailbox(path, { ctx }) : Promise.resolve();
        }
      });
      return (0, _commandParser.parseFETCH)(response);
    })();
  }

  /**
   * Runs SEARCH command
   *
   * SEARCH details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.4
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {Object} query Search terms
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  search(path, query, options = {}) {
    var _this10 = this;

    return _asyncToGenerator(function* () {
      _this10.logger.debug('Searching in', path, '...');
      const command = (0, _commandBuilder.buildSEARCHCommand)(query, options);
      const response = yield _this10.exec(command, 'SEARCH', {
        precheck: function (ctx) {
          return _this10._shouldSelectMailbox(path, ctx) ? _this10.selectMailbox(path, { ctx }) : Promise.resolve();
        }
      });
      return (0, _commandParser.parseSEARCH)(response);
    })();
  }

  /**
   * Runs SORT command
   *
   * SORT details:
   *   https://tools.ietf.org/html/rfc5256#section-3
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {Object} sortProgram Sort criteria
   * @param {Object} query Search terms
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  sort(path, sortProgram, query, options = {}) {
    var _this11 = this;

    return _asyncToGenerator(function* () {
      if (_this11._capability.indexOf('SORT') >= 0) {
        _this11.logger.debug('Sorting in', path, '...');
        const command = (0, _commandBuilder.buildSORTCommand)(sortProgram, query, options);
        const response = yield _this11.exec(command, 'SORT', {
          precheck: function (ctx) {
            return _this11._shouldSelectMailbox(path, ctx) ? _this11.selectMailbox(path, { ctx }) : Promise.resolve();
          }
        });

        return (0, _commandParser.parseSORT)(response);
      } else {
        _this11.logger.debug('SORT capability is not supported');
        return null;
      }
    })();
  }

  /**
   * Runs STORE command
   *
   * STORE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.6
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message selector which the flag change is applied to
   * @param {Array} flags
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  setFlags(path, sequence, flags, options) {
    let key = '';
    let list = [];

    if (Array.isArray(flags) || typeof flags !== 'object') {
      list = [].concat(flags || []);
      key = '';
    } else if (flags.add) {
      list = [].concat(flags.add || []);
      key = '+';
    } else if (flags.set) {
      key = '';
      list = [].concat(flags.set || []);
    } else if (flags.remove) {
      key = '-';
      list = [].concat(flags.remove || []);
    }

    this.logger.debug('Setting flags on', sequence, 'in', path, '...');
    return this.store(path, sequence, key + 'FLAGS', list, options);
  }

  /**
   * Runs STORE command
   *
   * STORE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.6
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message selector which the flag change is applied to
   * @param {String} action STORE method to call, eg "+FLAGS"
   * @param {Array} flags
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  store(path, sequence, action, flags, options = {}) {
    var _this12 = this;

    return _asyncToGenerator(function* () {
      const command = (0, _commandBuilder.buildSTORECommand)(sequence, action, flags, options);
      const response = yield _this12.exec(command, 'FETCH', {
        precheck: function (ctx) {
          return _this12._shouldSelectMailbox(path, ctx) ? _this12.selectMailbox(path, { ctx }) : Promise.resolve();
        }
      });
      return (0, _commandParser.parseFETCH)(response);
    })();
  }

  /**
   * Runs APPEND command
   *
   * APPEND details:
   *   http://tools.ietf.org/html/rfc3501#section-6.3.11
   *
   * @param {String} destination The mailbox where to append the message
   * @param {String} message The message to append
   * @param {Array} options.flags Any flags you want to set on the uploaded message. Defaults to [\Seen]. (optional)
   * @returns {Promise} Promise with the array of matching seq. or uid numbers
   */
  upload(destination, message, options = {}) {
    let flags = (0, _ramda.propOr)(['\\Seen'], 'flags', options).map(value => ({ type: 'atom', value }));
    let command = {
      command: 'APPEND',
      attributes: [{ type: 'atom', value: destination }, flags, { type: 'literal', value: message }]
    };

    this.logger.debug('Uploading message to', destination, '...');
    return this.exec(command);
  }

  /**
   * Deletes messages from a selected mailbox
   *
   * EXPUNGE details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.3
   * UID EXPUNGE details:
   *   https://tools.ietf.org/html/rfc4315#section-2.1
   *
   * If possible (byUid:true and UIDPLUS extension supported), uses UID EXPUNGE
   * command to delete a range of messages, otherwise falls back to EXPUNGE.
   *
   * NB! This method might be destructive - if EXPUNGE is used, then any messages
   * with \Deleted flag set are deleted
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message range to be deleted
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise
   */
  deleteMessages(path, sequence, options = {}) {
    var _this13 = this;

    return _asyncToGenerator(function* () {
      // add \Deleted flag to the messages and run EXPUNGE or UID EXPUNGE
      _this13.logger.debug('Deleting messages', sequence, 'in', path, '...');
      const useUidPlus = options.byUid && _this13._capability.indexOf('UIDPLUS') >= 0;
      const uidExpungeCommand = { command: 'UID EXPUNGE', attributes: [{ type: 'sequence', value: sequence }] };
      yield _this13.setFlags(path, sequence, { add: '\\Deleted' }, options);
      const cmd = useUidPlus ? uidExpungeCommand : 'EXPUNGE';
      return _this13.exec(cmd, null, {
        precheck: function (ctx) {
          return _this13._shouldSelectMailbox(path, ctx) ? _this13.selectMailbox(path, { ctx }) : Promise.resolve();
        }
      });
    })();
  }

  /**
   * Copies a range of messages from the active mailbox to the destination mailbox.
   * Silent method (unless an error occurs), by default returns no information.
   *
   * COPY details:
   *   http://tools.ietf.org/html/rfc3501#section-6.4.7
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message range to be copied
   * @param {String} destination Destination mailbox path
   * @param {Object} [options] Query modifiers
   * @param {Boolean} [options.byUid] If true, uses UID COPY instead of COPY
   * @returns {Promise} Promise
   */
  copyMessages(path, sequence, destination, options = {}) {
    var _this14 = this;

    return _asyncToGenerator(function* () {
      _this14.logger.debug('Copying messages', sequence, 'from', path, 'to', destination, '...');
      const { humanReadable } = yield _this14.exec({
        command: options.byUid ? 'UID COPY' : 'COPY',
        attributes: [{ type: 'sequence', value: sequence }, { type: 'atom', value: destination }]
      }, null, {
        precheck: function (ctx) {
          return _this14._shouldSelectMailbox(path, ctx) ? _this14.selectMailbox(path, { ctx }) : Promise.resolve();
        }
      });
      return humanReadable || 'COPY completed';
    })();
  }

  /**
   * Moves a range of messages from the active mailbox to the destination mailbox.
   * Prefers the MOVE extension but if not available, falls back to
   * COPY + EXPUNGE
   *
   * MOVE details:
   *   http://tools.ietf.org/html/rfc6851
   *
   * @param {String} path The path for the mailbox which should be selected for the command. Selects mailbox if necessary
   * @param {String} sequence Message range to be moved
   * @param {String} destination Destination mailbox path
   * @param {Object} [options] Query modifiers
   * @returns {Promise} Promise
   */
  moveMessages(path, sequence, destination, options = {}) {
    var _this15 = this;

    return _asyncToGenerator(function* () {
      _this15.logger.debug('Moving messages', sequence, 'from', path, 'to', destination, '...');

      if (_this15._capability.indexOf('MOVE') === -1) {
        // Fallback to COPY + EXPUNGE
        yield _this15.copyMessages(path, sequence, destination, options);
        return _this15.deleteMessages(path, sequence, options);
      }

      // If possible, use MOVE
      return _this15.exec({
        command: options.byUid ? 'UID MOVE' : 'MOVE',
        attributes: [{ type: 'sequence', value: sequence }, { type: 'atom', value: destination }]
      }, ['OK'], {
        precheck: function (ctx) {
          return _this15._shouldSelectMailbox(path, ctx) ? _this15.selectMailbox(path, { ctx }) : Promise.resolve();
        }
      });
    })();
  }

  /**
   * Runs COMPRESS command
   *
   * COMPRESS details:
   *   https://tools.ietf.org/html/rfc4978
   */
  compressConnection() {
    var _this16 = this;

    return _asyncToGenerator(function* () {
      if (!_this16._enableCompression || _this16._capability.indexOf('COMPRESS=DEFLATE') < 0 || _this16.client.compressed) {
        return false;
      }

      _this16.logger.debug('Enabling compression...');
      yield _this16.exec({
        command: 'COMPRESS',
        attributes: [{
          type: 'ATOM',
          value: 'DEFLATE'
        }]
      });
      _this16.client.enableCompression();
      _this16.logger.debug('Compression enabled, all data sent and received is deflated!');
    })();
  }

  /**
   * Runs LOGIN or AUTHENTICATE XOAUTH2 command
   *
   * LOGIN details:
   *   http://tools.ietf.org/html/rfc3501#section-6.2.3
   * XOAUTH2 details:
   *   https://developers.google.com/gmail/xoauth2_protocol#imap_protocol_exchange
   *
   * @param {String} auth.user
   * @param {String} auth.pass
   * @param {String} auth.xoauth2
   */
  login(auth) {
    var _this17 = this;

    return _asyncToGenerator(function* () {
      let command;
      let options = {};

      if (!auth) {
        throw new Error('Authentication information not provided');
      }

      if (_this17._capability.indexOf('AUTH=XOAUTH2') >= 0 && auth && auth.xoauth2) {
        command = {
          command: 'AUTHENTICATE',
          attributes: [{ type: 'ATOM', value: 'XOAUTH2' }, { type: 'ATOM', value: (0, _commandBuilder.buildXOAuth2Token)(auth.user, auth.xoauth2), sensitive: true }]
        };

        options.errorResponseExpectsEmptyLine = true; // + tagged error response expects an empty line in return
      } else {
        command = {
          command: 'login',
          attributes: [{ type: 'STRING', value: auth.user || '' }, { type: 'STRING', value: auth.pass || '', sensitive: true }]
        };
      }

      _this17.logger.debug('Logging in...');
      const response = yield _this17.exec(command, 'capability', options);
      /*
       * update post-auth capabilites
       * capability list shouldn't contain auth related stuff anymore
       * but some new extensions might have popped up that do not
       * make much sense in the non-auth state
       */
      if (response.capability && response.capability.length) {
        // capabilites were listed with the OK [CAPABILITY ...] response
        _this17._capability = response.capability;
      } else if (response.payload && response.payload.CAPABILITY && response.payload.CAPABILITY.length) {
        // capabilites were listed with * CAPABILITY ... response
        _this17._capability = response.payload.CAPABILITY.pop().attributes.map(function (capa = '') {
          return capa.value.toUpperCase().trim();
        });
      } else {
        // capabilities were not automatically listed, reload
        yield _this17.updateCapability(true);
      }

      _this17._changeState(STATE_AUTHENTICATED);
      _this17._authenticated = true;
      _this17.logger.debug('Login successful, post-auth capabilites updated!', _this17._capability);
    })();
  }

  /**
   * Run an IMAP command.
   *
   * @param {Object} request Structured request object
   * @param {Array} acceptUntagged a list of untagged responses that will be included in 'payload' property
   */
  exec(request, acceptUntagged, options) {
    var _this18 = this;

    return _asyncToGenerator(function* () {
      _this18.breakIdle();
      const response = yield _this18.client.enqueueCommand(request, acceptUntagged, options);
      if (response && response.capability) {
        _this18._capability = response.capability;
      }
      return response;
    })();
  }

  /**
   * The connection is idling. Sends a NOOP or IDLE command
   *
   * IDLE details:
   *   https://tools.ietf.org/html/rfc2177
   */
  enterIdle() {
    if (this._enteredIdle) {
      return;
    }
    this._enteredIdle = this._capability.indexOf('IDLE') >= 0 ? 'IDLE' : 'NOOP';
    this.logger.debug('Entering idle with ' + this._enteredIdle);

    if (this._enteredIdle === 'NOOP') {
      this._idleTimeout = setTimeout(() => {
        this.logger.debug('Sending NOOP');
        this.exec('NOOP');
      }, this.timeoutNoop);
    } else if (this._enteredIdle === 'IDLE') {
      this.client.enqueueCommand({
        command: 'IDLE'
      });
      this._idleTimeout = setTimeout(() => {
        this.client.send('DONE\r\n');
        this._enteredIdle = false;
        this.logger.debug('Idle terminated');
      }, this.timeoutIdle);
    }
  }

  /**
   * Stops actions related idling, if IDLE is supported, sends DONE to stop it
   */
  breakIdle() {
    if (!this._enteredIdle) {
      return;
    }

    clearTimeout(this._idleTimeout);
    if (this._enteredIdle === 'IDLE') {
      this.client.send('DONE\r\n');
      this.logger.debug('Idle terminated');
    }
    this._enteredIdle = false;
  }

  /**
   * Runs STARTTLS command if needed
   *
   * STARTTLS details:
   *   http://tools.ietf.org/html/rfc3501#section-6.2.1
   *
   * @param {Boolean} [forced] By default the command is not run if capability is already listed. Set to true to skip this validation
   */
  upgradeConnection() {
    var _this19 = this;

    return _asyncToGenerator(function* () {
      // skip request, if already secured
      if (_this19.client.secureMode) {
        return false;
      }

      // skip if STARTTLS not available or starttls support disabled
      if ((_this19._capability.indexOf('STARTTLS') < 0 || _this19._ignoreTLS) && !_this19._requireTLS) {
        return false;
      }

      _this19.logger.debug('Encrypting connection...');
      yield _this19.exec('STARTTLS');
      _this19._capability = [];
      _this19.client.upgrade();
      return _this19.updateCapability();
    })();
  }

  /**
   * Runs CAPABILITY command
   *
   * CAPABILITY details:
   *   http://tools.ietf.org/html/rfc3501#section-6.1.1
   *
   * Doesn't register untagged CAPABILITY handler as this is already
   * handled by global handler
   *
   * @param {Boolean} [forced] By default the command is not run if capability is already listed. Set to true to skip this validation
   */
  updateCapability(forced) {
    var _this20 = this;

    return _asyncToGenerator(function* () {
      // skip request, if not forced update and capabilities are already loaded
      if (!forced && _this20._capability.length) {
        return;
      }

      // If STARTTLS is required then skip capability listing as we are going to try
      // STARTTLS anyway and we re-check capabilities after connection is secured
      if (!_this20.client.secureMode && _this20._requireTLS) {
        return;
      }

      _this20.logger.debug('Updating capability...');
      return _this20.exec('CAPABILITY');
    })();
  }

  hasCapability(capa = '') {
    return this._capability.indexOf(capa.toUpperCase().trim()) >= 0;
  }

  // Default handlers for untagged responses

  /**
   * Checks if an untagged OK includes [CAPABILITY] tag and updates capability object
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedOkHandler(response) {
    if (response && response.capability) {
      this._capability = response.capability;
    }
  }

  /**
   * Updates capability object
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedCapabilityHandler(response) {
    this._capability = (0, _ramda.pipe)((0, _ramda.propOr)([], 'attributes'), (0, _ramda.map)(({ value }) => (value || '').toUpperCase().trim()))(response);
  }

  /**
   * Updates existing message count
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedExistsHandler(response) {
    if (response && response.hasOwnProperty('nr')) {
      this.onupdate && this.onupdate(this._selectedMailbox, 'exists', response.nr);
    }
  }

  /**
   * Indicates a message has been deleted
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedExpungeHandler(response) {
    if (response && response.hasOwnProperty('nr')) {
      this.onupdate && this.onupdate(this._selectedMailbox, 'expunge', response.nr);
    }
  }

  /**
   * Indicates that flags have been updated for a message
   *
   * @param {Object} response Parsed server response
   * @param {Function} next Until called, server responses are not processed
   */
  _untaggedFetchHandler(response) {
    this.onupdate && this.onupdate(this._selectedMailbox, 'fetch', [].concat((0, _commandParser.parseFETCH)({ payload: { FETCH: [response] } }) || []).shift());
  }

  // Private helpers

  /**
   * Indicates that the connection started idling. Initiates a cycle
   * of NOOPs or IDLEs to receive notifications about updates in the server
   */
  _onIdle() {
    if (!this._authenticated || this._enteredIdle) {
      // No need to IDLE when not logged in or already idling
      return;
    }

    this.logger.debug('Client started idling');
    this.enterIdle();
  }

  /**
   * Updates the IMAP state value for the current connection
   *
   * @param {Number} newState The state you want to change to
   */
  _changeState(newState) {
    if (newState === this._state) {
      return;
    }

    this.logger.debug('Entering state: ' + newState);

    // if a mailbox was opened, emit onclosemailbox and clear selectedMailbox value
    if (this._state === STATE_SELECTED && this._selectedMailbox) {
      this.onclosemailbox && this.onclosemailbox(this._selectedMailbox);
      this._selectedMailbox = false;
    }

    this._state = newState;
  }

  /**
   * Ensures a path exists in the Mailbox tree
   *
   * @param {Object} tree Mailbox tree
   * @param {String} path
   * @param {String} delimiter
   * @return {Object} branch for used path
   */
  _ensurePath(tree, path, delimiter) {
    const names = path.split(delimiter);
    let branch = tree;

    for (let i = 0; i < names.length; i++) {
      let found = false;
      for (let j = 0; j < branch.children.length; j++) {
        if (this._compareMailboxNames(branch.children[j].name, (0, _emailjsUtf.imapDecode)(names[i]))) {
          branch = branch.children[j];
          found = true;
          break;
        }
      }
      if (!found) {
        branch.children.push({
          name: (0, _emailjsUtf.imapDecode)(names[i]),
          delimiter: delimiter,
          path: names.slice(0, i + 1).join(delimiter),
          children: []
        });
        branch = branch.children[branch.children.length - 1];
      }
    }
    return branch;
  }

  /**
   * Compares two mailbox names. Case insensitive in case of INBOX, otherwise case sensitive
   *
   * @param {String} a Mailbox name
   * @param {String} b Mailbox name
   * @returns {Boolean} True if the folder names match
   */
  _compareMailboxNames(a, b) {
    return (a.toUpperCase() === 'INBOX' ? 'INBOX' : a) === (b.toUpperCase() === 'INBOX' ? 'INBOX' : b);
  }

  createLogger(creator = _logger2.default) {
    const logger = creator((this._auth || {}).user || '', this._host);
    this.logger = this.client.logger = {
      debug: (...msgs) => {
        if (_common.LOG_LEVEL_DEBUG >= this.logLevel) {
          logger.debug(msgs);
        }
      },
      info: (...msgs) => {
        if (_common.LOG_LEVEL_INFO >= this.logLevel) {
          logger.info(msgs);
        }
      },
      warn: (...msgs) => {
        if (_common.LOG_LEVEL_WARN >= this.logLevel) {
          logger.warn(msgs);
        }
      },
      error: (...msgs) => {
        if (_common.LOG_LEVEL_ERROR >= this.logLevel) {
          logger.error(msgs);
        }
      }
    };
  }
}
exports.default = Client;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jbGllbnQuanMiXSwibmFtZXMiOlsiVElNRU9VVF9DT05ORUNUSU9OIiwiVElNRU9VVF9OT09QIiwiVElNRU9VVF9JRExFIiwiU1RBVEVfQ09OTkVDVElORyIsIlNUQVRFX05PVF9BVVRIRU5USUNBVEVEIiwiU1RBVEVfQVVUSEVOVElDQVRFRCIsIlNUQVRFX1NFTEVDVEVEIiwiU1RBVEVfTE9HT1VUIiwiREVGQVVMVF9DTElFTlRfSUQiLCJuYW1lIiwiQ2xpZW50IiwiY29uc3RydWN0b3IiLCJob3N0IiwicG9ydCIsIm9wdGlvbnMiLCJ0aW1lb3V0Q29ubmVjdGlvbiIsInRpbWVvdXROb29wIiwidGltZW91dElkbGUiLCJzZXJ2ZXJJZCIsIm9uY2VydCIsIm9udXBkYXRlIiwib25zZWxlY3RtYWlsYm94Iiwib25jbG9zZW1haWxib3giLCJfaG9zdCIsIl9jbGllbnRJZCIsIl9zdGF0ZSIsIl9hdXRoZW50aWNhdGVkIiwiX2NhcGFiaWxpdHkiLCJfc2VsZWN0ZWRNYWlsYm94IiwiX2VudGVyZWRJZGxlIiwiX2lkbGVUaW1lb3V0IiwiX2VuYWJsZUNvbXByZXNzaW9uIiwiZW5hYmxlQ29tcHJlc3Npb24iLCJfYXV0aCIsImF1dGgiLCJfcmVxdWlyZVRMUyIsInJlcXVpcmVUTFMiLCJfaWdub3JlVExTIiwiaWdub3JlVExTIiwiY2xpZW50IiwiSW1hcENsaWVudCIsIm9uZXJyb3IiLCJfb25FcnJvciIsImJpbmQiLCJjZXJ0Iiwib25pZGxlIiwiX29uSWRsZSIsInNldEhhbmRsZXIiLCJyZXNwb25zZSIsIl91bnRhZ2dlZENhcGFiaWxpdHlIYW5kbGVyIiwiX3VudGFnZ2VkT2tIYW5kbGVyIiwiX3VudGFnZ2VkRXhpc3RzSGFuZGxlciIsIl91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyIiwiX3VudGFnZ2VkRmV0Y2hIYW5kbGVyIiwiY3JlYXRlTG9nZ2VyIiwibG9nTGV2ZWwiLCJMT0dfTEVWRUxfQUxMIiwiZXJyIiwiY2xlYXJUaW1lb3V0IiwiY29ubmVjdCIsIl9vcGVuQ29ubmVjdGlvbiIsIl9jaGFuZ2VTdGF0ZSIsInVwZGF0ZUNhcGFiaWxpdHkiLCJ1cGdyYWRlQ29ubmVjdGlvbiIsInVwZGF0ZUlkIiwibG9nZ2VyIiwid2FybiIsIm1lc3NhZ2UiLCJsb2dpbiIsImNvbXByZXNzQ29ubmVjdGlvbiIsImRlYnVnIiwiZXJyb3IiLCJjbG9zZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY29ubmVjdGlvblRpbWVvdXQiLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJ0aGVuIiwib25yZWFkeSIsImNhdGNoIiwibG9nb3V0IiwiaWQiLCJpbmRleE9mIiwiY29tbWFuZCIsImF0dHJpYnV0ZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZXhlYyIsImxpc3QiLCJtYXAiLCJ2YWx1ZXMiLCJrZXlzIiwiZmlsdGVyIiwiXyIsImkiLCJfc2hvdWxkU2VsZWN0TWFpbGJveCIsInBhdGgiLCJjdHgiLCJwcmV2aW91c1NlbGVjdCIsImdldFByZXZpb3VzbHlRdWV1ZWQiLCJyZXF1ZXN0IiwicGF0aEF0dHJpYnV0ZSIsImZpbmQiLCJhdHRyaWJ1dGUiLCJ0eXBlIiwidmFsdWUiLCJzZWxlY3RNYWlsYm94IiwicXVlcnkiLCJyZWFkT25seSIsImNvbmRzdG9yZSIsInB1c2giLCJtYWlsYm94SW5mbyIsImxpc3ROYW1lc3BhY2VzIiwibGlzdE1haWxib3hlcyIsInRyZWUiLCJyb290IiwiY2hpbGRyZW4iLCJsaXN0UmVzcG9uc2UiLCJmb3JFYWNoIiwiYXR0ciIsIml0ZW0iLCJsZW5ndGgiLCJkZWxpbSIsImJyYW5jaCIsIl9lbnN1cmVQYXRoIiwiZmxhZ3MiLCJsaXN0ZWQiLCJsc3ViUmVzcG9uc2UiLCJsc3ViIiwiZmxhZyIsInN1YnNjcmliZWQiLCJjcmVhdGVNYWlsYm94IiwiY29kZSIsImRlbGV0ZU1haWxib3giLCJsaXN0TWVzc2FnZXMiLCJzZXF1ZW5jZSIsIml0ZW1zIiwiZmFzdCIsInByZWNoZWNrIiwic2VhcmNoIiwic29ydCIsInNvcnRQcm9ncmFtIiwic2V0RmxhZ3MiLCJrZXkiLCJBcnJheSIsImlzQXJyYXkiLCJjb25jYXQiLCJhZGQiLCJzZXQiLCJyZW1vdmUiLCJzdG9yZSIsImFjdGlvbiIsInVwbG9hZCIsImRlc3RpbmF0aW9uIiwiZGVsZXRlTWVzc2FnZXMiLCJ1c2VVaWRQbHVzIiwiYnlVaWQiLCJ1aWRFeHB1bmdlQ29tbWFuZCIsImNtZCIsImNvcHlNZXNzYWdlcyIsImh1bWFuUmVhZGFibGUiLCJtb3ZlTWVzc2FnZXMiLCJjb21wcmVzc2VkIiwieG9hdXRoMiIsInVzZXIiLCJzZW5zaXRpdmUiLCJlcnJvclJlc3BvbnNlRXhwZWN0c0VtcHR5TGluZSIsInBhc3MiLCJjYXBhYmlsaXR5IiwicGF5bG9hZCIsIkNBUEFCSUxJVFkiLCJwb3AiLCJjYXBhIiwidG9VcHBlckNhc2UiLCJ0cmltIiwiYWNjZXB0VW50YWdnZWQiLCJicmVha0lkbGUiLCJlbnF1ZXVlQ29tbWFuZCIsImVudGVySWRsZSIsInNlbmQiLCJzZWN1cmVNb2RlIiwidXBncmFkZSIsImZvcmNlZCIsImhhc0NhcGFiaWxpdHkiLCJoYXNPd25Qcm9wZXJ0eSIsIm5yIiwiRkVUQ0giLCJzaGlmdCIsIm5ld1N0YXRlIiwiZGVsaW1pdGVyIiwibmFtZXMiLCJzcGxpdCIsImZvdW5kIiwiaiIsIl9jb21wYXJlTWFpbGJveE5hbWVzIiwic2xpY2UiLCJqb2luIiwiYSIsImIiLCJjcmVhdG9yIiwiY3JlYXRlRGVmYXVsdExvZ2dlciIsIm1zZ3MiLCJMT0dfTEVWRUxfREVCVUciLCJpbmZvIiwiTE9HX0xFVkVMX0lORk8iLCJMT0dfTEVWRUxfV0FSTiIsIkxPR19MRVZFTF9FUlJPUiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQU9BOztBQVFBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFRQTs7Ozs7O0FBSU8sTUFBTUEsa0RBQXFCLEtBQUssSUFBaEMsQyxDQUFxQztBQUNyQyxNQUFNQyxzQ0FBZSxLQUFLLElBQTFCLEMsQ0FBK0I7QUFDL0IsTUFBTUMsc0NBQWUs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QkFBUGpNLE0iLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWFwLCBwaXBlLCB1bmlvbiwgemlwLCBmcm9tUGFpcnMsIHByb3BPciwgcGF0aE9yLCBmbGF0dGVuIH0gZnJvbSAncmFtZGEnXG5pbXBvcnQgeyBpbWFwRW5jb2RlLCBpbWFwRGVjb2RlIH0gZnJvbSAnZW1haWxqcy11dGY3J1xuaW1wb3J0IHtcbiAgcGFyc2VOQU1FU1BBQ0UsXG4gIHBhcnNlU0VMRUNULFxuICBwYXJzZUZFVENILFxuICBwYXJzZVNFQVJDSCxcbiAgcGFyc2VTT1JUXG59IGZyb20gJy4vY29tbWFuZC1wYXJzZXInXG5pbXBvcnQge1xuICBidWlsZEZFVENIQ29tbWFuZCxcbiAgYnVpbGRYT0F1dGgyVG9rZW4sXG4gIGJ1aWxkU0VBUkNIQ29tbWFuZCxcbiAgYnVpbGRTT1JUQ29tbWFuZCxcbiAgYnVpbGRTVE9SRUNvbW1hbmRcbn0gZnJvbSAnLi9jb21tYW5kLWJ1aWxkZXInXG5cbmltcG9ydCBjcmVhdGVEZWZhdWx0TG9nZ2VyIGZyb20gJy4vbG9nZ2VyJ1xuaW1wb3J0IEltYXBDbGllbnQgZnJvbSAnLi9pbWFwJ1xuaW1wb3J0IHtcbiAgTE9HX0xFVkVMX0VSUk9SLFxuICBMT0dfTEVWRUxfV0FSTixcbiAgTE9HX0xFVkVMX0lORk8sXG4gIExPR19MRVZFTF9ERUJVRyxcbiAgTE9HX0xFVkVMX0FMTFxufSBmcm9tICcuL2NvbW1vbidcblxuaW1wb3J0IHtcbiAgY2hlY2tTcGVjaWFsVXNlXG59IGZyb20gJy4vc3BlY2lhbC11c2UnXG5cbmV4cG9ydCBjb25zdCBUSU1FT1VUX0NPTk5FQ1RJT04gPSA5MCAqIDEwMDAgLy8gTWlsbGlzZWNvbmRzIHRvIHdhaXQgZm9yIHRoZSBJTUFQIGdyZWV0aW5nIGZyb20gdGhlIHNlcnZlclxuZXhwb3J0IGNvbnN0IFRJTUVPVVRfTk9PUCA9IDYwICogMTAwMCAvLyBNaWxsaXNlY29uZHMgYmV0d2VlbiBOT09QIGNvbW1hbmRzIHdoaWxlIGlkbGluZ1xuZXhwb3J0IGNvbnN0IFRJTUVPVVRfSURMRSA9IDYwICogMTAwMCAvLyBNaWxsaXNlY29uZHMgdW50aWwgSURMRSBjb21tYW5kIGlzIGNhbmNlbGxlZFxuXG5leHBvcnQgY29uc3QgU1RBVEVfQ09OTkVDVElORyA9IDFcbmV4cG9ydCBjb25zdCBTVEFURV9OT1RfQVVUSEVOVElDQVRFRCA9IDJcbmV4cG9ydCBjb25zdCBTVEFURV9BVVRIRU5USUNBVEVEID0gM1xuZXhwb3J0IGNvbnN0IFNUQVRFX1NFTEVDVEVEID0gNFxuZXhwb3J0IGNvbnN0IFNUQVRFX0xPR09VVCA9IDVcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQ0xJRU5UX0lEID0ge1xuICBuYW1lOiAnZW1haWxqcy1pbWFwLWNsaWVudCdcbn1cblxuLyoqXG4gKiBlbWFpbGpzIElNQVAgY2xpZW50XG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtob3N0PSdsb2NhbGhvc3QnXSBIb3N0bmFtZSB0byBjb25lbmN0IHRvXG4gKiBAcGFyYW0ge051bWJlcn0gW3BvcnQ9MTQzXSBQb3J0IG51bWJlciB0byBjb25uZWN0IHRvXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENsaWVudCB7XG4gIGNvbnN0cnVjdG9yKGhvc3QsIHBvcnQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMudGltZW91dENvbm5lY3Rpb24gPSBUSU1FT1VUX0NPTk5FQ1RJT05cbiAgICB0aGlzLnRpbWVvdXROb29wID0gVElNRU9VVF9OT09QXG4gICAgdGhpcy50aW1lb3V0SWRsZSA9IFRJTUVPVVRfSURMRVxuXG4gICAgdGhpcy5zZXJ2ZXJJZCA9IGZhbHNlIC8vIFJGQyAyOTcxIFNlcnZlciBJRCBhcyBrZXkgdmFsdWUgcGFpcnNcblxuICAgIC8vIEV2ZW50IHBsYWNlaG9sZGVyc1xuICAgIHRoaXMub25jZXJ0ID0gbnVsbFxuICAgIHRoaXMub251cGRhdGUgPSBudWxsXG4gICAgdGhpcy5vbnNlbGVjdG1haWxib3ggPSBudWxsXG4gICAgdGhpcy5vbmNsb3NlbWFpbGJveCA9IG51bGxcblxuICAgIHRoaXMuX2hvc3QgPSBob3N0XG4gICAgdGhpcy5fY2xpZW50SWQgPSBwcm9wT3IoREVGQVVMVF9DTElFTlRfSUQsICdpZCcsIG9wdGlvbnMpXG4gICAgdGhpcy5fc3RhdGUgPSBmYWxzZSAvLyBDdXJyZW50IHN0YXRlXG4gICAgdGhpcy5fYXV0aGVudGljYXRlZCA9IGZhbHNlIC8vIElzIHRoZSBjb25uZWN0aW9uIGF1dGhlbnRpY2F0ZWRcbiAgICB0aGlzLl9jYXBhYmlsaXR5ID0gW10gLy8gTGlzdCBvZiBleHRlbnNpb25zIHRoZSBzZXJ2ZXIgc3VwcG9ydHNcbiAgICB0aGlzLl9zZWxlY3RlZE1haWxib3ggPSBmYWxzZSAvLyBTZWxlY3RlZCBtYWlsYm94XG4gICAgdGhpcy5fZW50ZXJlZElkbGUgPSBmYWxzZVxuICAgIHRoaXMuX2lkbGVUaW1lb3V0ID0gZmFsc2VcbiAgICB0aGlzLl9lbmFibGVDb21wcmVzc2lvbiA9ICEhb3B0aW9ucy5lbmFibGVDb21wcmVzc2lvblxuICAgIHRoaXMuX2F1dGggPSBvcHRpb25zLmF1dGhcbiAgICB0aGlzLl9yZXF1aXJlVExTID0gISFvcHRpb25zLnJlcXVpcmVUTFNcbiAgICB0aGlzLl9pZ25vcmVUTFMgPSAhIW9wdGlvbnMuaWdub3JlVExTXG5cbiAgICB0aGlzLmNsaWVudCA9IG5ldyBJbWFwQ2xpZW50KGhvc3QsIHBvcnQsIG9wdGlvbnMpIC8vIElNQVAgY2xpZW50IG9iamVjdFxuXG4gICAgLy8gRXZlbnQgSGFuZGxlcnNcbiAgICB0aGlzLmNsaWVudC5vbmVycm9yID0gdGhpcy5fb25FcnJvci5iaW5kKHRoaXMpXG4gICAgdGhpcy5jbGllbnQub25jZXJ0ID0gKGNlcnQpID0+ICh0aGlzLm9uY2VydCAmJiB0aGlzLm9uY2VydChjZXJ0KSkgLy8gYWxsb3dzIGNlcnRpZmljYXRlIGhhbmRsaW5nIGZvciBwbGF0Zm9ybXMgdy9vIG5hdGl2ZSB0bHMgc3VwcG9ydFxuICAgIHRoaXMuY2xpZW50Lm9uaWRsZSA9ICgpID0+IHRoaXMuX29uSWRsZSgpIC8vIHN0YXJ0IGlkbGluZ1xuXG4gICAgLy8gRGVmYXVsdCBoYW5kbGVycyBmb3IgdW50YWdnZWQgcmVzcG9uc2VzXG4gICAgdGhpcy5jbGllbnQuc2V0SGFuZGxlcignY2FwYWJpbGl0eScsIChyZXNwb25zZSkgPT4gdGhpcy5fdW50YWdnZWRDYXBhYmlsaXR5SGFuZGxlcihyZXNwb25zZSkpIC8vIGNhcGFiaWxpdHkgdXBkYXRlc1xuICAgIHRoaXMuY2xpZW50LnNldEhhbmRsZXIoJ29rJywgKHJlc3BvbnNlKSA9PiB0aGlzLl91bnRhZ2dlZE9rSGFuZGxlcihyZXNwb25zZSkpIC8vIG5vdGlmaWNhdGlvbnNcbiAgICB0aGlzLmNsaWVudC5zZXRIYW5kbGVyKCdleGlzdHMnLCAocmVzcG9uc2UpID0+IHRoaXMuX3VudGFnZ2VkRXhpc3RzSGFuZGxlcihyZXNwb25zZSkpIC8vIG1lc3NhZ2UgY291bnQgaGFzIGNoYW5nZWRcbiAgICB0aGlzLmNsaWVudC5zZXRIYW5kbGVyKCdleHB1bmdlJywgKHJlc3BvbnNlKSA9PiB0aGlzLl91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyKHJlc3BvbnNlKSkgLy8gbWVzc2FnZSBoYXMgYmVlbiBkZWxldGVkXG4gICAgdGhpcy5jbGllbnQuc2V0SGFuZGxlcignZmV0Y2gnLCAocmVzcG9uc2UpID0+IHRoaXMuX3VudGFnZ2VkRmV0Y2hIYW5kbGVyKHJlc3BvbnNlKSkgLy8gbWVzc2FnZSBoYXMgYmVlbiB1cGRhdGVkIChlZy4gZmxhZyBjaGFuZ2UpXG5cbiAgICAvLyBBY3RpdmF0ZSBsb2dnaW5nXG4gICAgdGhpcy5jcmVhdGVMb2dnZXIoKVxuICAgIHRoaXMubG9nTGV2ZWwgPSBwcm9wT3IoTE9HX0xFVkVMX0FMTCwgJ2xvZ0xldmVsJywgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgaWYgdGhlIGxvd2VyLWxldmVsIEltYXBDbGllbnQgaGFzIGVuY291bnRlcmVkIGFuIHVucmVjb3ZlcmFibGVcbiAgICogZXJyb3IgZHVyaW5nIG9wZXJhdGlvbi4gQ2xlYW5zIHVwIGFuZCBwcm9wYWdhdGVzIHRoZSBlcnJvciB1cHdhcmRzLlxuICAgKi9cbiAgX29uRXJyb3IoZXJyKSB7XG4gICAgLy8gbWFrZSBzdXJlIG5vIGlkbGUgdGltZW91dCBpcyBwZW5kaW5nIGFueW1vcmVcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVvdXQpXG5cbiAgICAvLyBwcm9wYWdhdGUgdGhlIGVycm9yIHVwd2FyZHNcbiAgICB0aGlzLm9uZXJyb3IgJiYgdGhpcy5vbmVycm9yKGVycilcbiAgfVxuXG4gIC8vXG4gIC8vXG4gIC8vIFBVQkxJQyBBUElcbiAgLy9cbiAgLy9cblxuICAvKipcbiAgICogSW5pdGlhdGUgY29ubmVjdGlvbiB0byB0aGUgSU1BUCBzZXJ2ZXJcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2hlbiBsb2dpbiBwcm9jZWR1cmUgaXMgY29tcGxldGVcbiAgICovXG4gIGFzeW5jIGNvbm5lY3QoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuX29wZW5Db25uZWN0aW9uKClcbiAgICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX05PVF9BVVRIRU5USUNBVEVEKVxuICAgICAgYXdhaXQgdGhpcy51cGRhdGVDYXBhYmlsaXR5KClcbiAgICAgIGF3YWl0IHRoaXMudXBncmFkZUNvbm5lY3Rpb24oKVxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVJZCh0aGlzLl9jbGllbnRJZClcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKCdGYWlsZWQgdG8gdXBkYXRlIHNlcnZlciBpZCEnLCBlcnIubWVzc2FnZSlcbiAgICAgIH1cblxuICAgICAgYXdhaXQgdGhpcy5sb2dpbih0aGlzLl9hdXRoKVxuICAgICAgYXdhaXQgdGhpcy5jb21wcmVzc0Nvbm5lY3Rpb24oKVxuICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ0Nvbm5lY3Rpb24gZXN0YWJsaXNoZWQsIHJlYWR5IHRvIHJvbGwhJylcbiAgICAgIHRoaXMuY2xpZW50Lm9uZXJyb3IgPSB0aGlzLl9vbkVycm9yLmJpbmQodGhpcylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKCdDb3VsZCBub3QgY29ubmVjdCB0byBzZXJ2ZXInLCBlcnIpXG4gICAgICB0aGlzLmNsb3NlKGVycikgLy8gd2UgZG9uJ3QgcmVhbGx5IGNhcmUgd2hldGhlciB0aGlzIHdvcmtzIG9yIG5vdFxuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9XG5cbiAgX29wZW5Db25uZWN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgY29ubmVjdGlvblRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoJ1RpbWVvdXQgY29ubmVjdGluZyB0byBzZXJ2ZXInKSksIHRoaXMudGltZW91dENvbm5lY3Rpb24pXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ29ubmVjdGluZyB0bycsIHRoaXMuY2xpZW50Lmhvc3QsICc6JywgdGhpcy5jbGllbnQucG9ydClcbiAgICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX0NPTk5FQ1RJTkcpXG4gICAgICB0aGlzLmNsaWVudC5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTb2NrZXQgb3BlbmVkLCB3YWl0aW5nIGZvciBncmVldGluZyBmcm9tIHRoZSBzZXJ2ZXIuLi4nKVxuXG4gICAgICAgIHRoaXMuY2xpZW50Lm9ucmVhZHkgPSAoKSA9PiB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGNvbm5lY3Rpb25UaW1lb3V0KVxuICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbGllbnQub25lcnJvciA9IChlcnIpID0+IHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoY29ubmVjdGlvblRpbWVvdXQpXG4gICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgfVxuICAgICAgfSkuY2F0Y2gocmVqZWN0KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogTG9nb3V0XG4gICAqXG4gICAqIFNlbmQgTE9HT1VULCB0byB3aGljaCB0aGUgc2VydmVyIHJlc3BvbmRzIGJ5IGNsb3NpbmcgdGhlIGNvbm5lY3Rpb24uXG4gICAqIFVzZSBpcyBkaXNjb3VyYWdlZCBpZiBuZXR3b3JrIHN0YXR1cyBpcyB1bmNsZWFyISBJZiBuZXR3b3JrcyBzdGF0dXMgaXNcbiAgICogdW5jbGVhciwgcGxlYXNlIHVzZSAjY2xvc2UgaW5zdGVhZCFcbiAgICpcbiAgICogTE9HT1VUIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjEuM1xuICAgKlxuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmVzb2x2ZXMgd2hlbiBzZXJ2ZXIgaGFzIGNsb3NlZCB0aGUgY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgbG9nb3V0KCkge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX0xPR09VVClcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnTG9nZ2luZyBvdXQuLi4nKVxuICAgIGF3YWl0IHRoaXMuY2xpZW50LmxvZ291dCgpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2lkbGVUaW1lb3V0KVxuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlLWNsb3NlcyB0aGUgY3VycmVudCBjb25uZWN0aW9uIGJ5IGNsb3NpbmcgdGhlIFRDUCBzb2NrZXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXNvbHZlcyB3aGVuIHNvY2tldCBpcyBjbG9zZWRcbiAgICovXG4gIGFzeW5jIGNsb3NlKGVycikge1xuICAgIHRoaXMuX2NoYW5nZVN0YXRlKFNUQVRFX0xPR09VVClcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faWRsZVRpbWVvdXQpXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0Nsb3NpbmcgY29ubmVjdGlvbi4uLicpXG4gICAgYXdhaXQgdGhpcy5jbGllbnQuY2xvc2UoZXJyKVxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZW91dClcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIElEIGNvbW1hbmQsIHBhcnNlcyBJRCByZXNwb25zZSwgc2V0cyB0aGlzLnNlcnZlcklkXG4gICAqXG4gICAqIElEIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMjk3MVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gaWQgSUQgYXMgSlNPTiBvYmplY3QuIFNlZSBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMyOTcxI3NlY3Rpb24tMy4zIGZvciBwb3NzaWJsZSB2YWx1ZXNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFJlc29sdmVzIHdoZW4gcmVzcG9uc2UgaGFzIGJlZW4gcGFyc2VkXG4gICAqL1xuICBhc3luYyB1cGRhdGVJZChpZCkge1xuICAgIGlmICh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0lEJykgPCAwKSByZXR1cm5cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdVcGRhdGluZyBpZC4uLicpXG5cbiAgICBjb25zdCBjb21tYW5kID0gJ0lEJ1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBpZCA/IFtmbGF0dGVuKE9iamVjdC5lbnRyaWVzKGlkKSldIDogW251bGxdXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoeyBjb21tYW5kLCBhdHRyaWJ1dGVzIH0sICdJRCcpXG4gICAgY29uc3QgbGlzdCA9IGZsYXR0ZW4ocGF0aE9yKFtdLCBbJ3BheWxvYWQnLCAnSUQnLCAnMCcsICdhdHRyaWJ1dGVzJywgJzAnXSwgcmVzcG9uc2UpLm1hcChPYmplY3QudmFsdWVzKSlcbiAgICBjb25zdCBrZXlzID0gbGlzdC5maWx0ZXIoKF8sIGkpID0+IGkgJSAyID09PSAwKVxuICAgIGNvbnN0IHZhbHVlcyA9IGxpc3QuZmlsdGVyKChfLCBpKSA9PiBpICUgMiA9PT0gMSlcbiAgICB0aGlzLnNlcnZlcklkID0gZnJvbVBhaXJzKHppcChrZXlzLCB2YWx1ZXMpKVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdTZXJ2ZXIgaWQgdXBkYXRlZCEnLCB0aGlzLnNlcnZlcklkKVxuICB9XG5cbiAgX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSB7XG4gICAgaWYgKCFjdHgpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlvdXNTZWxlY3QgPSB0aGlzLmNsaWVudC5nZXRQcmV2aW91c2x5UXVldWVkKFsnU0VMRUNUJywgJ0VYQU1JTkUnXSwgY3R4KVxuICAgIGlmIChwcmV2aW91c1NlbGVjdCAmJiBwcmV2aW91c1NlbGVjdC5yZXF1ZXN0LmF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IHBhdGhBdHRyaWJ1dGUgPSBwcmV2aW91c1NlbGVjdC5yZXF1ZXN0LmF0dHJpYnV0ZXMuZmluZCgoYXR0cmlidXRlKSA9PiBhdHRyaWJ1dGUudHlwZSA9PT0gJ1NUUklORycpXG4gICAgICBpZiAocGF0aEF0dHJpYnV0ZSkge1xuICAgICAgICByZXR1cm4gcGF0aEF0dHJpYnV0ZS52YWx1ZSAhPT0gcGF0aFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZE1haWxib3ggIT09IHBhdGhcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIFNFTEVDVCBvciBFWEFNSU5FIHRvIG9wZW4gYSBtYWlsYm94XG4gICAqXG4gICAqIFNFTEVDVCBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuMVxuICAgKiBFWEFNSU5FIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy4yXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIEZ1bGwgcGF0aCB0byBtYWlsYm94XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gT3B0aW9ucyBvYmplY3RcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgc2VsZWN0ZWQgbWFpbGJveFxuICAgKi9cbiAgYXN5bmMgc2VsZWN0TWFpbGJveChwYXRoLCBvcHRpb25zID0ge30pIHtcbiAgICBsZXQgcXVlcnkgPSB7XG4gICAgICBjb21tYW5kOiBvcHRpb25zLnJlYWRPbmx5ID8gJ0VYQU1JTkUnIDogJ1NFTEVDVCcsXG4gICAgICBhdHRyaWJ1dGVzOiBbeyB0eXBlOiAnU1RSSU5HJywgdmFsdWU6IHBhdGggfV1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5jb25kc3RvcmUgJiYgdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdDT05EU1RPUkUnKSA+PSAwKSB7XG4gICAgICBxdWVyeS5hdHRyaWJ1dGVzLnB1c2goW3sgdHlwZTogJ0FUT00nLCB2YWx1ZTogJ0NPTkRTVE9SRScgfV0pXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ09wZW5pbmcnLCBwYXRoLCAnLi4uJylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhxdWVyeSwgWydFWElTVFMnLCAnRkxBR1MnLCAnT0snXSwgeyBjdHg6IG9wdGlvbnMuY3R4IH0pXG4gICAgbGV0IG1haWxib3hJbmZvID0gcGFyc2VTRUxFQ1QocmVzcG9uc2UpXG5cbiAgICB0aGlzLl9jaGFuZ2VTdGF0ZShTVEFURV9TRUxFQ1RFRClcblxuICAgIGlmICh0aGlzLl9zZWxlY3RlZE1haWxib3ggIT09IHBhdGggJiYgdGhpcy5vbmNsb3NlbWFpbGJveCkge1xuICAgICAgYXdhaXQgdGhpcy5vbmNsb3NlbWFpbGJveCh0aGlzLl9zZWxlY3RlZE1haWxib3gpXG4gICAgfVxuICAgIHRoaXMuX3NlbGVjdGVkTWFpbGJveCA9IHBhdGhcbiAgICBpZiAodGhpcy5vbnNlbGVjdG1haWxib3gpIHtcbiAgICAgIGF3YWl0IHRoaXMub25zZWxlY3RtYWlsYm94KHBhdGgsIG1haWxib3hJbmZvKVxuICAgIH1cblxuICAgIHJldHVybiBtYWlsYm94SW5mb1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgTkFNRVNQQUNFIGNvbW1hbmRcbiAgICpcbiAgICogTkFNRVNQQUNFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzIzNDJcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCBuYW1lc3BhY2Ugb2JqZWN0XG4gICAqL1xuICBhc3luYyBsaXN0TmFtZXNwYWNlcygpIHtcbiAgICBpZiAodGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdOQU1FU1BBQ0UnKSA8IDApIHJldHVybiBmYWxzZVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xpc3RpbmcgbmFtZXNwYWNlcy4uLicpXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoJ05BTUVTUEFDRScsICdOQU1FU1BBQ0UnKVxuICAgIHJldHVybiBwYXJzZU5BTUVTUEFDRShyZXNwb25zZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIExJU1QgYW5kIExTVUIgY29tbWFuZHMuIFJldHJpZXZlcyBhIHRyZWUgb2YgYXZhaWxhYmxlIG1haWxib3hlc1xuICAgKlxuICAgKiBMSVNUIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuMy44XG4gICAqIExTVUIgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjlcbiAgICpcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCBsaXN0IG9mIG1haWxib3hlc1xuICAgKi9cbiAgYXN5bmMgbGlzdE1haWxib3hlcygpIHtcbiAgICBjb25zdCB0cmVlID0geyByb290OiB0cnVlLCBjaGlsZHJlbjogW10gfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xpc3RpbmcgbWFpbGJveGVzLi4uJylcbiAgICBjb25zdCBsaXN0UmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoeyBjb21tYW5kOiAnTElTVCcsIGF0dHJpYnV0ZXM6IFsnJywgJyonXSB9LCAnTElTVCcpXG4gICAgY29uc3QgbGlzdCA9IHBhdGhPcihbXSwgWydwYXlsb2FkJywgJ0xJU1QnXSwgbGlzdFJlc3BvbnNlKVxuICAgIGxpc3QuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGNvbnN0IGF0dHIgPSBwcm9wT3IoW10sICdhdHRyaWJ1dGVzJywgaXRlbSlcbiAgICAgIGlmIChhdHRyLmxlbmd0aCA8IDMpIHJldHVyblxuXG4gICAgICBjb25zdCBwYXRoID0gcGF0aE9yKCcnLCBbJzInLCAndmFsdWUnXSwgYXR0cilcbiAgICAgIGNvbnN0IGRlbGltID0gcGF0aE9yKCcvJywgWycxJywgJ3ZhbHVlJ10sIGF0dHIpXG4gICAgICBjb25zdCBicmFuY2ggPSB0aGlzLl9lbnN1cmVQYXRoKHRyZWUsIHBhdGgsIGRlbGltKVxuICAgICAgYnJhbmNoLmZsYWdzID0gcHJvcE9yKFtdLCAnMCcsIGF0dHIpLm1hcCgoeyB2YWx1ZSB9KSA9PiB2YWx1ZSB8fCAnJylcbiAgICAgIGJyYW5jaC5saXN0ZWQgPSB0cnVlXG4gICAgICBjaGVja1NwZWNpYWxVc2UoYnJhbmNoKVxuICAgIH0pXG5cbiAgICBjb25zdCBsc3ViUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmV4ZWMoeyBjb21tYW5kOiAnTFNVQicsIGF0dHJpYnV0ZXM6IFsnJywgJyonXSB9LCAnTFNVQicpXG4gICAgY29uc3QgbHN1YiA9IHBhdGhPcihbXSwgWydwYXlsb2FkJywgJ0xTVUInXSwgbHN1YlJlc3BvbnNlKVxuICAgIGxzdWIuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgY29uc3QgYXR0ciA9IHByb3BPcihbXSwgJ2F0dHJpYnV0ZXMnLCBpdGVtKVxuICAgICAgaWYgKGF0dHIubGVuZ3RoIDwgMykgcmV0dXJuXG5cbiAgICAgIGNvbnN0IHBhdGggPSBwYXRoT3IoJycsIFsnMicsICd2YWx1ZSddLCBhdHRyKVxuICAgICAgY29uc3QgZGVsaW0gPSBwYXRoT3IoJy8nLCBbJzEnLCAndmFsdWUnXSwgYXR0cilcbiAgICAgIGNvbnN0IGJyYW5jaCA9IHRoaXMuX2Vuc3VyZVBhdGgodHJlZSwgcGF0aCwgZGVsaW0pXG4gICAgICBwcm9wT3IoW10sICcwJywgYXR0cikubWFwKChmbGFnID0gJycpID0+IHsgYnJhbmNoLmZsYWdzID0gdW5pb24oYnJhbmNoLmZsYWdzLCBbZmxhZ10pIH0pXG4gICAgICBicmFuY2guc3Vic2NyaWJlZCA9IHRydWVcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRyZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBtYWlsYm94IHdpdGggdGhlIGdpdmVuIHBhdGguXG4gICAqXG4gICAqIENSRUFURSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuM1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiAgICAgVGhlIHBhdGggb2YgdGhlIG1haWxib3ggeW91IHdvdWxkIGxpa2UgdG8gY3JlYXRlLiAgVGhpcyBtZXRob2Qgd2lsbFxuICAgKiAgICAgaGFuZGxlIHV0ZjcgZW5jb2RpbmcgZm9yIHlvdS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqICAgICBQcm9taXNlIHJlc29sdmVzIGlmIG1haWxib3ggd2FzIGNyZWF0ZWQuXG4gICAqICAgICBJbiB0aGUgZXZlbnQgdGhlIHNlcnZlciBzYXlzIE5PIFtBTFJFQURZRVhJU1RTXSwgd2UgdHJlYXQgdGhhdCBhcyBzdWNjZXNzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlTWFpbGJveChwYXRoKSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0NyZWF0aW5nIG1haWxib3gnLCBwYXRoLCAnLi4uJylcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5leGVjKHsgY29tbWFuZDogJ0NSRUFURScsIGF0dHJpYnV0ZXM6IFtpbWFwRW5jb2RlKHBhdGgpXSB9KVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyciAmJiBlcnIuY29kZSA9PT0gJ0FMUkVBRFlFWElTVFMnKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgdGhyb3cgZXJyXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIG1haWxib3ggd2l0aCB0aGUgZ2l2ZW4gcGF0aC5cbiAgICpcbiAgICogREVMRVRFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjMuNFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiAgICAgVGhlIHBhdGggb2YgdGhlIG1haWxib3ggeW91IHdvdWxkIGxpa2UgdG8gZGVsZXRlLiAgVGhpcyBtZXRob2Qgd2lsbFxuICAgKiAgICAgaGFuZGxlIHV0ZjcgZW5jb2RpbmcgZm9yIHlvdS5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqICAgICBQcm9taXNlIHJlc29sdmVzIGlmIG1haWxib3ggd2FzIGRlbGV0ZWQuXG4gICAqL1xuICBkZWxldGVNYWlsYm94KHBhdGgpIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRGVsZXRpbmcgbWFpbGJveCcsIHBhdGgsICcuLi4nKVxuICAgIHJldHVybiB0aGlzLmV4ZWMoeyBjb21tYW5kOiAnREVMRVRFJywgYXR0cmlidXRlczogW2ltYXBFbmNvZGUocGF0aCldIH0pXG4gIH1cblxuICAvKipcbiAgICogUnVucyBGRVRDSCBjb21tYW5kXG4gICAqXG4gICAqIEZFVENIIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC41XG4gICAqIENIQU5HRURTSU5DRSBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0NTUxI3NlY3Rpb24tMy4zXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzZXF1ZW5jZSBTZXF1ZW5jZSBzZXQsIGVnIDE6KiBmb3IgYWxsIG1lc3NhZ2VzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbaXRlbXNdIE1lc3NhZ2UgZGF0YSBpdGVtIG5hbWVzIG9yIG1hY3JvXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggdGhlIGZldGNoZWQgbWVzc2FnZSBpbmZvXG4gICAqL1xuICBhc3luYyBsaXN0TWVzc2FnZXMocGF0aCwgc2VxdWVuY2UsIGl0ZW1zID0gW3sgZmFzdDogdHJ1ZSB9XSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0ZldGNoaW5nIG1lc3NhZ2VzJywgc2VxdWVuY2UsICdmcm9tJywgcGF0aCwgJy4uLicpXG4gICAgY29uc3QgY29tbWFuZCA9IGJ1aWxkRkVUQ0hDb21tYW5kKHNlcXVlbmNlLCBpdGVtcywgb3B0aW9ucylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhjb21tYW5kLCAnRkVUQ0gnLCB7XG4gICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICB9KVxuICAgIHJldHVybiBwYXJzZUZFVENIKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU0VBUkNIIGNvbW1hbmRcbiAgICpcbiAgICogU0VBUkNIIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC40XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFRoZSBwYXRoIGZvciB0aGUgbWFpbGJveCB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWQgZm9yIHRoZSBjb21tYW5kLiBTZWxlY3RzIG1haWxib3ggaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBxdWVyeSBTZWFyY2ggdGVybXNcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCB0aGUgYXJyYXkgb2YgbWF0Y2hpbmcgc2VxLiBvciB1aWQgbnVtYmVyc1xuICAgKi9cbiAgYXN5bmMgc2VhcmNoKHBhdGgsIHF1ZXJ5LCBvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU2VhcmNoaW5nIGluJywgcGF0aCwgJy4uLicpXG4gICAgY29uc3QgY29tbWFuZCA9IGJ1aWxkU0VBUkNIQ29tbWFuZChxdWVyeSwgb3B0aW9ucylcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZXhlYyhjb21tYW5kLCAnU0VBUkNIJywge1xuICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgfSlcbiAgICByZXR1cm4gcGFyc2VTRUFSQ0gocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBTT1JUIGNvbW1hbmRcbiAgICpcbiAgICogU09SVCBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM1MjU2I3NlY3Rpb24tM1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge09iamVjdH0gc29ydFByb2dyYW0gU29ydCBjcml0ZXJpYVxuICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgU2VhcmNoIHRlcm1zXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlIHdpdGggdGhlIGFycmF5IG9mIG1hdGNoaW5nIHNlcS4gb3IgdWlkIG51bWJlcnNcbiAgICovXG4gIGFzeW5jIHNvcnQocGF0aCwgc29ydFByb2dyYW0sIHF1ZXJ5LCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAodGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdTT1JUJykgPj0gMCkge1xuICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NvcnRpbmcgaW4nLCBwYXRoLCAnLi4uJylcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBidWlsZFNPUlRDb21tYW5kKHNvcnRQcm9ncmFtLCBxdWVyeSwgb3B0aW9ucylcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQsICdTT1JUJywge1xuICAgICAgICBwcmVjaGVjazogKGN0eCkgPT4gdGhpcy5fc2hvdWxkU2VsZWN0TWFpbGJveChwYXRoLCBjdHgpID8gdGhpcy5zZWxlY3RNYWlsYm94KHBhdGgsIHsgY3R4IH0pIDogUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBwYXJzZVNPUlQocmVzcG9uc2UpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5sb2dnZXIuZGVidWcoJ1NPUlQgY2FwYWJpbGl0eSBpcyBub3Qgc3VwcG9ydGVkJylcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU1RPUkUgY29tbWFuZFxuICAgKlxuICAgKiBTVE9SRSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM1MDEjc2VjdGlvbi02LjQuNlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSBzZWxlY3RvciB3aGljaCB0aGUgZmxhZyBjaGFuZ2UgaXMgYXBwbGllZCB0b1xuICAgKiBAcGFyYW0ge0FycmF5fSBmbGFnc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIHRoZSBhcnJheSBvZiBtYXRjaGluZyBzZXEuIG9yIHVpZCBudW1iZXJzXG4gICAqL1xuICBzZXRGbGFncyhwYXRoLCBzZXF1ZW5jZSwgZmxhZ3MsIG9wdGlvbnMpIHtcbiAgICBsZXQga2V5ID0gJydcbiAgICBsZXQgbGlzdCA9IFtdXG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShmbGFncykgfHwgdHlwZW9mIGZsYWdzICE9PSAnb2JqZWN0Jykge1xuICAgICAgbGlzdCA9IFtdLmNvbmNhdChmbGFncyB8fCBbXSlcbiAgICAgIGtleSA9ICcnXG4gICAgfSBlbHNlIGlmIChmbGFncy5hZGQpIHtcbiAgICAgIGxpc3QgPSBbXS5jb25jYXQoZmxhZ3MuYWRkIHx8IFtdKVxuICAgICAga2V5ID0gJysnXG4gICAgfSBlbHNlIGlmIChmbGFncy5zZXQpIHtcbiAgICAgIGtleSA9ICcnXG4gICAgICBsaXN0ID0gW10uY29uY2F0KGZsYWdzLnNldCB8fCBbXSlcbiAgICB9IGVsc2UgaWYgKGZsYWdzLnJlbW92ZSkge1xuICAgICAga2V5ID0gJy0nXG4gICAgICBsaXN0ID0gW10uY29uY2F0KGZsYWdzLnJlbW92ZSB8fCBbXSlcbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU2V0dGluZyBmbGFncyBvbicsIHNlcXVlbmNlLCAnaW4nLCBwYXRoLCAnLi4uJylcbiAgICByZXR1cm4gdGhpcy5zdG9yZShwYXRoLCBzZXF1ZW5jZSwga2V5ICsgJ0ZMQUdTJywgbGlzdCwgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIFNUT1JFIGNvbW1hbmRcbiAgICpcbiAgICogU1RPUkUgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjZcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2Ugc2VsZWN0b3Igd2hpY2ggdGhlIGZsYWcgY2hhbmdlIGlzIGFwcGxpZWQgdG9cbiAgICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbiBTVE9SRSBtZXRob2QgdG8gY2FsbCwgZWcgXCIrRkxBR1NcIlxuICAgKiBAcGFyYW0ge0FycmF5fSBmbGFnc1xuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZSB3aXRoIHRoZSBhcnJheSBvZiBtYXRjaGluZyBzZXEuIG9yIHVpZCBudW1iZXJzXG4gICAqL1xuICBhc3luYyBzdG9yZShwYXRoLCBzZXF1ZW5jZSwgYWN0aW9uLCBmbGFncywgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgY29tbWFuZCA9IGJ1aWxkU1RPUkVDb21tYW5kKHNlcXVlbmNlLCBhY3Rpb24sIGZsYWdzLCBvcHRpb25zKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQsICdGRVRDSCcsIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gICAgcmV0dXJuIHBhcnNlRkVUQ0gocmVzcG9uc2UpXG4gIH1cblxuICAvKipcbiAgICogUnVucyBBUFBFTkQgY29tbWFuZFxuICAgKlxuICAgKiBBUFBFTkQgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4zLjExXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkZXN0aW5hdGlvbiBUaGUgbWFpbGJveCB3aGVyZSB0byBhcHBlbmQgdGhlIG1lc3NhZ2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gYXBwZW5kXG4gICAqIEBwYXJhbSB7QXJyYXl9IG9wdGlvbnMuZmxhZ3MgQW55IGZsYWdzIHlvdSB3YW50IHRvIHNldCBvbiB0aGUgdXBsb2FkZWQgbWVzc2FnZS4gRGVmYXVsdHMgdG8gW1xcU2Vlbl0uIChvcHRpb25hbClcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2Ugd2l0aCB0aGUgYXJyYXkgb2YgbWF0Y2hpbmcgc2VxLiBvciB1aWQgbnVtYmVyc1xuICAgKi9cbiAgdXBsb2FkKGRlc3RpbmF0aW9uLCBtZXNzYWdlLCBvcHRpb25zID0ge30pIHtcbiAgICBsZXQgZmxhZ3MgPSBwcm9wT3IoWydcXFxcU2VlbiddLCAnZmxhZ3MnLCBvcHRpb25zKS5tYXAodmFsdWUgPT4gKHsgdHlwZTogJ2F0b20nLCB2YWx1ZSB9KSlcbiAgICBsZXQgY29tbWFuZCA9IHtcbiAgICAgIGNvbW1hbmQ6ICdBUFBFTkQnLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7IHR5cGU6ICdhdG9tJywgdmFsdWU6IGRlc3RpbmF0aW9uIH0sXG4gICAgICAgIGZsYWdzLFxuICAgICAgICB7IHR5cGU6ICdsaXRlcmFsJywgdmFsdWU6IG1lc3NhZ2UgfVxuICAgICAgXVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdVcGxvYWRpbmcgbWVzc2FnZSB0bycsIGRlc3RpbmF0aW9uLCAnLi4uJylcbiAgICByZXR1cm4gdGhpcy5leGVjKGNvbW1hbmQpXG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBtZXNzYWdlcyBmcm9tIGEgc2VsZWN0ZWQgbWFpbGJveFxuICAgKlxuICAgKiBFWFBVTkdFIGRldGFpbHM6XG4gICAqICAgaHR0cDovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzUwMSNzZWN0aW9uLTYuNC4zXG4gICAqIFVJRCBFWFBVTkdFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzQzMTUjc2VjdGlvbi0yLjFcbiAgICpcbiAgICogSWYgcG9zc2libGUgKGJ5VWlkOnRydWUgYW5kIFVJRFBMVVMgZXh0ZW5zaW9uIHN1cHBvcnRlZCksIHVzZXMgVUlEIEVYUFVOR0VcbiAgICogY29tbWFuZCB0byBkZWxldGUgYSByYW5nZSBvZiBtZXNzYWdlcywgb3RoZXJ3aXNlIGZhbGxzIGJhY2sgdG8gRVhQVU5HRS5cbiAgICpcbiAgICogTkIhIFRoaXMgbWV0aG9kIG1pZ2h0IGJlIGRlc3RydWN0aXZlIC0gaWYgRVhQVU5HRSBpcyB1c2VkLCB0aGVuIGFueSBtZXNzYWdlc1xuICAgKiB3aXRoIFxcRGVsZXRlZCBmbGFnIHNldCBhcmUgZGVsZXRlZFxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBUaGUgcGF0aCBmb3IgdGhlIG1haWxib3ggd2hpY2ggc2hvdWxkIGJlIHNlbGVjdGVkIGZvciB0aGUgY29tbWFuZC4gU2VsZWN0cyBtYWlsYm94IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VxdWVuY2UgTWVzc2FnZSByYW5nZSB0byBiZSBkZWxldGVkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gUXVlcnkgbW9kaWZpZXJzXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfSBQcm9taXNlXG4gICAqL1xuICBhc3luYyBkZWxldGVNZXNzYWdlcyhwYXRoLCBzZXF1ZW5jZSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gYWRkIFxcRGVsZXRlZCBmbGFnIHRvIHRoZSBtZXNzYWdlcyBhbmQgcnVuIEVYUFVOR0Ugb3IgVUlEIEVYUFVOR0VcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRGVsZXRpbmcgbWVzc2FnZXMnLCBzZXF1ZW5jZSwgJ2luJywgcGF0aCwgJy4uLicpXG4gICAgY29uc3QgdXNlVWlkUGx1cyA9IG9wdGlvbnMuYnlVaWQgJiYgdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKCdVSURQTFVTJykgPj0gMFxuICAgIGNvbnN0IHVpZEV4cHVuZ2VDb21tYW5kID0geyBjb21tYW5kOiAnVUlEIEVYUFVOR0UnLCBhdHRyaWJ1dGVzOiBbeyB0eXBlOiAnc2VxdWVuY2UnLCB2YWx1ZTogc2VxdWVuY2UgfV0gfVxuICAgIGF3YWl0IHRoaXMuc2V0RmxhZ3MocGF0aCwgc2VxdWVuY2UsIHsgYWRkOiAnXFxcXERlbGV0ZWQnIH0sIG9wdGlvbnMpXG4gICAgY29uc3QgY21kID0gdXNlVWlkUGx1cyA/IHVpZEV4cHVuZ2VDb21tYW5kIDogJ0VYUFVOR0UnXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhjbWQsIG51bGwsIHtcbiAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGEgcmFuZ2Ugb2YgbWVzc2FnZXMgZnJvbSB0aGUgYWN0aXZlIG1haWxib3ggdG8gdGhlIGRlc3RpbmF0aW9uIG1haWxib3guXG4gICAqIFNpbGVudCBtZXRob2QgKHVubGVzcyBhbiBlcnJvciBvY2N1cnMpLCBieSBkZWZhdWx0IHJldHVybnMgbm8gaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIENPUFkgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi40LjdcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2UgcmFuZ2UgdG8gYmUgY29waWVkXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBkZXN0aW5hdGlvbiBEZXN0aW5hdGlvbiBtYWlsYm94IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBRdWVyeSBtb2RpZmllcnNcbiAgICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5ieVVpZF0gSWYgdHJ1ZSwgdXNlcyBVSUQgQ09QWSBpbnN0ZWFkIG9mIENPUFlcbiAgICogQHJldHVybnMge1Byb21pc2V9IFByb21pc2VcbiAgICovXG4gIGFzeW5jIGNvcHlNZXNzYWdlcyhwYXRoLCBzZXF1ZW5jZSwgZGVzdGluYXRpb24sIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDb3B5aW5nIG1lc3NhZ2VzJywgc2VxdWVuY2UsICdmcm9tJywgcGF0aCwgJ3RvJywgZGVzdGluYXRpb24sICcuLi4nKVxuICAgIGNvbnN0IHsgaHVtYW5SZWFkYWJsZSB9ID0gYXdhaXQgdGhpcy5leGVjKHtcbiAgICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIENPUFknIDogJ0NPUFknLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7IHR5cGU6ICdzZXF1ZW5jZScsIHZhbHVlOiBzZXF1ZW5jZSB9LFxuICAgICAgICB7IHR5cGU6ICdhdG9tJywgdmFsdWU6IGRlc3RpbmF0aW9uIH1cbiAgICAgIF1cbiAgICB9LCBudWxsLCB7XG4gICAgICAgIHByZWNoZWNrOiAoY3R4KSA9PiB0aGlzLl9zaG91bGRTZWxlY3RNYWlsYm94KHBhdGgsIGN0eCkgPyB0aGlzLnNlbGVjdE1haWxib3gocGF0aCwgeyBjdHggfSkgOiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgfSlcbiAgICByZXR1cm4gaHVtYW5SZWFkYWJsZSB8fCAnQ09QWSBjb21wbGV0ZWQnXG4gIH1cblxuICAvKipcbiAgICogTW92ZXMgYSByYW5nZSBvZiBtZXNzYWdlcyBmcm9tIHRoZSBhY3RpdmUgbWFpbGJveCB0byB0aGUgZGVzdGluYXRpb24gbWFpbGJveC5cbiAgICogUHJlZmVycyB0aGUgTU9WRSBleHRlbnNpb24gYnV0IGlmIG5vdCBhdmFpbGFibGUsIGZhbGxzIGJhY2sgdG9cbiAgICogQ09QWSArIEVYUFVOR0VcbiAgICpcbiAgICogTU9WRSBkZXRhaWxzOlxuICAgKiAgIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzY4NTFcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggVGhlIHBhdGggZm9yIHRoZSBtYWlsYm94IHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZCBmb3IgdGhlIGNvbW1hbmQuIFNlbGVjdHMgbWFpbGJveCBpZiBuZWNlc3NhcnlcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlcXVlbmNlIE1lc3NhZ2UgcmFuZ2UgdG8gYmUgbW92ZWRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGRlc3RpbmF0aW9uIERlc3RpbmF0aW9uIG1haWxib3ggcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIFF1ZXJ5IG1vZGlmaWVyc1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUHJvbWlzZVxuICAgKi9cbiAgYXN5bmMgbW92ZU1lc3NhZ2VzKHBhdGgsIHNlcXVlbmNlLCBkZXN0aW5hdGlvbiwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ01vdmluZyBtZXNzYWdlcycsIHNlcXVlbmNlLCAnZnJvbScsIHBhdGgsICd0bycsIGRlc3RpbmF0aW9uLCAnLi4uJylcblxuICAgIGlmICh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ01PVkUnKSA9PT0gLTEpIHtcbiAgICAgIC8vIEZhbGxiYWNrIHRvIENPUFkgKyBFWFBVTkdFXG4gICAgICBhd2FpdCB0aGlzLmNvcHlNZXNzYWdlcyhwYXRoLCBzZXF1ZW5jZSwgZGVzdGluYXRpb24sIG9wdGlvbnMpXG4gICAgICByZXR1cm4gdGhpcy5kZWxldGVNZXNzYWdlcyhwYXRoLCBzZXF1ZW5jZSwgb3B0aW9ucylcbiAgICB9XG5cbiAgICAvLyBJZiBwb3NzaWJsZSwgdXNlIE1PVkVcbiAgICByZXR1cm4gdGhpcy5leGVjKHtcbiAgICAgIGNvbW1hbmQ6IG9wdGlvbnMuYnlVaWQgPyAnVUlEIE1PVkUnIDogJ01PVkUnLFxuICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICB7IHR5cGU6ICdzZXF1ZW5jZScsIHZhbHVlOiBzZXF1ZW5jZSB9LFxuICAgICAgICB7IHR5cGU6ICdhdG9tJywgdmFsdWU6IGRlc3RpbmF0aW9uIH1cbiAgICAgIF1cbiAgICB9LCBbJ09LJ10sIHtcbiAgICAgICAgcHJlY2hlY2s6IChjdHgpID0+IHRoaXMuX3Nob3VsZFNlbGVjdE1haWxib3gocGF0aCwgY3R4KSA/IHRoaXMuc2VsZWN0TWFpbGJveChwYXRoLCB7IGN0eCB9KSA6IFByb21pc2UucmVzb2x2ZSgpXG4gICAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgQ09NUFJFU1MgY29tbWFuZFxuICAgKlxuICAgKiBDT01QUkVTUyBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmM0OTc4XG4gICAqL1xuICBhc3luYyBjb21wcmVzc0Nvbm5lY3Rpb24oKSB7XG4gICAgaWYgKCF0aGlzLl9lbmFibGVDb21wcmVzc2lvbiB8fCB0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ0NPTVBSRVNTPURFRkxBVEUnKSA8IDAgfHwgdGhpcy5jbGllbnQuY29tcHJlc3NlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0VuYWJsaW5nIGNvbXByZXNzaW9uLi4uJylcbiAgICBhd2FpdCB0aGlzLmV4ZWMoe1xuICAgICAgY29tbWFuZDogJ0NPTVBSRVNTJyxcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIHR5cGU6ICdBVE9NJyxcbiAgICAgICAgdmFsdWU6ICdERUZMQVRFJ1xuICAgICAgfV1cbiAgICB9KVxuICAgIHRoaXMuY2xpZW50LmVuYWJsZUNvbXByZXNzaW9uKClcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnQ29tcHJlc3Npb24gZW5hYmxlZCwgYWxsIGRhdGEgc2VudCBhbmQgcmVjZWl2ZWQgaXMgZGVmbGF0ZWQhJylcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIExPR0lOIG9yIEFVVEhFTlRJQ0FURSBYT0FVVEgyIGNvbW1hbmRcbiAgICpcbiAgICogTE9HSU4gZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4yLjNcbiAgICogWE9BVVRIMiBkZXRhaWxzOlxuICAgKiAgIGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL2dtYWlsL3hvYXV0aDJfcHJvdG9jb2wjaW1hcF9wcm90b2NvbF9leGNoYW5nZVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXV0aC51c2VyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhdXRoLnBhc3NcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF1dGgueG9hdXRoMlxuICAgKi9cbiAgYXN5bmMgbG9naW4oYXV0aCkge1xuICAgIGxldCBjb21tYW5kXG4gICAgbGV0IG9wdGlvbnMgPSB7fVxuXG4gICAgaWYgKCFhdXRoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIGluZm9ybWF0aW9uIG5vdCBwcm92aWRlZCcpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignQVVUSD1YT0FVVEgyJykgPj0gMCAmJiBhdXRoICYmIGF1dGgueG9hdXRoMikge1xuICAgICAgY29tbWFuZCA9IHtcbiAgICAgICAgY29tbWFuZDogJ0FVVEhFTlRJQ0FURScsXG4gICAgICAgIGF0dHJpYnV0ZXM6IFtcbiAgICAgICAgICB7IHR5cGU6ICdBVE9NJywgdmFsdWU6ICdYT0FVVEgyJyB9LFxuICAgICAgICAgIHsgdHlwZTogJ0FUT00nLCB2YWx1ZTogYnVpbGRYT0F1dGgyVG9rZW4oYXV0aC51c2VyLCBhdXRoLnhvYXV0aDIpLCBzZW5zaXRpdmU6IHRydWUgfVxuICAgICAgICBdXG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMuZXJyb3JSZXNwb25zZUV4cGVjdHNFbXB0eUxpbmUgPSB0cnVlIC8vICsgdGFnZ2VkIGVycm9yIHJlc3BvbnNlIGV4cGVjdHMgYW4gZW1wdHkgbGluZSBpbiByZXR1cm5cbiAgICB9IGVsc2Uge1xuICAgICAgY29tbWFuZCA9IHtcbiAgICAgICAgY29tbWFuZDogJ2xvZ2luJyxcbiAgICAgICAgYXR0cmlidXRlczogW1xuICAgICAgICAgIHsgdHlwZTogJ1NUUklORycsIHZhbHVlOiBhdXRoLnVzZXIgfHwgJycgfSxcbiAgICAgICAgICB7IHR5cGU6ICdTVFJJTkcnLCB2YWx1ZTogYXV0aC5wYXNzIHx8ICcnLCBzZW5zaXRpdmU6IHRydWUgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ0xvZ2dpbmcgaW4uLi4nKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5leGVjKGNvbW1hbmQsICdjYXBhYmlsaXR5Jywgb3B0aW9ucylcbiAgICAvKlxuICAgICAqIHVwZGF0ZSBwb3N0LWF1dGggY2FwYWJpbGl0ZXNcbiAgICAgKiBjYXBhYmlsaXR5IGxpc3Qgc2hvdWxkbid0IGNvbnRhaW4gYXV0aCByZWxhdGVkIHN0dWZmIGFueW1vcmVcbiAgICAgKiBidXQgc29tZSBuZXcgZXh0ZW5zaW9ucyBtaWdodCBoYXZlIHBvcHBlZCB1cCB0aGF0IGRvIG5vdFxuICAgICAqIG1ha2UgbXVjaCBzZW5zZSBpbiB0aGUgbm9uLWF1dGggc3RhdGVcbiAgICAgKi9cbiAgICBpZiAocmVzcG9uc2UuY2FwYWJpbGl0eSAmJiByZXNwb25zZS5jYXBhYmlsaXR5Lmxlbmd0aCkge1xuICAgICAgLy8gY2FwYWJpbGl0ZXMgd2VyZSBsaXN0ZWQgd2l0aCB0aGUgT0sgW0NBUEFCSUxJVFkgLi4uXSByZXNwb25zZVxuICAgICAgdGhpcy5fY2FwYWJpbGl0eSA9IHJlc3BvbnNlLmNhcGFiaWxpdHlcbiAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLnBheWxvYWQgJiYgcmVzcG9uc2UucGF5bG9hZC5DQVBBQklMSVRZICYmIHJlc3BvbnNlLnBheWxvYWQuQ0FQQUJJTElUWS5sZW5ndGgpIHtcbiAgICAgIC8vIGNhcGFiaWxpdGVzIHdlcmUgbGlzdGVkIHdpdGggKiBDQVBBQklMSVRZIC4uLiByZXNwb25zZVxuICAgICAgdGhpcy5fY2FwYWJpbGl0eSA9IHJlc3BvbnNlLnBheWxvYWQuQ0FQQUJJTElUWS5wb3AoKS5hdHRyaWJ1dGVzLm1hcCgoY2FwYSA9ICcnKSA9PiBjYXBhLnZhbHVlLnRvVXBwZXJDYXNlKCkudHJpbSgpKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjYXBhYmlsaXRpZXMgd2VyZSBub3QgYXV0b21hdGljYWxseSBsaXN0ZWQsIHJlbG9hZFxuICAgICAgYXdhaXQgdGhpcy51cGRhdGVDYXBhYmlsaXR5KHRydWUpXG4gICAgfVxuXG4gICAgdGhpcy5fY2hhbmdlU3RhdGUoU1RBVEVfQVVUSEVOVElDQVRFRClcbiAgICB0aGlzLl9hdXRoZW50aWNhdGVkID0gdHJ1ZVxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdMb2dpbiBzdWNjZXNzZnVsLCBwb3N0LWF1dGggY2FwYWJpbGl0ZXMgdXBkYXRlZCEnLCB0aGlzLl9jYXBhYmlsaXR5KVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbiBJTUFQIGNvbW1hbmQuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXF1ZXN0IFN0cnVjdHVyZWQgcmVxdWVzdCBvYmplY3RcbiAgICogQHBhcmFtIHtBcnJheX0gYWNjZXB0VW50YWdnZWQgYSBsaXN0IG9mIHVudGFnZ2VkIHJlc3BvbnNlcyB0aGF0IHdpbGwgYmUgaW5jbHVkZWQgaW4gJ3BheWxvYWQnIHByb3BlcnR5XG4gICAqL1xuICBhc3luYyBleGVjKHJlcXVlc3QsIGFjY2VwdFVudGFnZ2VkLCBvcHRpb25zKSB7XG4gICAgdGhpcy5icmVha0lkbGUoKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGllbnQuZW5xdWV1ZUNvbW1hbmQocmVxdWVzdCwgYWNjZXB0VW50YWdnZWQsIG9wdGlvbnMpXG4gICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmNhcGFiaWxpdHkpIHtcbiAgICAgIHRoaXMuX2NhcGFiaWxpdHkgPSByZXNwb25zZS5jYXBhYmlsaXR5XG4gICAgfVxuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBjb25uZWN0aW9uIGlzIGlkbGluZy4gU2VuZHMgYSBOT09QIG9yIElETEUgY29tbWFuZFxuICAgKlxuICAgKiBJRExFIGRldGFpbHM6XG4gICAqICAgaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzIxNzdcbiAgICovXG4gIGVudGVySWRsZSgpIHtcbiAgICBpZiAodGhpcy5fZW50ZXJlZElkbGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB0aGlzLl9lbnRlcmVkSWRsZSA9IHRoaXMuX2NhcGFiaWxpdHkuaW5kZXhPZignSURMRScpID49IDAgPyAnSURMRScgOiAnTk9PUCdcbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRW50ZXJpbmcgaWRsZSB3aXRoICcgKyB0aGlzLl9lbnRlcmVkSWRsZSlcblxuICAgIGlmICh0aGlzLl9lbnRlcmVkSWRsZSA9PT0gJ05PT1AnKSB7XG4gICAgICB0aGlzLl9pZGxlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnU2VuZGluZyBOT09QJylcbiAgICAgICAgdGhpcy5leGVjKCdOT09QJylcbiAgICAgIH0sIHRoaXMudGltZW91dE5vb3ApXG4gICAgfSBlbHNlIGlmICh0aGlzLl9lbnRlcmVkSWRsZSA9PT0gJ0lETEUnKSB7XG4gICAgICB0aGlzLmNsaWVudC5lbnF1ZXVlQ29tbWFuZCh7XG4gICAgICAgIGNvbW1hbmQ6ICdJRExFJ1xuICAgICAgfSlcbiAgICAgIHRoaXMuX2lkbGVUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuY2xpZW50LnNlbmQoJ0RPTkVcXHJcXG4nKVxuICAgICAgICB0aGlzLl9lbnRlcmVkSWRsZSA9IGZhbHNlXG4gICAgICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdJZGxlIHRlcm1pbmF0ZWQnKVxuICAgICAgfSwgdGhpcy50aW1lb3V0SWRsZSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RvcHMgYWN0aW9ucyByZWxhdGVkIGlkbGluZywgaWYgSURMRSBpcyBzdXBwb3J0ZWQsIHNlbmRzIERPTkUgdG8gc3RvcCBpdFxuICAgKi9cbiAgYnJlYWtJZGxlKCkge1xuICAgIGlmICghdGhpcy5fZW50ZXJlZElkbGUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0aGlzLl9pZGxlVGltZW91dClcbiAgICBpZiAodGhpcy5fZW50ZXJlZElkbGUgPT09ICdJRExFJykge1xuICAgICAgdGhpcy5jbGllbnQuc2VuZCgnRE9ORVxcclxcbicpXG4gICAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnSWRsZSB0ZXJtaW5hdGVkJylcbiAgICB9XG4gICAgdGhpcy5fZW50ZXJlZElkbGUgPSBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgU1RBUlRUTFMgY29tbWFuZCBpZiBuZWVkZWRcbiAgICpcbiAgICogU1RBUlRUTFMgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4yLjFcbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufSBbZm9yY2VkXSBCeSBkZWZhdWx0IHRoZSBjb21tYW5kIGlzIG5vdCBydW4gaWYgY2FwYWJpbGl0eSBpcyBhbHJlYWR5IGxpc3RlZC4gU2V0IHRvIHRydWUgdG8gc2tpcCB0aGlzIHZhbGlkYXRpb25cbiAgICovXG4gIGFzeW5jIHVwZ3JhZGVDb25uZWN0aW9uKCkge1xuICAgIC8vIHNraXAgcmVxdWVzdCwgaWYgYWxyZWFkeSBzZWN1cmVkXG4gICAgaWYgKHRoaXMuY2xpZW50LnNlY3VyZU1vZGUpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIHNraXAgaWYgU1RBUlRUTFMgbm90IGF2YWlsYWJsZSBvciBzdGFydHRscyBzdXBwb3J0IGRpc2FibGVkXG4gICAgaWYgKCh0aGlzLl9jYXBhYmlsaXR5LmluZGV4T2YoJ1NUQVJUVExTJykgPCAwIHx8IHRoaXMuX2lnbm9yZVRMUykgJiYgIXRoaXMuX3JlcXVpcmVUTFMpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdFbmNyeXB0aW5nIGNvbm5lY3Rpb24uLi4nKVxuICAgIGF3YWl0IHRoaXMuZXhlYygnU1RBUlRUTFMnKVxuICAgIHRoaXMuX2NhcGFiaWxpdHkgPSBbXVxuICAgIHRoaXMuY2xpZW50LnVwZ3JhZGUoKVxuICAgIHJldHVybiB0aGlzLnVwZGF0ZUNhcGFiaWxpdHkoKVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgQ0FQQUJJTElUWSBjb21tYW5kXG4gICAqXG4gICAqIENBUEFCSUxJVFkgZGV0YWlsczpcbiAgICogICBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNTAxI3NlY3Rpb24tNi4xLjFcbiAgICpcbiAgICogRG9lc24ndCByZWdpc3RlciB1bnRhZ2dlZCBDQVBBQklMSVRZIGhhbmRsZXIgYXMgdGhpcyBpcyBhbHJlYWR5XG4gICAqIGhhbmRsZWQgYnkgZ2xvYmFsIGhhbmRsZXJcbiAgICpcbiAgICogQHBhcmFtIHtCb29sZWFufSBbZm9yY2VkXSBCeSBkZWZhdWx0IHRoZSBjb21tYW5kIGlzIG5vdCBydW4gaWYgY2FwYWJpbGl0eSBpcyBhbHJlYWR5IGxpc3RlZC4gU2V0IHRvIHRydWUgdG8gc2tpcCB0aGlzIHZhbGlkYXRpb25cbiAgICovXG4gIGFzeW5jIHVwZGF0ZUNhcGFiaWxpdHkoZm9yY2VkKSB7XG4gICAgLy8gc2tpcCByZXF1ZXN0LCBpZiBub3QgZm9yY2VkIHVwZGF0ZSBhbmQgY2FwYWJpbGl0aWVzIGFyZSBhbHJlYWR5IGxvYWRlZFxuICAgIGlmICghZm9yY2VkICYmIHRoaXMuX2NhcGFiaWxpdHkubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBJZiBTVEFSVFRMUyBpcyByZXF1aXJlZCB0aGVuIHNraXAgY2FwYWJpbGl0eSBsaXN0aW5nIGFzIHdlIGFyZSBnb2luZyB0byB0cnlcbiAgICAvLyBTVEFSVFRMUyBhbnl3YXkgYW5kIHdlIHJlLWNoZWNrIGNhcGFiaWxpdGllcyBhZnRlciBjb25uZWN0aW9uIGlzIHNlY3VyZWRcbiAgICBpZiAoIXRoaXMuY2xpZW50LnNlY3VyZU1vZGUgJiYgdGhpcy5fcmVxdWlyZVRMUykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5sb2dnZXIuZGVidWcoJ1VwZGF0aW5nIGNhcGFiaWxpdHkuLi4nKVxuICAgIHJldHVybiB0aGlzLmV4ZWMoJ0NBUEFCSUxJVFknKVxuICB9XG5cbiAgaGFzQ2FwYWJpbGl0eShjYXBhID0gJycpIHtcbiAgICByZXR1cm4gdGhpcy5fY2FwYWJpbGl0eS5pbmRleE9mKGNhcGEudG9VcHBlckNhc2UoKS50cmltKCkpID49IDBcbiAgfVxuXG4gIC8vIERlZmF1bHQgaGFuZGxlcnMgZm9yIHVudGFnZ2VkIHJlc3BvbnNlc1xuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYW4gdW50YWdnZWQgT0sgaW5jbHVkZXMgW0NBUEFCSUxJVFldIHRhZyBhbmQgdXBkYXRlcyBjYXBhYmlsaXR5IG9iamVjdFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHNlcnZlciByZXNwb25zZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IFVudGlsIGNhbGxlZCwgc2VydmVyIHJlc3BvbnNlcyBhcmUgbm90IHByb2Nlc3NlZFxuICAgKi9cbiAgX3VudGFnZ2VkT2tIYW5kbGVyKHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmNhcGFiaWxpdHkpIHtcbiAgICAgIHRoaXMuX2NhcGFiaWxpdHkgPSByZXNwb25zZS5jYXBhYmlsaXR5XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgY2FwYWJpbGl0eSBvYmplY3RcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBzZXJ2ZXIgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBVbnRpbCBjYWxsZWQsIHNlcnZlciByZXNwb25zZXMgYXJlIG5vdCBwcm9jZXNzZWRcbiAgICovXG4gIF91bnRhZ2dlZENhcGFiaWxpdHlIYW5kbGVyKHJlc3BvbnNlKSB7XG4gICAgdGhpcy5fY2FwYWJpbGl0eSA9IHBpcGUoXG4gICAgICBwcm9wT3IoW10sICdhdHRyaWJ1dGVzJyksXG4gICAgICBtYXAoKHsgdmFsdWUgfSkgPT4gKHZhbHVlIHx8ICcnKS50b1VwcGVyQ2FzZSgpLnRyaW0oKSlcbiAgICApKHJlc3BvbnNlKVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgZXhpc3RpbmcgbWVzc2FnZSBjb3VudFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgUGFyc2VkIHNlcnZlciByZXNwb25zZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0IFVudGlsIGNhbGxlZCwgc2VydmVyIHJlc3BvbnNlcyBhcmUgbm90IHByb2Nlc3NlZFxuICAgKi9cbiAgX3VudGFnZ2VkRXhpc3RzSGFuZGxlcihyZXNwb25zZSkge1xuICAgIGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5oYXNPd25Qcm9wZXJ0eSgnbnInKSkge1xuICAgICAgdGhpcy5vbnVwZGF0ZSAmJiB0aGlzLm9udXBkYXRlKHRoaXMuX3NlbGVjdGVkTWFpbGJveCwgJ2V4aXN0cycsIHJlc3BvbnNlLm5yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgYSBtZXNzYWdlIGhhcyBiZWVuIGRlbGV0ZWRcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHJlc3BvbnNlIFBhcnNlZCBzZXJ2ZXIgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dCBVbnRpbCBjYWxsZWQsIHNlcnZlciByZXNwb25zZXMgYXJlIG5vdCBwcm9jZXNzZWRcbiAgICovXG4gIF91bnRhZ2dlZEV4cHVuZ2VIYW5kbGVyKHJlc3BvbnNlKSB7XG4gICAgaWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmhhc093blByb3BlcnR5KCducicpKSB7XG4gICAgICB0aGlzLm9udXBkYXRlICYmIHRoaXMub251cGRhdGUodGhpcy5fc2VsZWN0ZWRNYWlsYm94LCAnZXhwdW5nZScsIHJlc3BvbnNlLm5yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhhdCBmbGFncyBoYXZlIGJlZW4gdXBkYXRlZCBmb3IgYSBtZXNzYWdlXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByZXNwb25zZSBQYXJzZWQgc2VydmVyIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHQgVW50aWwgY2FsbGVkLCBzZXJ2ZXIgcmVzcG9uc2VzIGFyZSBub3QgcHJvY2Vzc2VkXG4gICAqL1xuICBfdW50YWdnZWRGZXRjaEhhbmRsZXIocmVzcG9uc2UpIHtcbiAgICB0aGlzLm9udXBkYXRlICYmIHRoaXMub251cGRhdGUodGhpcy5fc2VsZWN0ZWRNYWlsYm94LCAnZmV0Y2gnLCBbXS5jb25jYXQocGFyc2VGRVRDSCh7IHBheWxvYWQ6IHsgRkVUQ0g6IFtyZXNwb25zZV0gfSB9KSB8fCBbXSkuc2hpZnQoKSlcbiAgfVxuXG4gIC8vIFByaXZhdGUgaGVscGVyc1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhhdCB0aGUgY29ubmVjdGlvbiBzdGFydGVkIGlkbGluZy4gSW5pdGlhdGVzIGEgY3ljbGVcbiAgICogb2YgTk9PUHMgb3IgSURMRXMgdG8gcmVjZWl2ZSBub3RpZmljYXRpb25zIGFib3V0IHVwZGF0ZXMgaW4gdGhlIHNlcnZlclxuICAgKi9cbiAgX29uSWRsZSgpIHtcbiAgICBpZiAoIXRoaXMuX2F1dGhlbnRpY2F0ZWQgfHwgdGhpcy5fZW50ZXJlZElkbGUpIHtcbiAgICAgIC8vIE5vIG5lZWQgdG8gSURMRSB3aGVuIG5vdCBsb2dnZWQgaW4gb3IgYWxyZWFkeSBpZGxpbmdcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmRlYnVnKCdDbGllbnQgc3RhcnRlZCBpZGxpbmcnKVxuICAgIHRoaXMuZW50ZXJJZGxlKClcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBJTUFQIHN0YXRlIHZhbHVlIGZvciB0aGUgY3VycmVudCBjb25uZWN0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBuZXdTdGF0ZSBUaGUgc3RhdGUgeW91IHdhbnQgdG8gY2hhbmdlIHRvXG4gICAqL1xuICBfY2hhbmdlU3RhdGUobmV3U3RhdGUpIHtcbiAgICBpZiAobmV3U3RhdGUgPT09IHRoaXMuX3N0YXRlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLmxvZ2dlci5kZWJ1ZygnRW50ZXJpbmcgc3RhdGU6ICcgKyBuZXdTdGF0ZSlcblxuICAgIC8vIGlmIGEgbWFpbGJveCB3YXMgb3BlbmVkLCBlbWl0IG9uY2xvc2VtYWlsYm94IGFuZCBjbGVhciBzZWxlY3RlZE1haWxib3ggdmFsdWVcbiAgICBpZiAodGhpcy5fc3RhdGUgPT09IFNUQVRFX1NFTEVDVEVEICYmIHRoaXMuX3NlbGVjdGVkTWFpbGJveCkge1xuICAgICAgdGhpcy5vbmNsb3NlbWFpbGJveCAmJiB0aGlzLm9uY2xvc2VtYWlsYm94KHRoaXMuX3NlbGVjdGVkTWFpbGJveClcbiAgICAgIHRoaXMuX3NlbGVjdGVkTWFpbGJveCA9IGZhbHNlXG4gICAgfVxuXG4gICAgdGhpcy5fc3RhdGUgPSBuZXdTdGF0ZVxuICB9XG5cbiAgLyoqXG4gICAqIEVuc3VyZXMgYSBwYXRoIGV4aXN0cyBpbiB0aGUgTWFpbGJveCB0cmVlXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0cmVlIE1haWxib3ggdHJlZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge1N0cmluZ30gZGVsaW1pdGVyXG4gICAqIEByZXR1cm4ge09iamVjdH0gYnJhbmNoIGZvciB1c2VkIHBhdGhcbiAgICovXG4gIF9lbnN1cmVQYXRoKHRyZWUsIHBhdGgsIGRlbGltaXRlcikge1xuICAgIGNvbnN0IG5hbWVzID0gcGF0aC5zcGxpdChkZWxpbWl0ZXIpXG4gICAgbGV0IGJyYW5jaCA9IHRyZWVcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJyYW5jaC5jaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAodGhpcy5fY29tcGFyZU1haWxib3hOYW1lcyhicmFuY2guY2hpbGRyZW5bal0ubmFtZSwgaW1hcERlY29kZShuYW1lc1tpXSkpKSB7XG4gICAgICAgICAgYnJhbmNoID0gYnJhbmNoLmNoaWxkcmVuW2pdXG4gICAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICBicmFuY2guY2hpbGRyZW4ucHVzaCh7XG4gICAgICAgICAgbmFtZTogaW1hcERlY29kZShuYW1lc1tpXSksXG4gICAgICAgICAgZGVsaW1pdGVyOiBkZWxpbWl0ZXIsXG4gICAgICAgICAgcGF0aDogbmFtZXMuc2xpY2UoMCwgaSArIDEpLmpvaW4oZGVsaW1pdGVyKSxcbiAgICAgICAgICBjaGlsZHJlbjogW11cbiAgICAgICAgfSlcbiAgICAgICAgYnJhbmNoID0gYnJhbmNoLmNoaWxkcmVuW2JyYW5jaC5jaGlsZHJlbi5sZW5ndGggLSAxXVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnJhbmNoXG4gIH1cblxuICAvKipcbiAgICogQ29tcGFyZXMgdHdvIG1haWxib3ggbmFtZXMuIENhc2UgaW5zZW5zaXRpdmUgaW4gY2FzZSBvZiBJTkJPWCwgb3RoZXJ3aXNlIGNhc2Ugc2Vuc2l0aXZlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBhIE1haWxib3ggbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gYiBNYWlsYm94IG5hbWVcbiAgICogQHJldHVybnMge0Jvb2xlYW59IFRydWUgaWYgdGhlIGZvbGRlciBuYW1lcyBtYXRjaFxuICAgKi9cbiAgX2NvbXBhcmVNYWlsYm94TmFtZXMoYSwgYikge1xuICAgIHJldHVybiAoYS50b1VwcGVyQ2FzZSgpID09PSAnSU5CT1gnID8gJ0lOQk9YJyA6IGEpID09PSAoYi50b1VwcGVyQ2FzZSgpID09PSAnSU5CT1gnID8gJ0lOQk9YJyA6IGIpXG4gIH1cblxuICBjcmVhdGVMb2dnZXIoY3JlYXRvciA9IGNyZWF0ZURlZmF1bHRMb2dnZXIpIHtcbiAgICBjb25zdCBsb2dnZXIgPSBjcmVhdG9yKCh0aGlzLl9hdXRoIHx8IHt9KS51c2VyIHx8ICcnLCB0aGlzLl9ob3N0KVxuICAgIHRoaXMubG9nZ2VyID0gdGhpcy5jbGllbnQubG9nZ2VyID0ge1xuICAgICAgZGVidWc6ICguLi5tc2dzKSA9PiB7IGlmIChMT0dfTEVWRUxfREVCVUcgPj0gdGhpcy5sb2dMZXZlbCkgeyBsb2dnZXIuZGVidWcobXNncykgfSB9LFxuICAgICAgaW5mbzogKC4uLm1zZ3MpID0+IHsgaWYgKExPR19MRVZFTF9JTkZPID49IHRoaXMubG9nTGV2ZWwpIHsgbG9nZ2VyLmluZm8obXNncykgfSB9LFxuICAgICAgd2FybjogKC4uLm1zZ3MpID0+IHsgaWYgKExPR19MRVZFTF9XQVJOID49IHRoaXMubG9nTGV2ZWwpIHsgbG9nZ2VyLndhcm4obXNncykgfSB9LFxuICAgICAgZXJyb3I6ICguLi5tc2dzKSA9PiB7IGlmIChMT0dfTEVWRUxfRVJST1IgPj0gdGhpcy5sb2dMZXZlbCkgeyBsb2dnZXIuZXJyb3IobXNncykgfSB9XG4gICAgfVxuICB9XG59XG4iXX0=