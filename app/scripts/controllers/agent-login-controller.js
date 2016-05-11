'use strict';

angular.module('callcenterApp').controller('AgentLoginController',
  function($scope, $log, $location, $mdSidenav, $mdDialog, $mdMedia, authService, $rootScope, httpService,
           errorService, spinnerService, navService) {
    // redirect to begincallscreen if user already loggedIn
    if (authService.getIsLoggedIn()) {
      var destination = $rootScope.isAdmin ? '/admin' : '/begincallscreen';
      $location.path(destination);
      return;
    }

    $scope.toggleList = function() {
      $mdSidenav('left').toggle();
    };
    $scope.languages = [{'Code': 'en', 'Name': 'English'}, {'Code': 'fr', 'Name': 'French'}];
    $scope.language = 'en';
    $scope.properties = {};
    $scope.authToken = '';
    $scope.submitted = false;
    $rootScope.isLoggedIn = authService.getIsLoggedIn();
    authService.setCallStarted(false);
    $rootScope.isCallStarted = false;
    $rootScope.startTimer = false;
    $scope.isLeftClicked = false;
    $scope.isRightClicked = false;

    $scope.agentLogin = function(isValid) {
      $scope.submitted = true;
      $scope.loginResponse = [{}];
      if (isValid) {
        spinnerService.show(); // show progress circular
        var requestData = {
          'userName': $scope.userName,
          'password': $scope.password
        };
        httpService._getHttpResult('POST', '', '/login', requestData).then(function(resp) {
          $scope.loginResponse = resp.data;
          $scope.authToken = resp.data.AuthToken;
          $scope.roleName = resp.data.RoleName;
          $scope.roleId = resp.data.RoleId;
          // agentRoleId=> 0 , superAdminRoleId=> 2 , adminRoleId=> 1
          $rootScope.isAdmin = $scope.roleId === 1 || $scope.roleId === 2;
          if (typeof(Storage) !== 'undefined') {
            //TODO set user session info in single object instead of individual like user: { name: '' ...etc }
            authService.setUserName($scope.userName);
            authService.setCallCenterId(resp.data.CallCenterId);
            authService.setRoleName($scope.roleName);
            authService.setRoleId(resp.data.RoleId);
            authService.setIsLoggedIn(true);
            authService.setAuthKey($scope.authToken);
          } else {
            $log.debug('No Session storage support');
          }
          // close progress circular
          spinnerService.hide();

          $scope.submitted = false;
          if ($rootScope.isAdmin) {
            $location.path('/admin');
          } else {
            navService.setAgentMode();
            $location.path('/begincallscreen');
          }
        }).catch(function(error) {
          errorService.displayError(error);
        });
      }
    };

    $scope.customFullscreen = $mdMedia('xs');
    $scope.resetPassword = function(ev) {
      $mdDialog.show({
        controller: DialogController,
        templateUrl: 'views/resetpassword.html',
        parent: angular.element(document.body),
        targetEvent: ev
      });
    };

    $scope.langChange = function() {
    };

    function DialogController($scope, $mdDialog, $log) {

      $scope.loginResponseError = sessionStorage.getItem('errorMessage');
      $scope.hide = function() {
        $log.debug('Reset password dialog closed.');
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $log.debug('Reset password dialog canceled.');
        $mdDialog.cancel();
      };
      $scope.submitted = false;
      // Reset Password -------------------------------------------------------------------
      $scope.resetPassword = function(ev, isValid) {
        $scope.submitted = true;
        if (isValid) {
          spinnerService.show();
          var requestData = {
            'Login': '' + $scope.userName + '',
            // get path name from window
            'ChangePasswordFormUrl': window.location.href.split('#')[0] + '#/changepassword'
          };
          httpService._getHttpResult('POST', '', '/accounts/resetpassword', requestData).then(function(resp) {
            $scope.loginResponse = resp.data;
            $scope.submitted = false;
            var useFullScreen = $mdMedia('xs') && $scope.customFullscreen;
            $mdDialog.show({
              controller: DialogController,
              templateUrl: 'views/resetpasswordsuccessful.html',
              parent: angular.element(document.body),
              targetEvent: ev,
              fullscreen: useFullScreen// clickOutsideToClose:true,
            });
            $scope.$watch(function() {
              return $mdMedia('xs');
            }, function(wantsFullScreen) {
              $scope.customFullscreen = (wantsFullScreen === true);
            });
          }).catch(function(error) {
            errorService.displayError(error);
          });
        }
      };
    }
  });
