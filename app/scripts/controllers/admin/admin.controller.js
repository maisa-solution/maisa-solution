'use strict';

angular.module('callcenterApp').controller('AdminController',
  function ($log, $rootScope, $location, $window, $timeout, $mdMedia, authService,
            navService) {
    var vm = this;
    $rootScope.isLoggedIn = authService.getIsLoggedIn();
    $rootScope.gear = authService.getUserName();

    if (!$rootScope.isLoggedIn) { // || authService.getRoleName() !== 'Admin') {
      $location.path('/login');
      return;
    } else {
      navService.setAdminMode();
    }

    vm.mdMedia = $mdMedia;
    vm.isLeftNavDisplayed = authService.getIsLeftClicked;
    vm.isRightNavDisplayed = authService.getIsRightClicked;
    vm.adminLocation = 'stores';
    vm.navigate = navigate;

    authService.setIsLeftClicked(true);
    authService.setIsRightClicked(true);

    var w = angular.element($window);
    $rootScope.$watch(
      function() {
        return $window.innerHeight;
      },
      function(value) {
        vm.leftNavHeight = value - 64;
        vm.rightNavHeight = value - 64;
        vm.middleHeightSm = value - 64;
        vm.innerMiddleHeightSm = value - 161;
        vm.middleHeight = value - 100;
        vm.innerMiddleHeight = value - 197;
      },
      true
    );

    w.bind('resize', function() {
      $timeout(function() {
        $rootScope.$apply();
      }, 0, false);
    });

    /**
     * Navigate to the selected view and set the associated leftNav list item as active
     * @param location
     */
    function navigate(location) {
      $log.debug('Navigate to ' + location + ' called.');
      vm.adminLocation = location;
    }
  });
