'use strict';

angular.module('callcenterApp').factory('storeService',
  function($log, authService, spinnerService, httpService, $mdToast, UrlFactory, $http, $q, $filter, commonFactory) {
    var store = {};
    var isInfoTobeLoaded = true;
    var maxDate = '';
    var minDate = '';
    var pickupDate = '';
    var pickupTime = '';
    return {
      setStoreItems: function(value) {
        store = value;
      },
      getStoreItems: function() {
        return store;
      },
      setIsInfoTobeLoaded: function(value) {
        isInfoTobeLoaded = value;
      },
      getIsInfoTobeLoaded: function() {
        return isInfoTobeLoaded;
      },
      setMaxDate: function(value) {
        maxDate = value;
      },
      getMaxDate: function() {
        return maxDate;
      },
      setMinDate: function(value) {
        minDate = value;
      },
      getMinDate: function() {
        return minDate;
      },
      setPickupDate: function(value) {
        pickupDate = value;
      },
      getPickupDate: function() {
        return pickupDate;
      },
      setPickupTime: function(value) {
        pickupTime = value;
      },
      getPickupTime: function() {
        return pickupTime;
      },
      formatTo24Hours: function(time) {
        $log.debug('Time:' + time + '. Length:' + time.length);
        var hours = time.length === 7 ? parseInt(time.substr(0, 1)) : parseInt(time.substr(0, 2));
        if (time.indexOf('AM') !== -1 && hours === 12) {
          time = time.replace('12', '0');
        }
        if (time.indexOf('PM') !== -1 && hours < 12) {
          time = time.replace(hours, (hours + 12));
        }
        return time.replace(/(AM|PM)/, '');
      },
      formatAMPM: function(date) {
        var hours = date.getHours();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        var minutes = date.getMinutes();
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
      },
      saveDeliveryPickUpInformation: function(deliveryConfigMode, offset, timeArrival, pickupTime) {
        var orderId = authService.getOrderId();
        var restaurantId = authService.getRestaurantId();
        if (orderId) {
          var pickupTimeRelativeUrl = '/restaurant/' + restaurantId + '/order/' + orderId + '/deliveryconfiguration';

          var headers = {'authToken': authService.getCustomerAuthToken()};
          var requestData = {
            'deliveryType': 0,
            'requestedTimeOfArrival': '\/Date(' + timeArrival + '-' + offset + ')\/',
            'skipDeliveryCostValidation': true,
            'userRequestedTimeOfArrival': true
          };
          var methodName = 'PUT';
          var deferred = $q.defer();
          var storeServiceValue = this;
          httpService._getHttpResult(methodName, headers, pickupTimeRelativeUrl, requestData, true).then(function(resp) {
            //TODO below is fine for pickup need to handle it for 'delivery' and 'curbside'
            if (typeof resp.data === 'object' && deliveryConfigMode === 0) {
              commonFactory.preferedPickUpTimeForBroadcast(storeServiceValue, pickupTime);
              deferred.resolve(resp);
            } else {
              deferred.reject(resp);
            }
          }).catch(function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        }
      },
      getDeliveryModeConfiguration: function(deliveryConfigMode, offset) {
        var orderId = authService.getOrderId();
        var restaurantId = authService.getRestaurantId();
        var storeServiceVar = this;
        if (orderId) {
          var pickupTimeRelativeUrl = '/restaurant/' + restaurantId + '/order/' + orderId + '/deliveryconfiguration/' +
            deliveryConfigMode;

          var headers = {'authToken': authService.getCustomerAuthToken()};
          var requestData = '';
          var methodName = 'GET';
          var deferred = $q.defer();
          var storeServiceValue = this;

          $log.debug('pickupTimeRelativeUrl:' + pickupTimeRelativeUrl + ' authToken:' +
            authService.getCustomerAuthToken());

          httpService._getHttpResult(methodName, headers, pickupTimeRelativeUrl, requestData, true).then(function(resp) {
            //TODO below is fine for pickup need to handle it for 'delivery' and 'curbside'
            if (typeof resp.data === 'object') {
              //TODO refactor of code is needed here more code fixes
              var maxOrderTime = resp.data.restaurantHours.maxOrderDateTime;
              var minOrderTime = resp.data.restaurantHours.minOrderDateTime;
              var estimatedTime = resp.data.deliveryEstimate.estimatedTimeOfArrival;
              maxOrderTime =
                new Date(parseInt(maxOrderTime.substring(maxOrderTime.indexOf('(') + 1, maxOrderTime.indexOf('-'))));
              minOrderTime =
                new Date(parseInt(minOrderTime.substring(minOrderTime.indexOf('(') + 1, minOrderTime.indexOf('-'))));
              var estimateArrivalTime = new Date(parseInt(estimatedTime.substring(estimatedTime.indexOf('(') +
                1, estimatedTime.indexOf('-'))));
              //TODO attr from api is Date(1459868400000-0400) get timestamp and time offset separately by split
              var estimateArrivalTimeString = $filter('date')(estimateArrivalTime, 'yyyy-MM-dd HH:mm:ss', offset);
              var match = estimateArrivalTimeString.match(/^(\d+)-(\d+)-(\d+) (\d+)\:(\d+)\:(\d+)$/);
              estimateArrivalTime = new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
              var pickupTime = storeServiceVar.formatAMPM(estimateArrivalTime);
              var minDate = new Date(
                minOrderTime.getFullYear(),
                minOrderTime.getMonth(),
                minOrderTime.getDate()
              );
              var maxDate = new Date(
                maxOrderTime.getFullYear(),
                maxOrderTime.getMonth(),
                maxOrderTime.getDate()
              );
              var pickupDate = new Date(
                estimateArrivalTime.getFullYear(),
                estimateArrivalTime.getMonth(),
                estimateArrivalTime.getDate()
              );

              $log.debug('Hours:' + pickupTime + ' minutes:' + estimateArrivalTime.getMinutes());
              storeServiceVar.setPickupDate(pickupDate);
              storeServiceVar.setPickupTime(pickupTime);
              storeServiceVar.setMaxDate(maxDate);
              storeServiceVar.setMinDate(minDate);
              storeServiceVar.setIsInfoTobeLoaded(false);
              commonFactory.preferedPickUpTimeForBroadcast(storeServiceValue, pickupTime);
              $mdToast.show(
                $mdToast.simple()
                .textContent('The pickup time has been adjusted to the next available time.')
                .position('top right')
                .hideDelay(2000)
              );
              deferred.resolve(resp);
            }
          }).catch(function(error) {
            deferred.reject(error);
          });

          return deferred.promise;
        }
      },

      searchStore: function(keyword) {
        var headers = {authToken: authService.getAuthKey()};
        var conceptId = authService.getConceptId();
        var deferred = $q.defer();
        var googleApiLatLong = function() {
          // TODO move API key to a service or constant
          var googleApi = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + keyword +
            '&key=AIzaSyAjcV_TleFL9Xb2YRxygHnbrTIzn1CcTKk';
          return $http({
            method: 'GET',
            url: googleApi
          }).then(function(response) {
            return response;
          }).catch(function(error) {
            deferred.reject(error);
          });
        };

        googleApiLatLong().then(function(response) {
          var results = response.data.results;
          if (results.length) {
            var loc = results[0]['geometry']['location'];
            var requestUrl = '/restaurant/search?conceptid=' + conceptId + '&maxCount=20&maxDistance=25&' +
              'query=' + loc.lat + ',' + loc.lng +
              '&startIndex=0&queryFilter=DineIn|Pickup|Delivery&includeDemoStores=true';
            httpService._getHttpResult('GET', headers, requestUrl, {}, true).then(function(resp) {
              deferred.resolve(resp);
            }).catch(function(error) {
              deferred.reject(error);
            });
          } else {
            deferred.reject('No results found.');
          }
        });
        return deferred.promise;
      }
    };
  });
