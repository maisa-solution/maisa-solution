'use strict';

/**
 * This service will create/update customer and will returns the customer Object(Promise)
 */
angular.module('callcenterApp')
  .factory('restMenuService', function (httpService, authService, $q) {
    return {
      getMenu: function (restId) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var requestData = {};
        // create/ update customer based on isNew boolean
        var requestUrl = '/restaurant/' + restId + '/menu?loadMenuItems=true';

        httpService._getHttpResult('GET', headers, requestUrl, requestData, true)
          .then(function (resp) {
            deferred.resolve(resp);
          }, function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },
      getMenuItem: function (restId, menuItemId) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var requestData = {};
        // create/ update customer based on isNew boolean
        var requestUrl = '/restaurant/' + restId + '/menuitem/' + menuItemId;

        httpService._getHttpResult('GET', headers, requestUrl, requestData, true)
          .then(function (resp) {
            deferred.resolve(resp);
          }, function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },

      getRestaurantById: function (restId) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var requestData = {};
        var requestUrl = '/restaurant/' + restId;
        httpService._getHttpResult('GET', headers, requestUrl, requestData, true)
          .then(function (resp) {
            deferred.resolve(resp);
          }, function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      }
    };
  });
