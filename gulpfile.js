"use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const debug = require("gulp-debug");
const sourcemaps = require("gulp-sourcemaps");
const gulpIf = require("gulp-if");
const del = require("del");
const newer = require("gulp-newer");
const browserSync = require("browser-sync").create();
const notify = require("gulp-notify");
const plumber = require("gulp-plumber");
const multipipe = require("multipipe");
const through2 = require("through2").obj;
const File = require("vinyl");
const eslint = require("gulp-eslint");
const fs = require("fs");
const combiner = require("stream-combiner2").obj;

const path = require("path");

const IS_DEVELOPMENT = !process.env.NODE_ENV || process.env.NODE_ENV == "development";

const DEST_PATH = path.join(__dirname, "dest");
const ASSETS_PATH = path.join(__dirname, "source/assets");
const SOURCE_PATH = path.join(__dirname, "source");
const SOURCE_JS_PATH = path.join(SOURCE_PATH, "js/**/*.js");

gulp.task("styles", () => {
  return multipipe(
    gulp.src("source/styles/styles.scss"),
    gulpIf(IS_DEVELOPMENT, sourcemaps.init()),
    sass(),
    gulpIf(IS_DEVELOPMENT, sourcemaps.write()),
    gulp.dest(DEST_PATH)
  ).on("error", notify.onError());
});

gulp.task("clean", () => {
  return del(DEST_PATH);
});

gulp.task("assets", () => {
  return gulp.src(path.join(ASSETS_PATH, "**"), {
      base: "source",
      since: gulp.lastRun("assets") // return last run Date for task
    })
    .pipe(newer(DEST_PATH))
    .pipe(debug({
      title: "assets"
    }))
    .pipe(gulp.dest(DEST_PATH));
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

gulp.task("serve", () => {
  browserSync.init({
    server: {
      baseDir: ["dest/assets", "dest"]
    },
    port: 8080
  });
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

gulp.task("lint", () => {

  // store eslint results
  let eslintResults = {};

  // filename with store
  let eslintResultsPath = path.join(process.cwd(), "eslintManifest.json");

  // get boolean check
  let isExistEslintResults = fs.existsSync(eslintResultsPath);

  try {
    eslintResults = JSON.parse(fs.readFileSync(eslintResultsPath));
  } catch (e) {}

  return gulp.src(SOURCE_JS_PATH, {read: false})
    .pipe(debug({
      title: "src"
    }))
    .pipe(gulpIf(function (file) {
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
        debug({
          title: "eslint"
        }),
        eslint(),
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
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    //.pipe(eslint.failAfterError())
    .on("end", function () {
      fs.writeFileSync(eslintResultsPath, JSON.stringify(eslintResults), {"encoding": "utf-8"});
    });
});
