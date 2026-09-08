
(function (global) {
  'use strict';

  var savedFiles = new Map();
  var listeners = new Map();
  var openDriveHandler = function () {};
  var saveRequestHandler = function () {};
  var ICONS = Object.freeze({
    saveDrive: '<path d="M12 2v8"></path><path d="m16 6-4 4-4-4"></path><rect width="20" height="8" x="2" y="14" rx="2"></rect><path d="M6 18h.01"></path><path d="M10 18h.01"></path>',
    viewDrive: '<path d="M10 16h.01"></path><path d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><path d="M21.946 12.013H2.054"></path><path d="M6 16h.01"></path>'
  });

  function normalizeFile(file) {
    return typeof file === 'string' ? {name: file} : (file || {});
  }

  function keyFor(file, context) {
    var value = normalizeFile(file);
    var source = context || {};
    return [source.conversationId || source.groupId || '', source.messageId || '', value.id || value.attachmentId || '', value.version || 1, value.name || ''].join('|');
  }

  function savedRecord(file, context, record) {
    return record || savedFiles.get(keyFor(file, context)) || null;
  }

  function isSaved(file, context, record) {
    return Boolean(savedRecord(file, context, record));
  }

  function action(file, context, record) {
    var saved = isSaved(file, context, record);
    return {
      key: saved ? 'viewDrive' : 'saveDrive',
      title: saved ? '前往文件库查看' : '存到文件库',
      saved: saved
    };
  }

  function iconBody(actionKey) {
    return ICONS[actionKey] || '';
  }

  function notify(key) {
    var callbacks = listeners.get(key);
    if (!callbacks) return;
    callbacks.forEach(function (callback) {
      callback(true);
    });
  }

  function subscribe(file, context, callback) {
    if (typeof context === 'function') { callback = context; context = null; }
    var key = keyFor(file, context);
    if (!key || typeof callback !== 'function') return function () {};
    var callbacks = listeners.get(key);
    if (!callbacks) {
      callbacks = new Set();
      listeners.set(key, callbacks);
    }
    callbacks.add(callback);
    return function () {
      callbacks.delete(callback);
      if (!callbacks.size) listeners.delete(key);
    };
  }

  function markSaved(file, context, record) {
    var key = keyFor(file, context);
    if (!normalizeFile(file).name || !record) return false;
    savedFiles.set(key, record);
    notify(key);
    return true;
  }

  function activate(file, context, record) {
    var value = normalizeFile(file);
    if (!value.name) return 'ignored';
    var saved = savedRecord(value, context, record);
    if (saved) {
      openDriveHandler(saved);
      return 'opened';
    }
    saveRequestHandler(value, context || {});
    return 'requested';
  }

  function setOpenDriveHandler(handler) {
    openDriveHandler = typeof handler === 'function' ? handler : function () {};
  }

  function setSaveRequestHandler(handler) {
    saveRequestHandler = typeof handler === 'function' ? handler : function () {};
  }

  global.EvaFileMessage = Object.freeze({
    action: action,
    activate: activate,
    iconBody: iconBody,
    isSaved: isSaved,
    keyFor: keyFor,
    markSaved: markSaved,
    savedRecord: savedRecord,
    setOpenDriveHandler: setOpenDriveHandler,
    setSaveRequestHandler: setSaveRequestHandler,
    subscribe: subscribe
  });
})(window);
