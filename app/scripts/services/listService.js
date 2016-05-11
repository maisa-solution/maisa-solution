'use strict';

/**
 * This service will create/update customer and will returns the customer Object(Promise)
 */
angular.module('callcenterApp')
  .factory('listService', function(httpService, authService, $q) {
    return {

      getStates: function () {
        var headers = {};
        var countryCode = 'US'; //TODO get the states by CountryCode (currently hardcoding to 'US')

        var deferred = $q.defer();
        var url = '/lists/states/' + countryCode;
        httpService._getHttpResult('GET', headers, url, {})
        .then(function (resp) {
          deferred.resolve(resp.data);
        }, function (error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      getAddressTypes: function () {
        var headers = {};
        var deferred = $q.defer();
        var url = '/lists/addresstypes';
        httpService._getHttpResult('GET', headers, url, {})
        .then(function (resp) {
          deferred.resolve(resp.data);
        }, function (error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      getCategories: function () {
        var headers = {'authToken': authService.getAuthKey()};
        var callCenterId = authService.getCallCenterId();
        var deferred = $q.defer();
        var url = '/' + callCenterId + '/categories';
        httpService._getHttpResult('GET', headers, url, {})
          .then(function (resp) {
            deferred.resolve(resp.data);
          }, function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },

      getCallCenters: function (page, limit) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var url = '/callcenters?page=' + page + '&size=' + limit + '&sortby=Name';
        httpService._getHttpResult('GET', headers, url, {})
          .then(function (resp) {
            deferred.resolve(resp.data);
          }, function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      }
    };
  });
