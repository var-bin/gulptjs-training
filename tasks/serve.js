// serve.js

"use strict";

const gulp = require("gulp");
const browserSync = require("browser-sync").create();

module.exports = (options) => {
  return function () {
    return browserSync.init({
      server: {
        baseDir: options.baseDirs
      },
      port: options.port
    });
  }
};
