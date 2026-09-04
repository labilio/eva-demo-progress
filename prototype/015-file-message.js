
(function (global) {
  'use strict';

  var savedFiles = new Set();
  var listeners = new Map();
  var openDriveHandler = function () {};
  var ICONS = Object.freeze({
    saveDrive: '<path d="M12 2v8"></path><path d="m16 6-4 4-4-4"></path><rect width="20" height="8" x="2" y="14" rx="2"></rect><path d="M6 18h.01"></path><path d="M10 18h.01"></path>',
    viewDrive: '<path d="M10 16h.01"></path><path d="M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><path d="M21.946 12.013H2.054"></path><path d="M6 16h.01"></path>'
  });

  function normalizeFileName(fileName) {
    return String(fileName || '').trim();
  }

  function isSaved(fileName) {
    return savedFiles.has(normalizeFileName(fileName));
  }

  function action(fileName) {
    var saved = isSaved(fileName);
    return {
      key: saved ? 'viewDrive' : 'saveDrive',
      title: saved ? '前往云盘查看' : '存到云盘',
      saved: saved
    };
  }

  function iconBody(actionKey) {
    return ICONS[actionKey] || '';
  }

  function notify(fileName) {
    var callbacks = listeners.get(fileName);
    if (!callbacks) return;
    callbacks.forEach(function (callback) {
      callback(true);
    });
  }

  function subscribe(fileName, callback) {
    var normalized = normalizeFileName(fileName);
    if (!normalized || typeof callback !== 'function') return function () {};
    var callbacks = listeners.get(normalized);
    if (!callbacks) {
      callbacks = new Set();
      listeners.set(normalized, callbacks);
    }
    callbacks.add(callback);
    return function () {
      callbacks.delete(callback);
      if (!callbacks.size) listeners.delete(normalized);
    };
  }

  function activate(fileName) {
    var normalized = normalizeFileName(fileName);
    if (!normalized) return 'ignored';
    if (savedFiles.has(normalized)) {
      openDriveHandler(normalized);
      return 'opened';
    }
    savedFiles.add(normalized);
    notify(normalized);
    return 'saved';
  }

  function setOpenDriveHandler(handler) {
    openDriveHandler = typeof handler === 'function' ? handler : function () {};
  }

  global.EvaFileMessage = Object.freeze({
    action: action,
    activate: activate,
    iconBody: iconBody,
    isSaved: isSaved,
    setOpenDriveHandler: setOpenDriveHandler,
    subscribe: subscribe
  });
})(window);

