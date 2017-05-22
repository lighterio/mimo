/**
 * Mimo communicates with Java/Swift via MimoApp, which loads the front-end into a webview.
 * - Cute is used for eventing.
 * - Beams is used for client-sever communication.
 *
 * @use cute/cute.js
 * @use beams/scripts/beams-cute.js
 * @//use porta/scripts/porta-cute.js
 */

// Expose Mimo at the window level so MimoApp can emit events to it.
var Mimo = window.Mimo = {}

// Track how many commands Mimo has sent to MimoApp.
// This number is used to change the location hash, signaling the webview.
Mimo.commandCount = 0

// Hold commandQueue to be transferred to MimoApp.
Mimo.commandQueue = []

/**
 * Read commandQueue into MimoApp one at a time.
 *
 * @return {String}  String of the form "command/callbackId" for MimoApp.
 */
Mimo.read = function () {
  return Mimo.commandQueue.shift() || ''
}

/**
 * Get information from MimoApp using a command name.
 *
 * @param  {String}   command  Command name that MimoApp listens for.
 * @param  {Function} fn       Callback to be excecuted when MimoApp returns data.
 */
Mimo.get = function (command, fn) {
  var platform = window._platform
  if (platform && platform !== 'web') {
    var commandCount = ++Mimo.commandCount
    var href = location.href.replace(/(#.*)?$/, '#' + commandCount)
    Mimo.commandQueue.push(command + '/' + commandCount)
    if (fn) {
      Cute.once(Mimo, command + commandCount, fn)
    }
    window.location = href
  }
}

/**
 * Listen for events that can be emitted by MimoApp.
 *
 * @param  {String}   type  Type of event to listen for.
 * @param  {Function} fn    Function to be called when the event occurs.
 */
Mimo.on = function (type, fn) {
  Cute.on(Mimo, type, fn)
}

/**
 * Emit an event on the Mimo object.
 *
 * @param  {String} type  Type of event to emit.
 * @param  {Object} data  Event data to send.
 */
Mimo.emit = function (type, data) {
  Cute.emit(type, Mimo, data)
}

// Calculate how much we should zoom in for larger screens.
var mimoArea = Cute.getViewport()
var mimoZoom = Math.round(Math.min(mimoArea[0], mimoArea[1]) / 240) / 2
window._zoom = Math.max(1, Math.min(2.5, mimoZoom))

// Before the app unloads, let the page unload.
Mimo.on('unload', function () {
  Cute.emit('beforeunload', window)
})

// When the app returns from background, mimic window focus.
Mimo.on('resume', function () {
  Cute.emit('focus', window)
})

// When the app goes to background, mimic window blur.
Mimo.on('pause', function () {
  Cute.emit('blur', window)
})

// When we connect to the server, report this app's platform to it.
Beams.on('connect', function () {
  Beams.emit('mimo:platform', window._platform)
})

// When the server has a new url, load it.
Beams.on('mimo:load', function (url) {
  Cute.emit('beforeunload', window)
  window.location = url
})

// When the server has new html, load it.
Beams.on('mimo:html', function (html) {
  Cute.emit('beforeunload', window)
  Beams.log(html.length)
  Cute.persist('x.html', html)
  Mimo.get('html')
})
