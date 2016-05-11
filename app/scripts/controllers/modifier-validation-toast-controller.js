'use strict';

angular.module('callcenterApp')
  .controller('ModifierValidationToastController',
    function ($log) {
      var vm = this;
      $log.debug('Invalid Answers: ' + vm.validationMessages);
    });
