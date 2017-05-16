
module.exports = gulpRequireTasks;


const DEFAULT_OPTIONS = {
  path: process.cwd() + '/gulp-tasks',
  separator: ':',
  arguments: [],
  passGulp: true,
  passCallback: true,
  gulp: null
};

const path = require('path');
const requireDirectory = require('require-directory');


function gulpRequireTasks (options) {

  options = Object.assign({}, DEFAULT_OPTIONS, options);

  const gulp = options.gulp || require('gulp');

  // Recursively visiting all modules in the specified directory
  // and registering Gulp tasks.
  blacklist = new RegExp(options.path + '/node_modules');
  requireDirectory(module, options.path, {
        visit: moduleVisitor,
        exclude: blacklist
  });

  /**
   * Registers the specified module. Task name is deducted from the specified path.
   *
   * @param {object|function} module
   * @param {string} modulePath
   */
  function moduleVisitor (module, modulePath) {

    module = normalizeModule(module);

    gulp.task(
      taskNameFromPath(modulePath),
      module.dep,
      module.nativeTask || taskFunction
    );

    /**
     * Wrapper around user task function.
     * It passes special arguments to the user function according
     * to the this module configuration.
     *
     * @param {function} callback
     *
     * @returns {*}
     */
    function taskFunction (callback) {
      if ('function' === typeof module.fn) {
        var arguments = Array.from(options.arguments);
        if (options.passGulp) {
          arguments.unshift(gulp);
        }
        if (options.passCallback) {
          arguments.push(callback);
        }
        return module.fn.apply(module, arguments);
      } else {
        callback();
      }
    }

    /**
     * Deducts task name from the specified module path.
     *
     * @returns {string}
     */
    function taskNameFromPath (modulePath) {
      const relativePath = path.relative(options.path, modulePath);
      const pathInfo = path.parse(relativePath);
      const taskNameParts = [];

      if (pathInfo.dir) {
        taskNameParts.push(...pathInfo.dir.split(path.sep));
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
      dep: []
    };
  } else {
    return module;
  }
}
