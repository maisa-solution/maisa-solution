'use strict';

angular.module('callcenterApp')
  .factory('dnisResponseService', function () {
  var response;
  return {
    getData: function () {
      // return restaurant;
      return response;
    },
    setData: function(data) {
      response = data;
    }
  };
});
