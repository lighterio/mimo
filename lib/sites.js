var fs = require('fs')
var http = require('http')
var ltl = require('ltl')
var plans = require('plans')
var app = process.app
var log = app.log
var chug = app.chug
var sites = app.sites

var viewsJs
var express = require('express')

chug.setLog(log)

app.use(chug.middleware)

// TODO: Move public directory to specific sites?
app.use(express.static(app.dir + '/public'))

function Site (name) {
  var self = this
  this.name = name

  // TODO: Make ltl caches instantiable.
  this.views = {
    '$': ltl.cache['$'],
    '&': ltl.cache['&']
  }
}

Site.prototype.load = function load (fn) {
  var self = this

  function State (request, response) {
    this.url = request.url
    this.agent = request.headers['user-agent']
  }

  State.prototype.bust = Date.now()
  State.prototype.views = self.views

  app.use('/' + this.name, function (request, response, next) {
    response.state = new State(request)
    next()
  })

  var code = {js: '', css: ''}

  chug(app.dir + '/routes/' + this.name).require()

  chug(app.dir + '/views/' + this.name)
    .compile({
      space: app.config.isProduction ? '' : '  '
    })
    .route()
    .each(function (asset) {
      var compiled = asset.compiledContent
      if (compiled) {
        self.views[compiled.key] = compiled
        asset.eachTarget('compiled', function (language, content) {
          if (language in code) {
            code[language] += content
          }
        })
      } else {
        code[asset.type] += asset.content
      }
    })
    .then(function () {
      if (self.name !== 'app') {
        return fn()
      }
      var load = chug()
      code.js = 'window.views=' + JSON.stringify(self.views) + '\n' + code.js
      for (var type in code) {
        var asset = new chug.Asset(self.name + '.' + type)
        asset.setContent(code[type])
        asset.wrap().minify()
        State.prototype[type] = code[type] = asset.getMinifiedContent()
      }
      var html = self.views[self.name + '/index'](code)
      plans.all([
        function (fn) {
          fs.writeFile(app.dir + '/android/assets/m.html', html, fn)
        },
        function (fn) {
          fs.writeFile(app.dir + '/ios/m.html', html, fn)
        }
      ]).then(function () {
        log.info('Saved ' + 'm.html'.cyan + ' bundle.')
        fn()
      })
    })
}

http.ServerResponse.prototype.view = function (name, data) {
  var html
  var state = this.state
  var views = state.views

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
  chunk.toString().replace(/\}\{/g, '}\n{').split('\n')
    .forEach(function (json) {
      if (!json) {
        return
      }
      var change
      try {
        change = JSON.parse(json)
        log.info(change)
      }
      catch (e) {
        change = {}
        e.message += '\nJSON: ' + json
        log.error(e)
      }
      var path = change.path
      var asset = chug.cache.get(path)
      if (asset) {
        asset.readFile()
        asset.then(exports.load)
      } else {
        exports.load()
      }
    })
})

exports.load = function (fn) {
  var loaders = []
  sites.forEach(function (name) {
    var site = sites[name] = new Site(name)
    loaders.push(site.load.bind(site))
  })
  load(fn)

  function load (fn) {
    plans.all(loaders).then(function () {
      app.io.emit('load:loaded')
      if (fn) fn()
    })
  }
}
