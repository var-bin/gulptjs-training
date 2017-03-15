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

const path = require("path");

const IS_DEVELOPMENT = !process.env.NODE_ENV || process.env.NODE_ENV == "development";

const DEST_PATH = path.join(__dirname, "dest");
const ASSETS_PATH = path.join(__dirname, "source/assets");
const SOURCE_PATH = path.join(__dirname, "source");

gulp.task("styles", () => {
  return gulp.src("source/styles/styles.scss")
    .pipe(gulpIf(IS_DEVELOPMENT, sourcemaps.init()))
    .pipe(sass()
      .on("error", notify.onError( (err) => {
        return {
          title: "Styles SCSS",
          message: err.message
        };
      })))
    .pipe(gulpIf(IS_DEVELOPMENT, sourcemaps.write()))
    .pipe(gulp.dest(DEST_PATH));
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
