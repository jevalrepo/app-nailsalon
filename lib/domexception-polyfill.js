// DOMException polyfill for Hermes — no imports allowed in this file
if (typeof globalThis.DOMException === 'undefined') {
  var DOMExceptionPolyfill = function DOMException(message, name) {
    this.message = message || '';
    this.name = name || 'Error';
    this.code = 0;
  };
  DOMExceptionPolyfill.prototype = Object.create(Error.prototype);
  DOMExceptionPolyfill.ABORT_ERR = 20;
  DOMExceptionPolyfill.HIERARCHY_REQUEST_ERR = 3;
  DOMExceptionPolyfill.INDEX_SIZE_ERR = 1;
  DOMExceptionPolyfill.INUSE_ATTRIBUTE_ERR = 10;
  DOMExceptionPolyfill.INVALID_CHARACTER_ERR = 5;
  DOMExceptionPolyfill.INVALID_MODIFICATION_ERR = 13;
  DOMExceptionPolyfill.INVALID_STATE_ERR = 11;
  DOMExceptionPolyfill.NAMESPACE_ERR = 14;
  DOMExceptionPolyfill.NOT_FOUND_ERR = 8;
  DOMExceptionPolyfill.NOT_SUPPORTED_ERR = 9;
  DOMExceptionPolyfill.NO_MODIFICATION_ALLOWED_ERR = 7;
  DOMExceptionPolyfill.SYNTAX_ERR = 12;
  DOMExceptionPolyfill.WRONG_DOCUMENT_ERR = 4;
  globalThis.DOMException = DOMExceptionPolyfill;
}
