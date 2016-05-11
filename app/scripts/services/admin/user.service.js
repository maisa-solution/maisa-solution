'use strict';
angular.module('callcenterApp').service('adminUserService', adminUserService);
adminUserService.$inject = [
  '$rootScope', 'httpService', 'authService', '$q', '$mdDialog'
];

function adminUserService($rootScope, httpService, authService, $q, $mdDialog, errorService) {
  return {
    getUsers: getUsers,
    updateUser: updateUser,
    createUser: createUser,
    deleteUser: deleteUser,
    deleteUserDialogController: deleteUserDialogController
  };
  // return paginated users
  function getUsers(page, limit,keyword) {
    var headers = {'authToken': authService.getAuthKey()};
    var deferred = $q.defer();
    var url = '/accounts?';
    // pass callcenterId param if admin only( role admin=> 1 , superAdmin => 2)
    if(authService.getRoleId() === 1) {
      url += 'callcenterid='+ authService.getCallCenterId() + '&'
    }
    url += 'page=' + page + '&size=' + limit +
      '&sortby=CallCenter|desc&sortby=LastName&sortby=FirstName';
    if(angular.isDefined(keyword) && keyword.length) {
      url += '&keyword='+ keyword;
    }
    httpService._getHttpResult('GET', headers, url, {})
      .then(function (resp) {
        deferred.resolve(resp);
      }).catch(function (error) {
        deferred.reject(error);
      });
    return deferred.promise;
  }

  function createUser(user) {
    var headers = {'authToken': authService.getAuthKey()};
    var deferred = $q.defer();
    var requestData = {
      "ChangePasswordFormUrl": window.location.href.split('#')[0] + '#/changepassword',
      "CallCenterAccount": {
        "Login": user.Login,
        "Password": user.Password,
        "Role": {
          "Id":  user.Role
        },
        "CallCenterId": user.CallCenterId,
        "FirstName": user.FirstName,
        "LastName": user.LastName,
        "Email": user.Email
      }
    };
    var url = '/accounts/';
    httpService._getHttpResult('POST', headers, url, requestData)
      .then(function (resp) {
        deferred.resolve(resp);
      }).catch(function (error) {
        deferred.reject(error);
      });
    return deferred.promise;

  }

  function updateUser(user) {
    var headers = {'authToken': authService.getAuthKey()};
    var deferred = $q.defer();
    var url = '/accounts/' + user.AccountId;
    var requestData = {
      CallCenterAccount: {
        Login: user.Login,
        "Role": {
          Id: user.Role
        },
        CallCenterId: user.CallCenterId,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email
      }
    };
    httpService._getHttpResult('PUT', headers, url, requestData)
      .then(function (resp) {
        deferred.resolve(resp);
      }).catch(function (error) {
        deferred.reject(error);
      });
    return deferred.promise;
  }

  function deleteUser(user) {
    var headers = {'authToken': authService.getAuthKey()};
    var deferred = $q.defer();
    var url = '/accounts/' + user.AccountId;
    var requestData = {};
    httpService._getHttpResult('DELETE', headers, url, requestData)
      .then(function (resp) {
        deferred.resolve(resp);
      }).catch(function (error) {
        deferred.reject(error);
      });
    return deferred.promise;
  }

  function deleteUserDialogController() {
    var vm = this;
    vm.close = function () {
      $mdDialog.hide();
    };
    vm.deleteUser = function () {
      var promiseDelete = deleteUser(vm.user);
      promiseDelete.then(function (response) {
        $mdDialog.hide();
        // reload user data
        $rootScope.$broadcast('reloadUsersData', {});
      }).catch(function (error) {
        errorService.displayError(error);
      });
    };
  }
}
