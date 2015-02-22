var gulp = require('gulp');
var typescript = require('gulp-typescript');

gulp.task('browser-typescript', function() {
  gulp
    .src('src/browser/ts/*.ts')
    .pipe(typescript({ target: 'ES5', module: 'commonjs' }))
    .js
    .pipe(gulp.dest('public/javascripts'));
});

gulp.task('default', ['browser-typescript']);
