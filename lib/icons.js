var svgToPng = require('svg-to-png')
var cwd = process.cwd()
var svg = cwd + '/public/icon.svg'
var ios = cwd + '/public/ios.svg'
var png = cwd + '/public'
var options = {
  compress: true
}
var sizes = {
  'android/res/mipmap': 96,
  'android/res/mipmap-hdpi': 72,
  'android/res/mipmap-mdpi': 48,
  'android/res/mipmap-xhdpi': 96,
  'android/res/mipmap-xxhdpi': 144,
  'ios': 1024
}

for (var path in sizes) {
  options.defaultWidth = sizes[path]
  options.defaultHeight = sizes[path]
  path = cwd + '/platforms/' + path
  svgToPng.convert(/ios/.test(path) ? ios : svg, path, options)
}

/*
icon-40.png
icon-40@2x.png
icon-50.png
icon-50@2x.png
icon-60.png
icon-60@2x.png
icon-60@3x.png
icon-72.png
icon-72@2x.png
icon-76.png
icon-76@2x.png
icon-small.png
icon-small@2x.png
icon.png
icon@2x.png
*/
