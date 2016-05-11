'use strict';

angular.module('callcenterApp')
  .factory('UrlFactory', ['constants', function (constants) {

    var baseApiUrl = constants.baseUrl;
    var menuApiUrl = constants.menuApiUrl;

    return {
      getApiUrl: function (relativeUrl) {
        return baseApiUrl + relativeUrl;
      },
      getMenuApiUrl: function (relativeUrl) {
        return menuApiUrl + relativeUrl;
      }
    };
  }]);
