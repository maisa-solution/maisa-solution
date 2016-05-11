'use strict';

/**
 * current password and new password must not be same
 */
angular.module('callcenterApp')
  .directive('valuesShouldNotSame', function() {
  return {
    require: 'ngModel',
    scope: {
      valuesShouldNotSame: '='
    },
    link: function(scope, element, attrs, ctrl) {
      scope.$watch(function() {
        var combined;

        if (scope.valuesShouldNotSame || ctrl.$viewValue) {
          combined = scope.valuesShouldNotSame + '_' + ctrl.$viewValue;
        }
        return combined;
      }, function(value) {
        if (value) {
          ctrl.$parsers.unshift(function(viewValue) {
            var origin = scope.valuesShouldNotSame;
            if (origin === viewValue) {
              ctrl.$setValidity('valuesShouldNotSame', false);
              return undefined;
            } else {
              ctrl.$setValidity('valuesShouldNotSame', true);
              return viewValue;
            }
          });
        }
      });
    }
  };
});
