'use strict';

angular.module('callcenterApp').controller('CustomerNotFoundController', customerNotFoundController);

function customerNotFoundController($scope, $log, $mdDialog) {
  $scope.addNewCustomer = addNewCustomer;
  $scope.newSearch = newSearch;

  /**
   * @param ev
   * @param ani
   */
  function newSearch(ev, ani) {
    $scope.ani = ani;
    $log.debug('Canceling open dialog from customerNotFoundDialogController:newSearch.');
    $mdDialog.cancel();
    $mdDialog.show({
      locals: {
        customers: [],
        ani: $scope.ani,
        searchQuery: $scope.searchQuery
      },
      scope: $scope,        // use parent scope in template
      preserveScope: true,
      controller: 'CustomerLookupController',
      templateUrl: 'views/customer_lookup/customer_lookup.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      // bindToController: true,
      clickOutsideToClose: false
    });
  }

  /**
   * @param ani
   */
  function addNewCustomer(ani) {
    // If the ANI is 000-000-0000, it should not pre-populate.
    $scope.customer = {
      isNew: true,
      Id: null,
      Phone: angular.equals(ani, '0000000000') ? '' : ani
    };

    $scope.resetAllServiceTypes();
    $log.debug('Canceling open dialog from customerNotFoundDialogController:addNewCustomer.');
    $mdDialog.cancel();
  }
}
