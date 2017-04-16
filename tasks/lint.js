// lint.js

"use strict";

const $ = require("gulp-load-plugins")();

const gulp = require("gulp");
const through2 = require("through2").obj;
const combiner = require("stream-combiner2").obj;

const fs = require("fs");
const path = require("path");

module.exports = (options) => {
  return function () {
    // store eslint results
    let eslintResults = {};

    // filename with store
    let eslintResultsPath = options.MANIFEST_NAME;

    // get boolean check
    let isExistEslintResults = fs.existsSync(eslintResultsPath);

    try {
      eslintResults = JSON.parse(fs.readFileSync(eslintResultsPath));
    } catch (e) {}

    return gulp.src(options.SOURCE_JS_PATH, {read: false})
      .pipe($.debug({
        title: "src"
      }))
      .pipe($.if(function (file) {
          // do checks
          // eslintResultsPath is already exist
          // eslintResults[file.relative] is already in eslintResultsPath
          // eslintResults[file.relative].mtime == file.stat.mtime.toJSON()

          return eslintResults[file.relative] &&
                 eslintResults[file.relative].mtime == file.stat.mtime.toJSON();
        },

        // add eslint key to file from cache
        through2(function (file, enc, callback) {
          file.eslint = eslintResults[file.relative].eslint;

          callback(null, file);
        }),
        // we need to combine some pipes into one
        // we will use stream-combiner2
        // 1. read file
        // 2. eslint()
        // 3. write results to eslintResults
        combiner(
          // 1
          through2(function (file, enc, callback) {
            // set the contents of the file
            file.contents = fs.readFileSync(path.normalize(file.path));

            callback(null, file);
          }),
          // 2
          $.debug({
            title: "eslint"
          }),
          $.eslint(),
          // 3
          through2(function (file, enc, callback) {
            eslintResults[file.relative] = {
              "mtime": file.stat.mtime,
              "eslint": file.eslint
            };

            callback(null, file);
          })
        )
      ))
      // eslint.format() outputs the lint results to the console.
      .pipe($.eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      //.pipe(eslint.failAfterError())
      .on("end", function () {
        fs.writeFileSync(eslintResultsPath, JSON.stringify(eslintResults), {"encoding": "utf-8"});
      });
  }
}
