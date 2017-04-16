// clean.js

"use strict";

const gulp = require("gulp");
const del = require("del");

module.exports = (options) => {
  return function () {
    return del(options.DEST_PATH);
  }
};
