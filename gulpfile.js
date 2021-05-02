var gulp = require("gulp");
var browserSync = require("browser-sync");
var swPrecache = require("sw-precache");
const { series } = require("gulp");

function generateSW() {
  var swOptions = {
    staticFileGlobs: [
      "./index.html",
      "./images/*.{png,svg,gif,jpg}",
      "./scripts/*.js",
      "./styles/*.css",
    ],
    stripPrefix: ".",
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/publicdata-weather\.firebaseio\.com/,
        handler: "networkFirst",
        options: {
          cache: {
            name: "weatherData-v3",
          },
        },
      },
    ],
  };
  return swPrecache.write("./service-worker.js", swOptions);
}

function startServer() {
  browserSync({
    notify: false,
    logPrefix: "weatherPWA",
    server: ["."],
    open: false,
  });

  gulp.watch(
    [
      "./*.html",
      "./scripts/*.js",
      "./styles/*.css",
      "!./service-worker.js",
      "!./gulpfile.js",
    ],
    series(browserSync.reload)
  );
}

exports.serve = series(generateSW, startServer);
