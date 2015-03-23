var gulp = require('gulp');
var del = require('del');
var typescript = require('gulp-typescript');
var webpack = require('gulp-webpack');

gulp.task('cleanup-browser', function() {
  del(['./temp'], function(error, deletedFiles) {
    console.error(error);
  });
});

gulp.task('build-browser', ['cleanup-browser', 'browser-webpack']);

gulp.task('copy-source-browser', ['cleanup-browser'], function() {
  gulp
    .src('src/common/*.ts', { base: 'src/common' })
    .pipe(gulp.dest('src/browser/ts/_common'));

  return gulp
          .src('src/browser/jade', { base: 'src/browser' })
          .pipe(gulp.dest('public'));
});

gulp.task('browser-typescript', ['cleanup-browser', 'copy-source-browser'], function() {
  return gulp
          .src('src/browser/ts/**/*.ts')
          .pipe(typescript({ target: 'ES5', module: 'commonjs' }))
          .js
          .pipe(gulp.dest('temp/browser'));
});

gulp.task('browser-webpack', ['browser-typescript'], function() {
  return gulp
          .src('./temp/browser/main_page.js')
          .pipe(
            webpack({
              output: {
                filename: 'packed.js',
              },
            }))
          .pipe(gulp.dest('./public/javascripts'));
});

gulp.task('server-typescript', function() {
  gulp
    .src('src/server/*.ts')
    .pipe(typescript({ target: 'ES5', module: 'commonjs' }))
    .js
    .pipe(gulp.dest('server'));

  gulp
    .src('src/common/*.ts')
    .pipe(typescript({ target: 'ES5', module: 'commonjs' }))
    .js
    .pipe(gulp.dest('server/_common'));
});

gulp.task('default', ['build-browser', 'server-typescript']);
