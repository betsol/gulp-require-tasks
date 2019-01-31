
module.exports = gulpRequireTasks;


const plugin = require('./package.json');
const PluginError = require('plugin-error');
const path = require('path');
const requireDirectory = require('require-directory');
const FwdRef = require('undertaker-forward-reference');


const DEFAULT_OPTIONS = {
  path: process.cwd() + '/gulp-tasks',
  separator: ':',
  passGulp: true,
  passCallback: true,
  gulp: null
};


function gulpRequireTasks (options) {

  options = Object.assign({}, DEFAULT_OPTIONS, options);

  const gulp = options.gulp || require('gulp');
  const gulp_version = gulp.series ? 4 : 3;

  // Allow to use forward referenced tasks into `.series` and `.parallel`.
  // See: https://github.com/gulpjs/undertaker-forward-reference#why
  if (gulp_version === 4) {
    gulp.registry(new FwdRef());
  }

  // Recursively visiting all modules in the specified directory
  // and registering Gulp tasks.
  requireDirectory(module, options.path, {
    visit: moduleVisitor
  });


  /**
   * Registers the specified module. Task name is deducted from the specified path.
   *
   * @param {object|function} module
   * @param {string} modulePath
   */
  function moduleVisitor (module, modulePath) {

    module = normalizeModule(module);

    const taskName = taskNameFromPath(modulePath);

    if (module.dep) {
      console.warn(
        'Usage of "module.dep" property is deprecated and will be removed in next major version. ' +
        'Use "deps" instead.'
      );
    }

    if (module.nativeTask && gulp_version === 4) {
      const msg = `"${taskName}" can't be processed: Usage of "module.nativeTask" property is deprecated because of synchronous tasks are no longer supported in gulp v4. Use a task with explicit callback instead.`;

      module.nativeTask = function(cb) {
        cb(new PluginError(plugin.name, msg));
        return;
      };
    }

    const taskDeps = module.deps || module.dep || [];
    const taskFn = module.nativeTask || taskFunction;

    if (gulp_version === 4) {
      if (taskDeps.length) {
        if (undefined === module.fn) {
          gulp.task(
            taskName,
            gulp.parallel(...taskDeps)
          );
        } else {
          gulp.task(
            taskName,
            gulp.series(gulp.parallel(...taskDeps), function(callback) { taskFn(callback) })
          );
        }
      } else {
        gulp.task(
          taskName,
          taskFn
        );
      }
    } else {
      gulp.task(
        taskName,
        // @todo: deprecate `module.dep` in 2.0.0
        taskDeps,
        taskFn
      );
    }


    /**
     * Wrapper around user task function.
     * It passes special arguments to the user function according
     * to the configuration.
     *
     * @param {function} callback
     *
     * @returns {*}
     */
    function taskFunction (callback) {

      if ('function' !== typeof module.fn) {
        callback();
        return;
      }

      let args = [];

      // @deprecated
      // @todo: remove this in 2.0.0
      if (options.arguments) {
        console.warn(
          'Usage of "arguments" option is deprecated and will be removed in next major version. ' +
          'Use globals or module imports instead.'
        );
        args = Array.from(options.arguments);
      }

      if (options.passGulp) {
        args.unshift(gulp);
      }

      if (options.passCallback) {
        args.push(callback);
      }

      return module.fn.apply(module, args);

    }

    /**
     * Deducts task name from the specified module path.
     *
     * @returns {string}
     */
    function taskNameFromPath (modulePath) {

      const relativePath = path.relative(options.path, modulePath);

      // Registering root index.js as a default task.
      if ('index.js' === relativePath) {
        return 'default';
      }

      const pathInfo = path.parse(relativePath);
      const taskNameParts = [];

      if (pathInfo.dir) {
        taskNameParts.push.apply(taskNameParts, pathInfo.dir.split(path.sep));
      }
      if ('index' !== pathInfo.name) {
        taskNameParts.push(pathInfo.name);
      }

      return taskNameParts.join(options.separator);

    }

  }

}

/**
 * Normalizes module definition.
 *
 * @param {function|object} module
 *
 * @returns {object}
 */
function normalizeModule (module) {
  if ('function' === typeof module) {
    return {
      fn: module,
      deps: []
    };
  } else {
    return module;
  }
}
