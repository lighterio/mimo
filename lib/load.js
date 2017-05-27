var http = require('http')
var ltl = require('ltl')
var app = process.app
var log = app.log
var chug = app.chug

var viewsJs
var express = require('express')

chug.setLog(log)
load()

app.views = ltl.cache

app.use(chug.middleware)

app.use(function (request, response, next) {
  response.state = new State(request, response)
  next()
})

app.get('/views.js', function (request, response) {
  response.end(viewsJs)
})

app.use(express.static('public'))

function load () {
  exports.views = chug('views')
    .compile({
      space: app.config.isProduction ? '' : '  '
    })
    .route()
    .then(function () {
      viewsJs = 'window.views=' + JSON.scriptify(app.views)
      State.prototype.head = this.getTags()
      app.io.emit('load:loaded')
    })

  chug([
    'node_modules/cute/cute.js',
    'node_modules/socket.io-client/dist/socket.io.min.js'
  ])
  .each(function (asset) {
    chug.cache.set(asset.location, asset)
    var path = asset.path.replace(/^.*\//, '/')
    asset.route(path)
  })
}

http.ServerResponse.prototype.view = function (name, data) {
  var html
  var views = app.views
  var state = this.state

  // If data is passed in, decorate the state.
  if (data) {
    for (var key in data) {
      state[key] = data[key]
    }
  }

  // Default to the 404 view (if we can't find the view).
  if (!views[name]) {
    name = 'error404'
  }
  try {
    html = views[name](state, state)
  } catch (error) {
    log.error(error)
    state.error = error
    html = views.error500(state, state)
  }
  this.setHeader('Content-Type', 'text/html')
  this.end(html)
}

// Listen for "lighter-run" changes.
process.stdin.on('data', function (chunk) {
  var change = JSON.parse(chunk.toString())
  var path = change.path
  var asset = chug.cache.get(path)
  if (asset) {
    asset.readFile()
    asset.then(load)
  } else {
    load()
  }
})

function State (request, response) {
  this.url = request.url
  this.agent = request.headers['user-agent']
}

State.prototype.bust = Date.now()
