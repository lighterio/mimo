var sharp = require('sharp')
var app = process.app
var dir = app.dir
var platforms = dir + '/platforms'
var logo = dir + '/public/logo.svg'
var icons = []

function iosIcon(key, icon) {
  icons.push({
    path: platforms + '/ios/' + app.pkg.name + '/Images.xcassets/AppIcon.appiconset/Icon-' + key + '.png',
    size: icon
  })
}

function androidIcon(key, icon) {
  icons.push({
    path: platforms + '/android/res/mipmap' + key + '/icon.png',
    size: icon
  })
}

iosIcon('40', 40)
iosIcon('40@2x', 80)
iosIcon('40@3x', 120)
iosIcon('60', 60)
iosIcon('60@2x', 120)
iosIcon('60@3x', 180)
iosIcon('72', 72)
iosIcon('72@2x', 144)
iosIcon('76', 76)
iosIcon('76@2x', 152)
iosIcon('Small', 29)
iosIcon('Small@2x', 58)
iosIcon('Small@3x', 87)
androidIcon('', 96)
androidIcon('-hdpi', 72)
androidIcon('-mdpi', 48)
androidIcon('-xhdpi', 96)
androidIcon('-xxhdpi', 144)

icons.forEach(function (icon) {
  sharp(logo)
    .resize(icon.size)
    .toFile(icon.path, function (err) {
      if (err) {
        console.error(err)
      }
    })
})
