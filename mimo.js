var read = require('fs').readFileSync
var main = process.mainModule.filename

require('lighter-json')

module.exports = function (options) {
  var app = process.app = require('express')()
  app.config = require('lighter-config')
  app.log = require('cedar')(app.config.log)
  app.chug = require('chug')

  app.dir = main.replace(/\/[^/]*$/, '')
  app.pkg = require(app.dir + '/package.json')
  app.name = options.name || app.pkg.name

  app.db = require('./lib/db')
  app.io = new (require('socket.io'))()

  app.ip = require('ip').address()
  app.port = app.config.port || 8443
  app.server = require('https').createServer({
    key: read(app.dir + '/config/ssl.key'),
    cert: read(app.dir + '/config/ssl.crt')
  }, app)

  app.server.listen(app.port, function () {
    app.log('Listening at ' + ('https://' + app.ip + ':' + app.port + '/').cyan)
  })

  app.io.attach(app.server)

  app.android = require('./lib/android').build()
  // app.ios = require('./lib/ios').build()
  require('./lib/icons')
  require('./lib/errors')
  require('./lib/load')

  app.chug(['controllers']).require()

  return app
}
