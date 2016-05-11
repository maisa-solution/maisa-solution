'use strict';

angular.module('callcenterApp')
  .controller('UpdatePasswordController',
    function ($scope, $location, httpService, errorService, spinnerService) {
      $scope.submitted = false;

      // update password from email link(via token)
      $scope.updatePassword = function (isValid, updateForm) {
        $scope.submitted = true;
        if (isValid) {
          spinnerService.show();
          $scope.loginResponse = [{}];
          var requestData = {
            'Token': '' + sessionStorage.getItem('token') + '',
            'password': '' + $scope.newPassword + ''
          };
          httpService._getHttpResult('POST', '', '/accounts/updatepassword', requestData)
            .then(function (resp) {
              $scope.loginResponse = resp.data;
              $scope.submitted = false;
              spinnerService.hide();
              $location.path('/login');
            }).catch(function (error) {
              errorService.displayError(error);
            });
        }
      };
    }
  );
