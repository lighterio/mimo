var svgToPng = require('svg-to-png')
var cwd = process.cwd()
var svg = cwd + '/public/icon.svg'
var ios = cwd + '/public/ios.svg'
var png = cwd + '/public'
var options = {
  compress: true
}
var sizes = {
  'android/res/drawable': 96,
  'android/res/drawable-hdpi': 72,
  'android/res/drawable-ldpi': 36,
  'android/res/drawable-mdpi': 48,
  'android/res/drawable-xhdpi': 96,
  'ios': 1024
}

for (var path in sizes) {
  options.defaultWidth = sizes[path]
  options.defaultHeight = sizes[path]
  path = cwd + '/mobile/platforms/' + path
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
