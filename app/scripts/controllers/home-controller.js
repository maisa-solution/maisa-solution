'use strict';

/**
 * after user logged in ...
 */
angular.module('callcenterApp').controller('HomeController',
  function($scope, $location, $mdSidenav, $mdDialog, $mdMedia, authService, $rootScope, httpService, $log,
           commonFactory, $translate, errorService, spinnerService, navService) {
    $rootScope.isLoggedIn = authService.getIsLoggedIn();
    $rootScope.gear = authService.getUserName();
    $scope.authKey = authService.getAuthKey();
    $scope.getUserMode = navService.getUserMode;
    $scope.submitted = false;
    $scope.begincallresponse = 'No data';
    $scope.properties = {};
    $scope.isLeftClicked = true;
    $scope.isRightClicked = false;
    $scope.custTabVisited = false;
    $scope.storeTabVisited = false;
    $scope.mdMedia = $mdMedia;

    $rootScope.startTimer = false;
    $scope.languages = [{'Code': 'en_US', 'Name': 'English'}, {'Code': 'en_FR', 'Name': 'French'}];
    if (authService.getLanguage() === null) {
      authService.setLanguage('en_US');
      $translate.use('en_US');
    }
    $scope.language = authService.getLanguage();

    $scope.langChange = function(language) {
      authService.setLanguage(language);
      $translate.use(language);
    };

    $rootScope.changepassword = function() {
      $rootScope.authKey = authService.getAuthKey();
      if ($rootScope.authKey !== null) {
        $mdDialog.show({
          controller: DialogController,
          templateUrl: 'views/changepassword.html',
          parent: angular.element(document.body),
          clickOutsideToClose: false
        });
      } else {
        alert('Please login to continue');
      }
    };

    $scope.clickOnLeftCollIcon = function(isClicked) {
      commonFactory.prepareForBroadCast(authService.getIsLeftClicked(), 'left');
    };

    $scope.clickOnRightCollIcon = function(isClicked) {
      commonFactory.prepareForBroadCast(authService.getIsRightClicked(), 'right');
    };

    $scope.clickOnLeftToggle = function(isClicked) {
      commonFactory.toggleForBroadCast('left');
    };

    $scope.clickOnRightToggle = function(isClicked) {
      commonFactory.toggleForBroadCast('right');
    };

    function DialogController($scope, $mdDialog) {
      $scope.authKey = authService.getAuthKey();
      $scope.errorMessage = sessionStorage.getItem('errorMessage');
      $scope.submitted = false;
      $scope.hide = function() {
        $log.debug('Change password dialog closed.');
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $log.debug('Change password dialog canceled.');
        $mdDialog.cancel();
      };

      $scope.changePassword = function(ev, isValid, changePasswordForm) {
        $scope.submitted = true;
        if (isValid) {
          spinnerService.show();
          var headers = {
            'authToken': $scope.authKey
          };
          var requestData = {
            'CurrentPassword': $scope.currentPassword,
            'NewPassword': $scope.newPassword
          };
          httpService._getHttpResult('POST', headers, '/accounts/changepassword', requestData).then(function(resp) {
            $scope.loginResponse = resp.data;
            $scope.submitted = false;
            spinnerService.hide();
            $mdDialog.show({
              controller: DialogController,
              templateUrl: 'views/changepasswordsuccessful.html',
              parent: angular.element(document.body)
            });
          }).catch(function(error) {
            errorService.displayError(error);
          });
        }
      };
    }

    $scope.changePasswordForm = '';
  });
