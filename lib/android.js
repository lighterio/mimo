var env = process.env
var app = process.app
var log = app.log
var plans = require('plans')
var fs = require('fs')
var spawn = require('lighter-spawn')
var cwd = app.dir + '/android'

var self = exports

self.build = function build (buildDone) {
  var devices = []
  var pkg = 'unknown'
  var xml = cwd + '/AndroidManifest.xml'
  var options = {cwd: cwd, env: env}

  plans
    .all([
      function (done) {
        fs.readFile(xml, 'utf-8', function (err, content) {
          content.replace(/package="([^"]+)"/, function (match, name) {
            pkg = name
          })
          done()
        })
      },
      function (done) {
        spawn('gradle assembleDebug --daemon', options)
          .on('stdout', function (data) {
            data.replace(/Total time: (.+)\s+$/g, function (match, time) {
              log.info('Built APK: ' + time.green + '.')
            })
            done()
          })
      },
      function (done) {
        spawn('adb devices')
          .on('stdout', function (data) {
            data.replace(/\n([\S]+)\s+device\b/g, function (match, device) {
              devices.push(device)
            })
            var n = devices.length
            log.info('Found ' + n + ' Android device' + (n === 1 ? '' : 's') + '.')
            done()
          })
      }
    ])
    .then(function (done) {
      plans.list(devices).each(function (device, done) {
        env.ANDROID_SERIAL = device
        plans
          .each([
            adbFn('install -rd build/outputs/apk/android-debug.apk'),
            adbFn('shell am start -a android.intent.action.MAIN -n ' + pkg + '/.MainActivity'),
            adbFn('shell input keyevent KEYCODE_WAKEUP'),
            adbFn('shell input touchscreen swipe 0 1280 1400 1280')
          ])
          .then(function () {
            log.info('Installed Android app on ' + device.green + '.')
            done()
          })
      })
    })

    function adbFn (args) {
      return function (done) {
        spawn('adb ' + args, options)
          .on('error', log.error)
          .on('stdout', done)
      }
    }
}
