'use strict';

angular.module('callcenterApp').controller('BeginCallController',
  function($scope, $location, $mdSidenav, authService, $rootScope, httpService, dnisResponseService, errorService,
           spinnerService) {

    $rootScope.isLoggedIn = authService.getIsLoggedIn();
    $rootScope.gear = authService.getUserName();
    $scope.authKey = authService.getAuthKey();
    $scope.submitted = false;
    $scope.begincallresponse = 'No data';
    $scope.properties = {};
    $rootScope.startTimer = false;
    authService.setCallStarted(false);
    $rootScope.isCallStarted = false;

    // GET ani and dnis from query parameters if exists(for new call)
    var ani = $location.search().ANI;
    var dnis = $location.search().DNIS;
    if (angular.isDefined(ani)) {
      $scope.ani = ani;
    }
    if (angular.isDefined(dnis)) {
      $scope.dnis = dnis;
    }

    $scope.beginCall = function(isValid) {
      $scope.submitted = true;
      $scope.callcenterId = authService.getCallCenterId();
      if (isValid) {
        spinnerService.show();
        var headers = {'authToken': $scope.authKey};
        var dnisRelativeUrl = '/' + $scope.callcenterId + '/restaurants/' + $scope.dnis + '';
        var aniRelativeUrl = '/customers/' + $scope.ani + '';
        var requestData = {};
        // Get restaurant by DNIS ---------------------------------------------
        httpService._getHttpResult('GET', headers, dnisRelativeUrl, requestData).then(function(dnisResp) {
          $scope.loginResponse = dnisResp.data;
          $scope.submitted = false;

          // set ani in session so that ani will be available in customer controller
          authService.setAni($scope.ani);

          authService.setCallStarted(true);
          $rootScope.isCallStarted = true;
          dnisResponseService.setData(dnisResp.data);
          authService.setRestaurantId(dnisResp.data.Restaurant.restaurantId);
          authService.setConceptId(dnisResp.data.Restaurant.conceptId);
          $location.path('/customer');
          spinnerService.hide();
        }).catch(function(error) {
          errorService.displayError(error);
        });
      }
    };
  });
