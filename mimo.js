var fs = require('fs');
var run = require('./common/process/run');
var icons = require('./lib/icons');

var mimo = module.exports = {

  parts: ['ui', 'views', 'mobilejs', 'mobilecss', 'mobileltl'],

  code: {},

  loads: {},

  platforms: ['android', 'ios'],

  dir: process.cwd(),

  built: 0,

  init: function (app) {
    mimo.app = app;

    var wait = mimo.parts.length;

    mimo.parts.forEach(function (part) {
      app.on(part, function (code) {
        mimo.code[part] = code;
        if (Object.keys(mimo.code).length == mimo.parts.length) {
          if (mimo.built < Date.now() - 1e3) {
            mimo.build();
          }
        }
      })
    });

    var extensions = ['js', 'css', 'ltl'];
    extensions.forEach(function (extension) {
      var load = app.chug(mimo.dir + '/app/*.' + extension);
      if (app.isDev) {
        load.watch();
      }
      load.then(function () {
        var assetLoad = load;
        if (extension == 'ltl') {
          assetLoad.compile({space: app.isDev ? '  ' : ''});
        }
        else {
          assetLoad = assetLoad.concat();
          if (!app.isDev) {
            assetLoad.wrap().minify();
          }
        }
        var asset = assetLoad.assets[0];
        var content = asset ? asset.getMinifiedContent() : '';
        app.emit('mobile' + extension, content);
      });
    });

    mimo.platforms.forEach(function (platform) {
      var dir = mimo.dir + '/mobile/platforms/' + platform;
      var www = dir + (platform == 'android' ? '/assets' : '') + '/www';
      app.chug(www + '/cordova.js')
        .wrap()
        .minify()
        .write(www, 'c.js');
    });

  },

  build: function () {
    var app = mimo.app;
    mimo.built = Date.now();

    function minify(code, extension) {
      var asset = new app.chug.Asset('/m.' + extension);
      asset.setContent(code);
      if (!app.isDev) {
        asset.wrap().minify();
      }
      return asset.getMinifiedContent();
    }

    var js = 'window._isMobileApp=1;';
    if (app.href) {
      js = "window._href='" + app.href + "';" + js;
    }
    if (app.delay) {
      js = "window._delay='" + app.delay + "';" + js;
    }
    if (app.localTtl) {
      js = "window._localTtl='" + app.localTtl + "';" + js;
    }
    js += mimo.code.ui;
    js += mimo.code.views;
    js += mimo.code.mobilejs.replace(/Jymin\./g, '');
    js = minify(js, 'js');

    var css = mimo.code.mobilecss;
    var ltl = mimo.code.mobileltl;
    var html = ltl({css: minify(css, 'css')});

    fs.writeFile(mimo.dir + '/mobile/www/index.html', html, function () {
      fs.writeFile(mimo.dir + '/mobile/www/m.js', js, function () {
        app.log.info('[Mimo] Mobile JS written to ' + 'm.js'.cyan + '.');
        mimo.deploy();
      });
    });
  },

  deploy: function () {
    var deployments = mimo.app.mimoDeployments || [];
    deployments.forEach(function (deployment) {
      run(deployment.command, mimo.dir + '/mobile');
    });
  }

};
