var plans = require('plans')
var read = require('fs').readFileSync
var main = process.mainModule.filename

require('lighter-json')

module.exports = function (options) {
  var app = process.app = require('express')()
  var dir = app.dir = main.replace(/\/[^/]*$/, '')
  var pkg = app.pkg = require(dir + '/package.json')
  var config = app.config = require('lighter-config')
  var log = app.log = require('cedar')(config.log)

  app.title = pkg.title || pkg.name
  app.sites = ['admin', 'app']
  app.chug = require('chug')
  app.db = require('./lib/db')
  app.io = new (require('socket.io'))()

  app.ip = require('ip').address()
  app.port = config.port || 8443
  app.server = require('https').createServer({
    key: read(dir + '/config/ssl.key'),
    cert: read(dir + '/config/ssl.crt')
  }, app)

  app.server.listen(app.port, function () {
    log.info('Listening at ' + ('https://' + app.ip + ':' + app.port + '/').cyan)
  })

  app.io.attach(app.server)

  require('./lib/errors')
  require('./lib/sites')

  plans.all([
    require('./lib/sites').load,
    require('./lib/icons').generate
  ]).then(function () {
    plans.all([
      require('./lib/android').build,
      // require('./lib/ios').build
    ])
  })

  return app
}
