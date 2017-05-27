var app = process.app

process.on('uncaughtException', function (err) {
  app.log.warn('Uncaught Exception')
  app.log.error(err)
  process.exit()
})
