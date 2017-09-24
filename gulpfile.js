'use strict';

var gulp = require('gulp'), 
  	concat = require('gulp-concat'),  
    sourcemaps = require('gulp-sourcemaps'),
    concatCss = require('gulp-concat-css'),
    csso = require('gulp-csso'),
    uglify = require('gulp-uglify');

// ------------------------------------------------------------------//
//                               BUILDS CONFIG
// ------------------------------------------------------------------//   

gulp.task('ProductionBuild', [  
  'JSconcatANDminifyProjectScripts',  
  'JSconcatANDminifyLibaries',
  'CSSconcatANDminify'
]);

gulp.task('DevelopBuild', [  
  'JSconcatProjectScripts',  
  'JSconcatLibaries',
  'CSSconcat'
]);

var scriptsPath = './scripts/',
    stylesPath = './styles/';
    
// ------------- JS project tasks  -------------------//  

//  order is important // JH
var projectScriptsPathsArray = [   
        scriptsPath + '/dev/base_settings/ModuleManager.js',
        scriptsPath + '/dev/base_settings/BasicModulesRegister.js',
        scriptsPath + '/dev/services/DOMService.js',
        scriptsPath + '/dev/services/WikiReqeuestsService.js',
        scriptsPath + '/dev/directives/autocompleteDirective.js',
        scriptsPath + '/dev/directives/articleDirective.js',
        scriptsPath + '/dev/controllers/SearchingViewController.js'
    ];

gulp.task('JSconcatProjectScripts', function() { 
  gulp.src(projectScriptsPathsArray)
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(scriptsPath));
}); 

gulp.task('JSconcatANDminifyProjectScripts', function() { 
  gulp.src(projectScriptsPathsArray) 
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(gulp.dest(scriptsPath));
}); 

gulp.task('JSwatchProjectFiles', function() {
  gulp.watch(
    [
      scriptsPath + 'dev/**/*.js',  
    ], 
    ['JSconcatProjectScripts']);
}); 


// ------------- JS libaries tasks  -------------------//   

var libariesScriptsPathsArray = [   
        scriptsPath + '/libs/*.js',  
    ];

gulp.task('JSconcatLibaries', function() { 
  gulp.src(libariesScriptsPathsArray)
    .pipe(sourcemaps.init())
    .pipe(concat('libs.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(scriptsPath));
}); 

gulp.task('JSconcatANDminifyLibaries', function() { 
  gulp.src(libariesScriptsPathsArray) 
    .pipe(concat('libs.js'))
    .pipe(uglify())
    .pipe(gulp.dest(scriptsPath));
}); 

// ------------- CSS tasks  -------------------//  

//  order is important // JH
var stylesPathArray = [
        stylesPath + 'layout/reset.css',
        stylesPath + 'layout/body.css',
        stylesPath + 'layout/main.css',
        stylesPath + 'layout/nav.css',
        stylesPath + 'components/*.css',
        stylesPath + 'views/*.css'
    ];

gulp.task('CSSconcat', function () {
  gulp.src(stylesPathArray)
    .pipe(concatCss("main.css")) 
    .pipe(gulp.dest(stylesPath));
});

gulp.task('CSSconcatANDminify', ['CSSconcat'], function () {
    gulp.src(stylesPathArray)
    .pipe(concatCss("main.css")) 
    .pipe(csso())
    .pipe(gulp.dest(stylesPath));
});

gulp.task('CSSwatchFiles', function() {
    gulp.watch(
        [
            stylesPath + '**/*.css'
        ],
        ['CSSconcat']);
});
 