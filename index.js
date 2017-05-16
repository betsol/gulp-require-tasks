
module.exports = gulpRequireTasks;


const DEFAULT_OPTIONS = {
  path: process.cwd() + '/gulp-tasks',
  include: null,
  exclude: null,
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
  const gulp4 = !!gulp.series;

  // Recursively visiting all modules in the specified directory
  // and registering Gulp tasks.
  requireDirectory(module, options.path, {
    visit: moduleVisitor,
    include: options.include,
    exclude: options.exclude
  });

  /**
   * Registers the specified module. Task name is deducted from the specified path.
   *
   * @param {object|function} module
   * @param {string} modulePath
   */
  function moduleVisitor (module, modulePath) {
    var args = [taskNameFromPath(modulePath)];
    var module = normalizeModule(module, gulp4);
    var batchName;

    if (gulp4) {
      if (module.dep) {
        // Can get dep: [] which is equal to dep: { series: [] }
        // or dep: { parallel: [] }
        if (_.isPlainObject(module.dep)) {
          batchName = module.dep.parallel ? 'parallel' : 'series';
          args.push(gulp[batchName].apply(gulp, module.dep[batchName]));
        } else {
          args.push(gulp.series.apply(gulp, module.dep));
        }
      } else {
        args.push(module.nativeTask || taskFunction);
      }
    } else {
      args.push(module.dep, module.nativeTask || taskFunction);
    }

    gulp.task.apply(gulp, args);

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
function normalizeModule (module, gulp4) {
  if ('function' === typeof module) {
    return gulp4 ? {
      fn: module
    } : {
      fn: module,
      dep: []
    };
  } else {
    return module;
  }
}
