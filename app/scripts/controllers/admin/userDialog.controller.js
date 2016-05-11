'use strict';

angular.module('callcenterApp').controller('UserDialogController', adminUserDialogController);

function adminUserDialogController($rootScope, $mdDialog,  errorService, adminUserService) {
  var vm = this;

  vm.close = function () {
    $mdDialog.hide();
  };

  vm.createUser = function () {
    var promiseUpdate = adminUserService.createUser(vm.user);
    promiseUpdate.then(function (response) {
      vm.user = response.data.Account;
      $mdDialog.hide();
      // reload user data
      $rootScope.$broadcast('reloadUsersData', {});
    }).catch(function (error) {
      errorService.displayError(error);
    });
  };

  vm.updateUser = function () {
    var promiseUpdate = adminUserService.updateUser(vm.user);
    promiseUpdate.then(function (response) {
      vm.user = response.data.Account;
      $mdDialog.hide();
      // reload user data
      $rootScope.$broadcast('reloadUsersData', {});
    }).catch(function (error) {
      errorService.displayError(error);
    });
  };

  vm.confirmUserDelete = function (ev) {
    $mdDialog.show({
      locals: { user: vm.user },
      templateUrl: 'views/admin/deleteUser.html',
      parent: angular.element(document.body),
      clickOutsideToClose: false,
      bindToController: true,
      controllerAs: 'vm',
      targetEvent: ev,
      controller: adminUserService.deleteUserDialogController
    });
  }
}
