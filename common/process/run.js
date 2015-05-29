/**
 * Execute a command by spawning a child process, and emit an "ok" event with
 * output data, or an "error" event with an Error, decorated with a `details`
 * property.
 *
 * @origin https://github.com/lighterio/lighter-common/common/process/run.js
 * @version 0.0.1
 */

var spawn = require('child_process').spawn;

module.exports = function (command, cwd, env) {
  var args = command.split(' ');
  for (var i = 0, n = args.length - 1; i < n; i++) {
    if (args[i].substr(-1) == '\\') {
      args.splice(i, 2, args[i] + args[i + 1]);
    }
  }

  cwd = cwd || process.cwd();
  env = env || process.env;

  var execPath = args.shift();
  var child = spawn(execPath, args, {cwd: cwd, env: env});
  var data = '';

  child.stdout.on('data', function (chunk) {
    data += chunk;
  });

  child.on('close', function (code) {
    if (code > 0) {
      var error = new Error('Command `' + command + '` returned exit code ' + code + '.');
      error.details = {
        execPath: execPath,
        args: args,
        cwd: cwd,
        env: env,
        code: code,
        data: data
      };
      child.emit('error', error);
    }
    else {
      child.emit('ok', data);
    }
  });

  return child;

};
