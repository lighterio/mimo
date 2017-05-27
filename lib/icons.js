var sharp = require('sharp')
var plans = require('plans')
var app = process.app
var self = exports

self.logoPath = app.dir + '/public/logo.svg'

self.generate = function build (fn) {
  var logo = sharp(self.logoPath)

  plans.all([
    iconFn('ios', '40', 40),
    iconFn('ios', '40@2x', 80),
    iconFn('ios', '40@3x', 120),
    iconFn('ios', '60', 60),
    iconFn('ios', '60@2x', 120),
    iconFn('ios', '60@3x', 180),
    iconFn('ios', '72', 72),
    iconFn('ios', '72@2x', 144),
    iconFn('ios', '76', 76),
    iconFn('ios', '76@2x', 152),
    iconFn('ios', 'Small', 29),
    iconFn('ios', 'Small@2x', 58),
    iconFn('ios', 'Small@3x', 87),
    iconFn('android', '', 96),
    iconFn('android', '-hdpi', 72),
    iconFn('android', '-mdpi', 48),
    iconFn('android', '-xhdpi', 96),
    iconFn('android', '-xxhdpi', 144)
  ], fn)

  function iconFn (os, name, size) {
    return function (done) {
      var path = (os === 'ios')
        ? '/ios/' + app.pkg.name + '/Images.xcassets/AppIcon.appiconset/Icon-' + name + '.png'
        : '/android/res/mipmap' + name + '/icon.png'
      logo
        .resize(size)
        .toFile(app.dir + path, done)
    }
  }
}
