var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  del = require('del')
;

gulp.task('build', function() {
  del('./paperfold.min.js', function() {
    gulp.src('./paperfold.js')
      .pipe(uglify())
      .pipe(rename('paperfold.min.js'))
      .pipe(gulp.dest('./'));
  });
});
