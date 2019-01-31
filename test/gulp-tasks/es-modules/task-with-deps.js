const deps = ['es-modules:task-without-deps'];

function fn(gulp, callback) {
  console.log('Run ES modules task with dependencies...');
  callback();
}

export { deps, fn }
