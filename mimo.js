#!/usr/bin/env node

if (process.mainModule === module) {
  require('./common/process/cli')({
    aliases: {
      n: 'new',
      i: 'ios',
      a: 'android',
      f: 'fire',
      w: 'windows'
    }
  })
  return
}

var fs = require('fs')
var run = require('./common/process/run')
//var icons = require('./lib/icons')

var mimo = module.exports = {

  parts: ['ui', 'views'],

  code: {},

  platforms: ['android', 'ios'],

  dir: process.cwd(),

  built: 0,

  init: function (app) {
    mimo.app = app
    if (app.chug) {
      mimo.parts.forEach(function (part) {
        app.on(part, function (code) {
          mimo.code[part] = code
          if (Object.keys(mimo.code).length === mimo.parts.length) {
            if (mimo.built < Date.now() - 1e3) {
              mimo.build()
            }
          }
        })
      })
    }
    if (app.beams) {
      app.beams.on('mimo:platform', function (platform, client) {
        client.platform = platform
      })
      app.get('/m.html', function (request, response) {
        var platform = request.query.p
        response.end(mimo[platform])
      })
    }
  },

  build: function () {
    var app = mimo.app
    if (app.chug) {

      var js = '\n'
        + (app.href ? "window._href='" + app.href + "'\n" : '')
        + "window._platform = 'MIMO_PLATFORM'\n"
        + mimo.code.ui + '\n'
        + mimo.code.views + '\n'
        + "Porta.viewName='events/edit'\n"
        + "Porta.view=Porta.views[Porta.viewName]\n"
        + "Porta.state={}\n"
        + "document.write(Porta.view.call(Porta.views,Porta.state))"

      var asset = new app.chug.Asset('/m.js')
        asset.setContent(js)
        if (!app.isDev) {
          asset.replace(/(\n?)(Cute|Beams|Porta)\.([$_a-zA-Z0-9]+)(\s*=)?/g,
            function (match, br, lib, key, equals) {
              var name = lib + '_' + key
              var word = br ? 'var ' : ''
              return br + (equals ? word + name + ' =' : name)
            })
            .wrap()
            .minify()
        }

      var html = '<html lang="en"><head><meta charset="UTF-8"/>'
        + '<script>'
        + asset.getMinifiedContent().replace(/<\/script>/g, '<\\/script>')
        + '</script>'
        + '<script src="http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false"></script>'
        + '</head></html>'

      var wait = mimo.platforms.length
      mimo.platforms.forEach(function (platform) {
        var dir = platform + (platform == 'ios' ? '' : '/assets')
        var path = mimo.dir + '/platforms/' + dir + '/m.html'
        var code = html.replace('MIMO_PLATFORM', platform)

        // In development mode, send new code to connected clients.
        /*
        if (app.isDev && app.beams) {
          mimo[platform] = code
          app.beams.each(function (client) {
            if (client.platform === platform) {
              app.log('Sending to ' + platform + ' client ' + client.id + '.')
              client.emit('mimo:html', code)
            }
          })
        }
        */

        fs.writeFile(path, code, function (error) {
          if (!--wait) {
            app.log.info('[Mimo] Mobile app written to ' + 'm.html'.cyan + '.')
            mimo.deploy()
          }
        })
      })

      mimo.built = Date.now()
    }
  },

  deploy: function () {
    var app = mimo.app
    if (app.chug /*&& !mimo.deployed*/) {
      var deployments = app.mimoDeployments || []
      deployments.forEach(function (deployment) {
        run(deployment.command)
      })
    }
    mimo.deployed = Date.now()
  }

}

/**
 * Expose the path to Mimo's front-end script.
 */
mimo.cute = __dirname + '/scripts/mimo-cute.js'
