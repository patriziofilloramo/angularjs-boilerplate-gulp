const { src, dest, watch, series, parallel } = require("gulp");

// external libraries
const sourcemaps = require("gulp-sourcemaps");
const gulpif = require("gulp-if");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const wrap = require("gulp-wrap");
const uglify = require("gulp-uglify");
const htmlmin = require("gulp-htmlmin");
const templateCache = require("gulp-angular-templatecache");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const babel = require("gulp-babel");
const yargs = require("yargs");
const ngAnnotate = require("gulp-ng-annotate");
const server = require("browser-sync");
const cachebust = require("gulp-cache-bust");
const del = require("del");


const argv = yargs.argv;

// folder names
const root = "src";
const app = "app";
const fonts = "fonts";
const styles = "styles";
const img = "img";
const js = 'js';

const dist = "dist";
const vendor = "vendor";
const bundle = "bundle";

const templates = "templates";

var es6 = [`${dist}/${js}/*.js`];

// create local server instance
server.create();

// file paths
const paths = {
  dist: `./${dist}/`,
  match: {
    scripts: [`${root}/${app}/**/*.js`, `!${root}/${app}/**/*.spec.js`],
    tests: `${root}/${app}/**/*.spec.js`,
    styles: `${root}/${styles}/*.scss`,
    templates: `${root}/${app}/**/*.html`,
  },
  output: {
    styles: `./${dist}/${styles}/`,
    js: `./${dist}/js/`,
  },
  modules: [
    "angular/angular.js",
    "angular-ui-router/release/angular-ui-router.js",
  ],
  static: [
    `${root}/index.html`,
    `${root}/${fonts}/**/*`,
    `${root}/${img}/**/*`,
  ],
};

function cleanTask() {
  return del([dist]);
}

function copyTask() {
  return src(paths.static, { base: root }).pipe(dest(paths.dist));
}

function styleTask() {
  return src(paths.match.styles)
    .pipe(sourcemaps.init()) // initialize sourcemaps first
    .pipe(sass()) // compile SCSS to CSS
    .pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
    .pipe(sourcemaps.write(".")) // write sourcemaps file in current directory
    .pipe(dest(paths.output.styles)); // put final CSS in dist folder
}

//  bundle custom JS into bundle.js
function jsScriptsTask() {
  return src([
    `!${root}/${app}/**/*.spec.js`,
    `${root}/${app}/**/*.module.js`,
    ...paths.match.scripts,
    `${root}/${app}/temp/${templates}.js`,
  ])
    .pipe(sourcemaps.init())
    .pipe(
      wrap(
        "(function(angular){\n'use strict';\n<%= contents %>})(window.angular);"
      )
    )
    .pipe(concat(`${bundle}.js`))
    .pipe(ngAnnotate())
    // .pipe(gulpif(argv.deploy, uglify()))
    .pipe(sourcemaps.write("./"))
    .pipe(dest(paths.output.js));
}

// concatenates JS modules and uglify them
function jsModulesTask() {
  return src(paths.modules.map((item) => "node_modules/" + item))
    .pipe(concat(`${vendor}.js`))
    .pipe(gulpif(argv.deploy, uglify())) // uglify only if --deploy flag is passed
    .pipe(dest(paths.output.js));
}

// creates `!${root}/${app}/templates.js` which contains all templates
function templateTask() {
  return src(paths.match.templates)
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(
      templateCache({
        module: `${templates}`,
        root: "./",
        standalone: true,
      })
    )
    .pipe(dest(`${root}/${app}/temp`));
}

// force the browser to redownload files instead using the cached versions.
function cacheBustTask() {
  return (
    src([`${dist}/index.html`])
      // use this if you want to explicitly tell which file to cache
      // .pipe(replace(/cb=\d+/g, "cb=" + new Date().getTime()))

      // use this to add timestamp to all file imported from the files that match ths src
      .pipe(
        cachebust({
          type: "timestamp",
        })
      )
      .pipe(dest(`./${dist}/`))
  );
}

// adding Babel. With this ES5 can be used and it will work on older browsers
function transpile() {
  return src(es6)
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(dest(`${dist}/js`));
}

// watch SCSS, HTML and JS files for changes
// if any change, re-run almost everything
function watchTask() {
  watch(
    [
      paths.match.styles,
      ...paths.match.scripts,
      `!${root}/${app}/temp/${templates}.js`, // excluding templates for avoiding watch loop
      paths.match.templates,
    ],
    { interval: 1000, usePolling: true }, // makes docker work
    series(
      parallel(styleTask, templateTask),
      parallel(jsScriptsTask, jsModulesTask),
      cacheBustTask
    )
  );
}

// start the local server
function serveTask() {
  return server.init({
    files: [`${paths.dist}/**`],
    port: 4000,
    server: {
      baseDir: paths.dist,
    },
  });
}

exports.default = series(
  cleanTask,
  parallel(copyTask, styleTask, templateTask),
  parallel(jsScriptsTask, jsModulesTask),
  parallel(cacheBustTask,transpile),
  parallel(serveTask, watchTask)
);
