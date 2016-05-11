'use strict';

angular.module('callcenterApp')
  .controller('DispositionToastCtrl',
    function ($scope, $mdToast, $mdDialog, orderStatus) {
      $scope.orderStatus = orderStatus;
      // use below to hide toast if required
      $scope.closeToast = function () {
        $mdToast.hide();
      };

      $scope.addNewOrder = function (e) {
        //TODO clear order history, (orderId,customerInfo any other sessions and scope except CallId )
        //TODO agent can able add new order with in the same call
        $mdDialog
          .show($mdDialog
            .alert()
            .title('Work in progress')
            .ariaLabel('More info')
            .ok('Got it')
            .targetEvent(e)
          ).then(function () {
          $mdToast.hide();
        });
      };
    });
