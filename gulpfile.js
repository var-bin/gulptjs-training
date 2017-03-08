"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const debug = require("gulp-debug");
const sourcemaps = require("gulp-sourcemaps");
const gulpIf = require("gulp-if");
const del = require("del");

const path = require("path");

const IS_DEVELOPMENT = !process.env.NODE_ENV || process.env.NODE_ENV == "development";

const DEST = path.join(__dirname, "dest");

gulp.task("styles", () => {
  return gulp.src("source/styles/**/*.scss")
    .pipe(gulpIf(IS_DEVELOPMENT, sourcemaps.init()))
    .pipe(sass()
      .on("error", sass.logError))
    .pipe(gulpIf(IS_DEVELOPMENT, sourcemaps.write()))
    .pipe(gulpIf(IS_DEVELOPMENT, concat("all.css")))
    .pipe(gulp.dest(DEST));
});

gulp.task("clean", () => {
  return del(DEST);
});

gulp.task("build", gulp.series("clean", "styles"));
