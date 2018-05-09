const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const combiner = require('stream-combiner2').obj;
const del = require('del');
const gulpIf = require('gulp-if');
const rename = require('gulp-rename');
const notify = require('gulp-notify');
const prefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const cache = require('gulp-cache');
const concat = require('gulp-concat');

// NODE_ENV=prod gulp --task
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'dev';

/**
 * Delete public directory.
 */
gulp.task('clean', () => del('public'));

/**
 * Copy html from an assets directory to the public directory.
 */
gulp.task('assets', () =>
  gulp
    .src('src/assets/*.html', { since: gulp.lastRun('assets') })
    .pipe(gulp.dest('public')));

/**
 * Сompress the image.
 */
gulp.task('img', () => gulp.src('src/assets/img/**/*.*')
  .pipe(cache(imagemin({
    interlaced: true,
    progressive: true,
    svgoPlugins: [{ removeViewBox: false }],
    use: [pngquant()],
  })))
  .pipe(gulp.dest('public/img')));

/**
 * Convert main.scss from src/styles to main.css public directory.
 * If NODE_END != dev, create minified main.min.css without sourcemap.
 */
gulp.task('styles', () =>
  combiner(
    gulp.src('src/styles/style.scss'),
    gulpIf(isDev, sourcemaps.init()),
    sass(),
    prefixer('last 15 version', '> 1%'),
    gulpIf(
      !isDev,
      combiner(cleanCSS({ compatibility: '*' }), rename({ suffix: '.min' })),
    ),
    gulpIf(isDev, sourcemaps.write()),
    gulp.dest('public'),
  ).on(
    'error',
    notify.onError(error => ({
      title: 'Styles',
      message: error.message,
    })),
  ));

/**
 * Concat javascrips.
 */
gulp.task('scripts', () => gulp.src('src/js/*.js')
  .pipe(gulpIf(isDev, sourcemaps.init()))
  .pipe(babel({
    presets: ['env'],
  }))
  .pipe(concat('script.js'))
  .pipe(gulpIf(!isDev, combiner(uglify(), rename({ suffix: '.min' }))))
  .pipe(gulpIf(isDev, sourcemaps.write()))
  .pipe(gulp.dest('public')));

/**
 * Build the project.
 */
gulp.task('build', gulp.series('clean', gulp.parallel('styles', 'scripts', 'img', 'assets')));

/**
 * Watch for changes in files.
 */
gulp.task('watch', () => {
  gulp.watch('src/styles/*.*', gulp.series('styles'));
  gulp.watch('src/js/*.js', gulp.series('scripts'));
  gulp.watch('src/assets/**/*.*', gulp.series('assets'));
});

/**
 * Start browser-sync and watch the public directory.
 */
gulp.task('serve', () => {
  browserSync.init({
    server: 'public',
  });
  browserSync.watch('public/**/*.*').on('change', browserSync.reload);
});

/**
 * Default task for development.
 */
gulp.task('default', gulp.series('build', gulp.parallel('watch', 'serve')));
