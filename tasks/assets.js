// assets.js

"use strict";

const $ = require("gulp-load-plugins")();

const gulp = require("gulp");

const path = require("path");

module.exports = (options) => {
  return function () {
    return gulp.src(path.join(options.ASSETS_PATH, options.pattern), {
      base: options.base,
      since: gulp.lastRun(options.lastRunTask) // return last run Date for task
    })
    .pipe($.newer(options.DEST_PATH))
    .pipe($.debug({
      title: options.debugTitle
    }))
    .pipe(gulp.dest(options.DEST_PATH));
  }
};
