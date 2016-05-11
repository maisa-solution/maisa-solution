'use strict';

angular.module('callcenterApp').service('storeLookupService', StoreLookupService);

StoreLookupService.$inject = [
  '$mdDialog', 'commonFactory', 'storeService', 'errorService'
];

function StoreLookupService($mdDialog, commonFactory, storeService, errorService) {

  return {
    getStores: StoreLookupController
  };

  function StoreLookupController() {
    var vm = this;
    vm.lookupBy = {
      address1: vm.address1,
      city: vm.city,
      state: vm.state,
      postalCode: vm.postalCode
    };
    vm.storesList = [];
    vm.isProcessing = false;

    vm.close = function () {
      $mdDialog.hide();
    };

    vm.selectStore = function (restaurantId) {
      $mdDialog.hide();
      //broadCast to update current restaurant with selected restaurant
      commonFactory.prepStoreChange(restaurantId);
    };

    vm.searchStoreBtn = function () {
      vm.isProcessing = true;
      var keyword = vm.lookupBy.address1 + ',' + vm.lookupBy.city + ',' +
        vm.lookupBy.state + ',' + vm.lookupBy.postalCode;
      var searchPromise = storeService.searchStore(keyword);

      searchPromise.then(function (resp) {
        vm.storesList = resp.data.searchResults.results;
      }).catch(function (error) {
        errorService.displayError(error);
      }).finally(function () {
        vm.isProcessing = false;
      });
    };
  }
}
