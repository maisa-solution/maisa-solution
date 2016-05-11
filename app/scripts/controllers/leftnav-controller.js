'use strict';

angular.module('callcenterApp')
  .controller('LeftNavController', function ($scope, $mdSidenav, $log) {
  $scope.close = function () {
    $mdSidenav('left').close()
      .then(function () {
        $log.debug('close LEFT is done');
      });
  };
});
