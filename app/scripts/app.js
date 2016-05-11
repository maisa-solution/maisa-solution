'use strict';

/**
 * @ngdoc overview
 * @name callcenterApp
 * @description
 * Main module of the application.
 */
angular.module('callcenterApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'pascalprecht.translate',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngMaterial',
    'ngMessages',
    'timer',
    'md.data.table',
    'angularMoment'
  ]
).config(function ($mdThemingProvider, $translateProvider, $routeProvider) {
  var greenPalette = $mdThemingProvider.extendPalette('light-green', {
    'contrastDefaultColor': 'light'
  });
  $mdThemingProvider.definePalette('greenPalette', greenPalette);

  $mdThemingProvider.theme('default').accentPalette('greenPalette', {
    'default': '500'
  }).primaryPalette('light-green');

  $translateProvider.useStaticFilesLoader({
    files: [{
      prefix: './resources/locales/',
      suffix: '.json'
    }]
  });
  $translateProvider.useSanitizeValueStrategy('sanitize');
  $translateProvider.useLocalStorage();
  $translateProvider.preferredLanguage('en_US');

  $routeProvider.when('/login', {
    templateUrl: 'views/agentlogin.html',
    controller: 'AgentLoginController'
  }).when('/begincallscreen', {
    templateUrl: 'views/begincallscreen.html',
    controller: 'BeginCallController'
  }).when('/changepassword', {
    templateUrl: 'views/updatepassword.html',
    controller: 'UpdatePasswordController'
  }).when('/admin', {
    templateUrl: 'views/admin/admin.html',
    controller: 'AdminController',
    controllerAs: 'vm'
  }).when('/begincallresponse', {
    templateUrl: 'views/begincallresponse.html',
    controller: 'BeginCallController'
  }).when('/customer', {
    templateUrl: 'views/customer/customer.html',
    controller: 'CustomerController'
  }).otherwise({
    redirectTo: '/login'
  });
}).run(function ($rootScope, $location, authService, navService) {
  $rootScope.$on('$routeChangeStart', function () {
    if ($location.path().indexOf('changepassword') === 1) {
      var token = $location.search().token;
      if (angular.isDefined(token)) {
        sessionStorage.setItem('token', token);
      }
      return;
    }
    // return to login if not logged in and it's not change password request
    if (!authService.getIsLoggedIn() && $location.path().indexOf('changepassword') !== 1) {
      $location.path('/login');
    }
    // restrict agent for admin section
    if (!$rootScope.isAdmin && $location.path().indexOf('admin') === 1) {
      $location.path('/begincallscreen');
    }

  });

  // Enable language picker on begin call screen
  $rootScope.changeLanguagesEnabled = false;

  $rootScope.logout = function () {
    authService.destroy();
    navService.setAgentMode();
    $location.path('/');
  };

  $rootScope.openAdmin = function () {
    $location.path('/admin');
  };
  $rootScope.openAgent = function () {
    navService.setAgentMode();
    $location.path('/begincallscreen');
  };
});
