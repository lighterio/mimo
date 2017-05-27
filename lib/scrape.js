var app = require('../index')
var log = app.log
var Dom = require('jsdom').JSDOM
var request = require('request')

module.exports = function (url, fn) {
  request(url, function (err, res, html) {
    if (err) {
      return log.error(err)
    }
    var window = (new Dom(html, {url: url})).window
    fn.call(window, window.document, window)
  })
}
