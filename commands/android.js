var run = require('../common/process/run')
var fs = require('fs')
var cwd = process.cwd()

module.exports = {

  run: function () {
    var dir = cwd.replace(/(\/platforms)?(\/android)?$/, '') + '/platforms/android'
    var cmds = [
      'gradle assembleDebug --daemon',
      'adb install -rd build/outputs/apk/android-debug.apk'
    ]

    fs.readFile(dir + '/AndroidManifest.xml', function (error, content) {
      if (error) {
        throw error
      }
      content = '' + content
      content.replace(/package="([^"]+)"/, function (match, pkg) {
        cmds.push('adb shell am start -a android.intent.action.MAIN -n ' + pkg + '/.MainActivity')
      })
    })

    function next () {
      var cmd = cmds.shift()
      if (cmd) {
        console.log(cmd)
        var child = run(cmd, dir)
        child.on('error', function (output) {
          console.log(output)
        })
        child.on('ok', function (data) {
          console.log(data)
          next()
        })
      }
    }

    next()
  }

}
