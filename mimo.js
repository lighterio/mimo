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
var icons = require('./lib/icons')

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
  },

  build: function () {
    var app = mimo.app
    if (app.chug) {

      var js = (app.href ? "window._href='" + app.href + "';" : '')
        + "window._platform = 'MIMO_PLATFORM';"
        + mimo.code.ui + ';'
        + mimo.code.views + ';'
        + "Porta.viewName='index';"
        + "Porta.view=Porta.views[Porta.viewName];"
        + "Porta.state={};"
        + "document.write(Porta.view.call(Porta.views,Porta.state))"

      var asset = new app.chug.Asset('/m.js')
        asset.setContent(js)
        if (!app.isDev) {
          asset.replace(/(\n?)(Jymin|Beams|Porta)\.([$_a-zA-Z0-9]+)(\s*=)?/g,
            function (match, br, lib, key, equals) {
              var name = lib + '_' + key
              var word = br ? 'var ' : ''
              return br + (equals ? word + name + ' =' : name)
            })
            .wrap()
            .minify()
        }

      var html = '<html lang="en"><head><meta charset="UTF-8"/><script>'
        + asset.getMinifiedContent().replace(/<\/script>/g, '<\\/script>')
        + '</script></head></html>'

      var wait = mimo.platforms.length
      mimo.platforms.forEach(function (platform) {
        var dir = platform + (platform == 'ios' ? '' : '/assets')
        var path = mimo.dir + '/platforms/' + dir + '/m.html'
        var code = html.replace('MIMO_PLATFORM', platform)
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
    if (app.chug) {
      var deployments = app.mimoDeployments || []
      deployments.forEach(function (deployment) {
        run(deployment.command)
      })
    }
  }

}

/**
 * Expose the path to Mimo's front-end script.
 */
mimo.jymin = __dirname + '/scripts/mimo-jymin.js'
