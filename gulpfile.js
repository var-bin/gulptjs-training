"use strict";

const gulp = require("gulp");
const concat = require("gulp-concat");
const through2 = require("through2").obj;
const File = require("vinyl");

const fs = require("fs");
const path = require("path");

const IS_DEVELOPMENT = !process.env.NODE_ENV || process.env.NODE_ENV == "development";

const DEST_PATH = path.join(__dirname, "dest");
const ASSETS_PATH = path.join(__dirname, "source/assets");
const SOURCE_PATH = path.join(__dirname, "source");
const SOURCE_JS_PATH = path.join(SOURCE_PATH, "js/**/*.js");

const MANIFEST_NAME = "eslintManifest.json";

/**
 * @function lazyRequireTask - lazy load tasks
 *
 * @param {string} taskName - gulp task name.
 * Load task from "./task/taskName.js"
 * @param {string} path - path to current task
 * @param {object} options - a set of options that need for current task
 *
 * @return {function}
 */
function lazyRequireTask(taskName, path, options) {

  options = options || {};

  options.taskName = taskName;

  gulp.task(taskName, (callback) => {
    let task = require(path).call(this, options);

    return task(callback);
  });
}

lazyRequireTask("styles", path.normalize("./tasks/styles"), {
  src: path.normalize("source/styles/styles.scss"),
  IS_DEVELOPMENT: IS_DEVELOPMENT,
  DEST_PATH: DEST_PATH
});

lazyRequireTask("clean", path.normalize("./tasks/clean"), {
  DEST_PATH: DEST_PATH
});

lazyRequireTask("assets", path.normalize("./tasks/assets"), {
  pattern: "**",
  base: "source",
  lastRunTask: "assets",
  debugTitle: "assets",
  ASSETS_PATH: ASSETS_PATH,
  DEST_PATH: DEST_PATH
});

gulp.task("build", gulp.series(
  "clean",
  gulp.parallel("styles", "assets"))
);

gulp.task("watch", () => {
  let stylesWatcher = gulp.watch("source/styles/**/*.scss", gulp.series("styles"));
  let assetsWatcher = gulp.watch("source/assets/**/*.*", gulp.series("assets"));

  const SOURCE = "source";
  const DEST = "dest";

  assetsWatcher.on("unlink", (filepath) => {
    let filepathFromSrc = path.relative(path.resolve(SOURCE), filepath);

    // Concatenating the 'build' absolute path used by gulp.dest in the scripts task
    let destFilepath = path.resolve(DEST, filepathFromSrc);

    console.log("_unlink_ source: ", filepathFromSrc, "\n_unlink_ dest: ", destFilepath);

    del.sync(destFilepath);
  });

  assetsWatcher.on("add", (filepath) => {
    let filepathFromSrc = path.relative(path.resolve(SOURCE), filepath);

    // Concatenating the 'build' absolute path used by gulp.dest in the scripts task
    let destFilepath = path.resolve(DEST, filepathFromSrc);

    console.log("_add_ source: ", path.join(__dirname, SOURCE, filepathFromSrc), "\n_add_ dest: ", destFilepath);

    return gulp.src(path.join(__dirname, SOURCE, filepathFromSrc), {
      base: SOURCE
    })
      .pipe(gulp.dest(DEST_PATH));
  });
});

lazyRequireTask("serve", path.normalize("./tasks/serve"), {
  baseDirs: ["dest/assets", "dest"],
  port: 8080
});

gulp.task("dev", gulp.series(
  "build",
  gulp.parallel("watch", "serve"))
);

gulp.task("assets2", (cb) => {

  // store last time modification
  const mtimes = {};

  return gulp.src("source/styles/styles.scss")
    .pipe(through2(
      function (file, enc, callback) {
        mtimes[file.relative] = file.stat.mtime;
        callback(null, file);
      }
    ))
    .pipe(gulp.dest(DEST_PATH))
    .pipe(through2(
      // in this case we will not do anythink with files
      // ignore these files with call empty callback()
      function (file, enc, callback) {
        callback();
      },

      // create manifest
      function (callback) {
        let manifest = new File({
          // cwd base path contents
          contents: new Buffer(JSON.stringify(mtimes)),
          base: __dirname,
          path: path.join(__dirname, "manifest.json")
        });

        manifest.isManifest = true;
        this.push(manifest);
        callback();
      }
    ))
    .pipe(gulp.dest("."));
});

lazyRequireTask("lint", path.normalize("./tasks/lint"), {
  SOURCE_JS_PATH: SOURCE_JS_PATH,
  MANIFEST_NAME: path.join(process.cwd(), MANIFEST_NAME)
});
