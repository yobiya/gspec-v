var gulp = require('gulp');
var typescript = require('gulp-typescript');

gulp.task('browser-typescript', function() {
  gulp
    .src('src/common/*.ts', { base: 'src/common' })
    .pipe(gulp.dest('src/browser/ts/_common'));

  gulp
    .src('src/browser/ts/**/*.ts')
    .pipe(typescript({ target: 'ES5', module: 'AMD' }))
    .js
    .pipe(gulp.dest('public/javascripts'));
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

gulp.task('default', ['browser-typescript', 'server-typescript']);
