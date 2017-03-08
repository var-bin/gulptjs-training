"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const debug = require("gulp-debug");
const sourcemaps = require("gulp-sourcemaps");
const gulpIf = require("gulp-if");

const IS_DEVELOPMENT = !process.env.NODE_ENV || process.env.NODE_ENV == "development";

gulp.task("styles", () => {
  return gulp.src("source/styles/**/*.scss")
    .pipe(debug({
      title: "gulp.src"
    }))
    .pipe(sourcemaps.init())
    .pipe(debug({
      title: "sourcemaps init"
    }))
    .pipe(sass()
      .on("error", sass.logError))
    .pipe(debug({
      title: "sass"
    }))
    .pipe(sourcemaps.write())
    .pipe(debug({
      title: "sourcemaps write"
    }))
    .pipe(concat("all.css"))
    .pipe(debug({
      title: "concat"
    }))
    .pipe(gulp.dest("dest"));
});
