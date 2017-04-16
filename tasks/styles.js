//styles.js

"use strict";

const $ = require("gulp-load-plugins")();

const gulp = require("gulp");
const multipipe = require("multipipe");

module.exports = (options) => {
  return function () {
    return multipipe(
      gulp.src(options.src),
      $.if(options.IS_DEVELOPMENT, $.sourcemaps.init()),
      $.sass(),
      $.if(options.IS_DEVELOPMENT, $.sourcemaps.write()),
      gulp.dest(options.DEST_PATH)
    ).on("error", $.notify.onError());
  }
};
