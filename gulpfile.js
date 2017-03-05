"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const debug = require("gulp-debug");

gulp.task("styles", () => {
  return gulp.src("source/styles/**/*.scss")
    .pipe(debug({
      title: "gulp.src"
    }))
    .pipe(sass()
      .on("error", sass.logError))
    .pipe(debug({
      title: "sass"
    }))
    .pipe(concat("all.css"))
    .pipe(debug({
      title: "concat"
    }))
    .pipe(gulp.dest("dest"));
});
