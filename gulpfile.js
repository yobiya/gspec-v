var gulp = require('gulp');
var rimraf = require('rimraf');
var typescript = require('gulp-typescript');
var webpack = require('gulp-webpack');
var replace = require('gulp-replace');

gulp.task('rebuild-browser', ['cleanup-browser', 'build-browser']);

gulp.task('cleanup-browser', function(cb) {
  rimfaf('./temp', cb);
});

gulp.task('build-browser', ['browser-typescript', 'browser-webpack']);

gulp.task('browser-typescript', function() {
  gulp
    .src('src/common/*.ts', { base: 'src/common' })
    .pipe(gulp.dest('src/browser/ts/_common'));

  gulp
    .src('src/browser/ts/**/*.ts')
    .pipe(typescript({ target: 'ES5', module: 'commonjs' }))
    .js
    .pipe(replace(/WPRequire/, 'require'))
    .pipe(gulp.dest('temp/browser'));
});

gulp.task('browser-webpack', function() {
  gulp
    .src('./temp/browser/main_page.js')
    .pipe(
      webpack({
        resolve: {
          alias: {
            jade: '/src/browser/jade'
          }
        },
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
    .pipe(gulp.dest('server/common'));
});

gulp.task('default', ['rebuild-browser', 'server-typescript']);
