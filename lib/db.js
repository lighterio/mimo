var Sequelize = require('sequelize')
var mysql = require('mysql')
var app = process.app

var db = new Sequelize(app.config.db, {
  logging: false
})

db.authenticate().catch(function (err) {
  app.log.error('Unable to connect to the database:', err)
})

module.exports = db

for (var key in Sequelize) {
  if (key === key.toUpperCase() && !db[key]) {
    db[key] = Sequelize[key]
  }
}

// Allow model files to load before syncing.
process.nextTick(function () {
  db.sync()
})

var connection = mysql.createConnection(app.config.db)
connection.connect()

/**
 * Decorate the sequelize-instantiated database with a cheating helper function.
 *
 * @param  {String}   sql  A SQL statement string.
 * @param  {Function} fn   An errback.
 */
db.sql = function (sql, fn) {
  connection.query(sql, function (err, result) {
    if (err) {
      app.log.warn(sql)
      app.log.error(err)
      return
    }
    fn(err, result)
  })
}
