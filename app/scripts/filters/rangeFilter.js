'use strict';
angular.module('callcenterApp').filter('range', RangeFilter);
function RangeFilter() {
  var arr = [];
  var filter =
    function(lower, upper) {
      for (var i = lower; i <= upper; i++) {
        arr.push(i);
      }
      return arr;
    };
  return filter;
}
