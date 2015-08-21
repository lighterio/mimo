var run = require('../common/process/run')
var fs = require('fs')
var cwd = process.cwd()
var env = process.env

module.exports = {

  run: function () {
    var dir = cwd.replace(/(\/platforms)?(\/android)?$/, '') + '/platforms/android'
    var cmds = [
      'gradle assembleDebug --daemon',
      'adb devices'
    ]
    var devices = []
    var pkg = 'PACKAGE_NOT_YET_FOUND'

    fs.readFile(dir + '/AndroidManifest.xml', function (error, content) {
      if (error) {
        throw error
      }
      content = '' + content
      content.replace(/package="([^"]+)"/, function (match, name) {
        pkg = name
      })
    })

    function next () {
      var cmd = cmds.shift()
      if (cmd) {
        console.log(cmd)
        env.ANDROID_SERIAL = devices.shift()
        var child = run(cmd, dir)
        child.on('error', function (output) {
          console.log(output)
        })
        child.on('ok', function (data) {
          console.log(data)
          if (cmd == 'adb devices') {
            data.replace(/\n([\S]+)\s+device\b/g, function (match, device) {
              devices.push(device)
              cmds.push('adb install -rd build/outputs/apk/android-debug.apk')
              devices.push(device)
              cmds.push('adb shell am start -a android.intent.action.MAIN -n ' + pkg + '/.MainActivity')
            })
          }
          next()
        })
      }
    }

    next()
  }

}
