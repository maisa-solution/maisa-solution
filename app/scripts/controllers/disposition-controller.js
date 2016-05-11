'use strict';
angular.module('callcenterApp').controller('DispositionController',
  function ($scope, $mdToast, $location, commonFactory, errorService, listService, orderService) {

    $scope.endCallSubmitted = false;// by default endCall submission is false
    $scope.categories = [];
    $scope.disposition = {comment: ''};
    $scope.orderStatus = '';
    $scope.isProcessing = '';

    // display respected toast when orderStatus changed in checkout controller
    $scope.$on('broadCastOrderedStatus', function () {
      $scope.orderStatus = commonFactory.orderStatus;
      if ($scope.orderStatus !== '') {
        $mdToast.show({
          hideDelay: 3000,
          position: 'top right',
          controller: 'DispositionToastCtrl',
          templateUrl: 'views/disposition/toast-order-status.html',
          theme: 'order-toast',
          locals: {orderStatus: $scope.orderStatus}
        });
      }
    });

    var getCategories = listService.getCategories();
    getCategories.then(function (response) {
        $scope.categories = response.Categories;
      },
      function (error) {
        errorService.displayError(error);
      }
    );

    $scope.updateDispositionReason = function (category, reason) {
      //TODO pass below disposition information for 'End Call' request
      $scope.disposition.categoryId = category.DispositionCategoryId;
      $scope.disposition.reasonId = reason.DispositionReasonId;
    };

    $scope.endCall = function (isValid) {
      $scope.endCallSubmitted = true;
      if (!isValid) {
        return;
      }
      if ($scope.disposition.reasonId) {
        $scope.isProcessing = true;
        var promiseEndCall = orderService.endCall($scope.disposition);
        promiseEndCall.then(function (resp) {
          $scope.isProcessing = false;
          // clear all session info
          sessionStorage.clear();
          // empty rightNav cart items
          commonFactory.orderedItemsForBroadCast([]);
          commonFactory.prepPreviousOrdersForBroadcast([]);
          $location.path('/begincallscreen').replace();
        }).catch(function (error) {
          $scope.isProcessing = false;
          errorService.displayError(error);
        });
      } else {
        $mdToast.show({
          hideDelay: 3000,
          position: 'top right',
          controller: 'DispositionToastCtrl',
          templateUrl: 'views/disposition/toast-select-reason.html',
          locals: {orderStatus: $scope.orderStatus}
        });
      }
    };
  });
