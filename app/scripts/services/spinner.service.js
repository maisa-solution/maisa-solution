'use strict';

angular.module('callcenterApp').service('spinnerService', SpinnerService);

SpinnerService.$inject = ['$mdDialog', '$log'];

function SpinnerService($mdDialog, $log) {
  return {
    show: showProgressCircular,
    hide: closeProgressCircular
  };

  function showProgressCircular() {
    $mdDialog.show({
      templateUrl: 'views/progress-circular.html',
      parent: angular.element(document.body)
    });
  }

  function closeProgressCircular() {
    $log.debug('Progress dialog closed.');
    $mdDialog.cancel();
  }
}
