module.exports = function(config) {
  config.set({

    basePath : '..',

    files : [
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-aria/angular-aria.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-messages/angular-messages.js',
      'bower_components/angular-material/angular-material.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-route/angular-route.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-translate/angular-translate.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
      'bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.js',
      'bower_components/angular-translate-storage-local/angular-translate-storage-local.js',
      'bower_components/angular-translate-handler-log/angular-translate-handler-log.js',
      'bower_components/angular-dynamic-locale/dist/tmhDynamicLocale.js',
      'bower_components/angular-material-data-table/dist/md-data-table.js',
      'bower_components/momentjs/moment.js',
      'bower_components/humanize-duration/humanize-duration.js',
      'bower_components/angular-timer/dist/angular-timer.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'app/scripts/app.js',
      'app/scripts/**/*.js',
      'test/spec/**/*.js'
    ],

    // list of files to exclude
    exclude: [ 'test/karma.conf.js' ],

    // Level of logging. Possible values:
    // config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch : false,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    frameworks: ['jasmine'],

    browsers : [
      'PhantomJS',
      'Chrome',
      'Firefox'
    ],

    reporters:['progress']
  });
};
