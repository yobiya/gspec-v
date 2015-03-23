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

gulp.task('browser-copy-source', ['cleanup-browser'], function() {
  return gulp
          .src('src/common/*.ts', { base: 'src/common' })
          .pipe(gulp.dest('src/browser/ts/_common'));
});

gulp.task('browser-typescript', ['cleanup-browser', 'browser-copy-source'], function() {
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

gulp.task('server-copy-source', function() {
  return gulp
          .src('src/common/*.ts', { base: 'src/common' })
          .pipe(gulp.dest('src/server/ts/_common'));
});

gulp.task('server-typescript', ['server-copy-source'], function() {
  return gulp
          .src('src/server/ts/**/*.ts')
          .pipe(typescript({ target: 'ES5', module: 'commonjs' }))
          .js
          .pipe(gulp.dest('server'));
});

gulp.task('default', ['build-browser', 'server-typescript']);
