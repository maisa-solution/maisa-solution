'use strict';

angular.module('callcenterApp').controller('UsersController', UsersController);

function UsersController($scope, $mdDialog, adminUserService, errorService, spinnerService, listService) {
  var vm = this;
  vm.selected = [];
  vm.query = { order: 'FirstName', limit: 8, page: 1 };
  vm.paginationLable = { page: ':', rowsPerPage: '', of: 'of' };
  vm.user = {};
  vm.users = [];
  vm.callCenters = [];
  vm.loadMoreRecords = loadMoreRecords;
  vm.getCallCenters = getCallCenters;
  // load Users and callCenters when controller is initialized
  vm.loadMoreRecords(vm.query.page, vm.query.limit, vm.searchString);
  vm.getCallCenters(vm.query.page, 50);

  vm.onPaginate= function(page, limit) {
    vm.loadMoreRecords(page, limit, vm.searchString);
  };

  vm.searchUsers = function() {
    loadMoreRecords(vm.query.page, vm.query.limit, vm.searchString);
  };

  // reload userRecords when user created, updated or deleted
  $scope.$on('reloadUsersData', function(event, args) {
    loadMoreRecords(vm.query.page, vm.query.limit, vm.searchString);
  });

  vm.addNewUser = function(ev){
    $mdDialog.show({
      locals: { user: {}, isNew: true, callCenters: vm.callCenters },
      templateUrl: 'views/admin/userForm.html',
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      bindToController: true,
      controllerAs: 'vm',
      targetEvent: ev,
      controller: adminUserDialogController
    });
  };

  function loadMoreRecords(page, limit, keyword) {
    spinnerService.show();
    var promiseUsers = adminUserService.getUsers(page, limit, keyword);
    promiseUsers.then(function (response) {
      vm.users = response.data;
      spinnerService.hide();
    }).catch(function (error) {
      errorService.displayError(error);
    });
  }

  function getCallCenters (page, limit) {
    var promiseCallCenters = listService.getCallCenters(page, limit);
    promiseCallCenters.then(function (response) {
      vm.callCenters = response.Results;
      spinnerService.hide();
    }).catch(function (error) {
      // errorService.displayError(error);
      $log.debug('Error while Loading CallCenters: '+ error);
    });
  }

  vm.selectUser = function(ev, user){
    $mdDialog.show({
      locals: { user: user, isNew: false, callCenters: vm.callCenters },
      templateUrl: 'views/admin/userForm.html',
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      bindToController: true,
      controllerAs: 'vm',
      targetEvent: ev,
      controller: adminUserDialogController
    });
  };

}
