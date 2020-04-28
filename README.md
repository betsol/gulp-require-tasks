# gulp-require-tasks

[![npm version](https://badge.fury.io/js/gulp-require-tasks.svg)](http://badge.fury.io/js/gulp-require-tasks)


This convenient extension for **Gulp 3** allows you to load tasks from
multiple individual files in a directory hierarchy.


# Deprecation Notice

> This extension is deprecated and archived! Use [Gulp 4][gulp-4] with [Gulp Hub][gulp-hub] instead.
>
> PRs are not being accepted. Consider creating a fork if you really want it.


## Features

- Loads individual task files recursively from the specified directory
- The name of the task is inferred from the directory structure, e.g. `styles:preprocess:clean`
- Easily integrates into the `gulpfile.js` without breaking your existing tasks
- Gulp instance and task callback are automatically passed to your task function
- Very flexible: almost all aspects of the module is configurable
- Each task is stored in it's own local node module to completely separate concerns


## Installation

### `npm i -D gulp gulp-require-tasks`


## Usage

Create a directory alongside your `gulpfile.js` to store your individual
task modules, e.g. `./gulp-tasks`. Place your tasks into this directory.
One task per JavaScript file. Use sub-directories to structure your tasks.

Load tasks from your `gulpfile.js`:

```js

// gulpfile.js:

// Require the module.
const gulpRequireTasks = require('gulp-require-tasks');

// Invoke the module with options.
gulpRequireTasks({

  // Specify path to your tasks directory.
  path: process.cwd() + '/gulp-tasks' // This is default!

  // Additionally pass any options to it from the table below.
  // ...

});

// Or, use minimal invocation possible with all options set to defaults.
gulpRequireTasks();

```


### Minimal Gulp file possible

```js
// gulpfile.js:
require('gulp-require-tasks')();
```

Or with options:

```js
// gulpfile.js:
require('gulp-require-tasks')({
  separator: '.'
});
```


## Options

| Property     | Default Value     | Description
| ------------ | ----------------- | --------------------------------------------------------
| path         | `'./gulp-tasks'`  | Path to directory from which to load your tasks modules
| separator    | `:`               | Task name separator, your tasks would be named, e.g. `foo:bar:baz` for `./tasks/foo/bar/baz.js`
| passGulp     | `true`            | Whether to pass Gulp instance as a first argument to your task function
| passCallback | `true`            | Whether to pass task callback function as a last argument to your task function
| gulp         | `require('gulp')` | You could pass your existing Gulp instance if you have one, or it will be required automatically


## Task module format

Consider you have the following task module: `gulp-tasks/styles/build.js`.


### Module as a function

You could define module as a task function. Gulp instance and
callback function would be passed to it, if not configured otherwise.

You could configure the library to pass additional arguments as well.

```javascript

// gulp-tasks/styles/build.js:

const compass = require('compass');

module.exports = function (gulp, callback) {
  return gulp.src('...')
    .pipe(compass())
    .pipe(gulp.dest('...'))
  ;
};
```


### Module as an object

Also, you could define your task module as an object.
This will allow you to provide additional configuration.

```javascript

// gulp-tasks/styles/build.js:

const compass = require('compass');

module.exports = {
  deps: ['styles:clean', 'icons:build'],
  fn: function (gulp, callback) {
    return gulp.src('...')
      .pipe(compass())
      .pipe(gulp.dest('...'))
    ;
  }
};
```

You will have to define your task function as `fn` parameter.
You could use `deps` parameter to define your task dependencies.

Also, you could use `nativeTask` instead of `fn` property to make your
task function executed by Gulp directly. That way, additional arguments
will not be passed to it. This feature is useful when using,
e.g. [gulp-sequence][gulp-sequence] plugin or for [synchronous tasks](#synchronous-tasks).


### Task function return value

To make sure, that task is finished correctly you must either:

- Return a proper Gulp stream from the task function, e.g.: `return gulp.src().pipe(gulp.dest());`
- Return a valid Promise (thenable object), e.g.: `return del();` or `return new Promise();`
- Call a callback function passed to it, e.g.: `callback();`

> WARNING: If your task function is synchronous — please read the section below!


### Using root directory tasks

Starting from version `1.1.0` you can place `index.js` inside of the task directories.
The actual task, registered with Gulp will have the name of the directory itself,
e.g.: `scripts/build/index.js` will become: `scripts:build`.

The `index.js`, placed in the root of tasks directory, will be registered as a `default` task.


### Passing data to the task function

If you need to pass something to the task function from your gulpfile you can use globals.

Define your custom properties on the `global` object:

```js
// gulpfile.js

global.SOURCES_BASE_PATH = __dirname + '/src';
```

And then use it in your task module:

```js
// gulp/tasks/styles/build.js
module.exports = gulp =>
  gulp.src(global.SOURCES_BASE_PATH + '/styles/*.scss')
    .pipe(compass())
    .pipe(gulp.dest('…'))
;
```


### Synchronous tasks

If you are using synchronous tasks, i.e. tasks which execute synchronously
without returning streams, promises or accepting callbacks, you will have
to use one of the workarounds specified below:

1). The simplest method is to use `nativeTask` functionality, here's the
example of the module with native task synchronous function:

```js
module.exports = {
  nativeTask: function () {
    console.log('This is the synchronous native task without a callback!');
  }
};
```

2). You should call a callback explicitly:

```js
module.exports = function (gulp, callback) {
  console.log('This is the synchronous native task with explicit callback!');
  callback(); // Don't forget this, otherwise task will never finish!
};
```

However, if `config.passCallback == false` you won't be able to use the second method.

These workarounds must be used due to architectural limitation of this module integration with orchestrator.
Please see the issue
[#9: Synchronous tasks without callback don't finish](https://github.com/betsol/gulp-require-tasks/issues/9)
for more technical details.


## Changelog

Please see the [changelog][changelog] for list of changes.


## Feedback

If you have found a bug or have another issue with the library —
please [create an issue][new-issue].

If you have a question regarding the library or it's integration with your project —
consider asking a question at [StackOverflow][so-ask] and sending me a
link via [E-Mail][email]. I will be glad to help.

Have any ideas or propositions? Feel free to contact me by [E-Mail][email].

Cheers!


## Support

If you like this library consider to add star on [GitHub repository][repo-gh].

Thank you!


## License

The MIT License (MIT)

Copyright (c) 2016-2020 Slava Fomin II

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

  [changelog]:     CHANGELOG.md
  [so-ask]:        http://stackoverflow.com/questions/ask?tags=node.js,javascript
  [email]:         mailto:s.fomin@betsol.ru
  [new-issue]:     https://github.com/betsol/gulp-require-tasks/issues/new
  [gulp]:          http://gulpjs.com/
  [repo-gh]:       https://github.com/betsol/gulp-require-tasks
  [gulp-sequence]: https://github.com/teambition/gulp-sequence
  [gulp-4]:        https://gulpjs.com/
  [gulp-hub]:      https://github.com/frankwallis/gulp-hub/tree/registry-init
