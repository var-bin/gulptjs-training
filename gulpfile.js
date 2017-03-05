"use strict";

const gulp = require("gulp");

gulp.task("default", () => {
  return gulp.src("source/**/*.*")
    .on("data", (file) => {
      console.log({
        contents: file.contents,
        path: file.path,
        cwd: file.cwd,
        base: file.base,
        // path component helpers
        relative: file.relative,
        dirname: file.dirname,
        basename: file.basename,
        stem: file.stem,
        extname: file.extname
      });
    })
    .pipe(gulp.dest( (file) => {
      return file.extname == ".js" ? "js" :
             file.extname == ".css" ? "css" :
             "dest";
    }));
});
