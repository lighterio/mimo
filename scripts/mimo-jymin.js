/**
 * This file is used in conjunction with Jymin to form the Mimo front-end.
 *
 * @use jymin/jymin.js
 * @use porta/scripts/porta-jymin.js
 */

var Mimo = window.Mimo = {}

Mimo.n = 0

Mimo.data = []

Mimo.read = function () {
  return Mimo.data.shift() || ''
}

Mimo.get = function (key, fn) {
  var platform = window._platform
  if (platform && platform !== 'web') {
    var n = ++Mimo.n
    var href = location.href.replace(/(#.*)?$/, '#' + n)
    Mimo.data.push(key + '/' + n)
    if (fn) {
      Jymin.once(Mimo, key + n, function (element, event) {
        fn(event.data)
      })
    }
    window.location = href
  }
}

Mimo.on = function (type, fn) {
  Jymin.on(Mimo, type, function (element, event, type) {
    fn(event.data, event, type)
  })
}

Mimo.emit = function (type, data) {
  Jymin.trigger(Mimo, {type: type, data: data})
}

var mimoArea = Jymin.getViewport()
var mimoScale = Math.round(Math.min(mimoArea[0], mimoArea[1]) / 240) / 2
window._scale = Math.max(1, Math.min(2.5, mimoScale))
