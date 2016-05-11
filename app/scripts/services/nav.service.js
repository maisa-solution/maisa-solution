'use strict';

// TODO move customer tab navigation into this service and out of controllers.
angular.module('callcenterApp').service('navService', navService);

navService.$inject = ['$log'];

function navService($log) {
  var userMode = 'Agent';
  return {
    setAdminMode: setAdminMode,
    setAgentMode: setAgentMode,
    getUserMode: getUserMode
  };

  function setAdminMode() {
    $log.debug('userMode set to Admin.');
    userMode = 'Admin';
  }

  function setAgentMode() {
    $log.debug('userMode set to Agent.');
    userMode = 'Agent';
  }

  function getUserMode() {
    return userMode;
  }
}
