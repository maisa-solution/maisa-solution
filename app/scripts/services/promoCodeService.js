'use strict';

angular.module('callcenterApp').service('promoCodeService', PromoCodeService);

PromoCodeService.$inject = [
  'httpService', 'authService', '$q'
];

function PromoCodeService(httpService, authService, $q) {
  return {
    // Apply promo to the order.
    applyPromoCode: function (promoCode, isOnline) {
      var requestData = {
        promoCode: promoCode,
        verifyLocationIsOnline: isOnline
      };
      var headers = { authToken: authService.getCustomerAuthToken() };
      var deferred = $q.defer();
      var restaurantId = authService.getRestaurantId();
      var orderId = authService.getOrderId();
      var requestUrl = '/restaurant/' + restaurantId + '/order/' + orderId + '/promo';
      httpService._getHttpResult('PUT', headers, requestUrl, requestData, true)
        .then(function (resp) {
          deferred.resolve(resp);
        }, function (error) {
          deferred.reject(error);
        });
      return deferred.promise;
    },
    // Clears the current promo from the order
    clearPromoCode: function (promoCode, isOnline) {
      var requestData = {};
      var headers = { authToken: authService.getCustomerAuthToken() };
      var deferred = $q.defer();
      var restaurantId = authService.getRestaurantId();
      var orderId = authService.getOrderId();
      var requestUrl = '/restaurant/' + restaurantId + '/order/' + orderId + '/clearpromo?verifyLocationIsOnline=' + isOnline;
      httpService._getHttpResult('GET', headers, requestUrl, requestData, true)
        .then(function (resp) {
          deferred.resolve(resp);
        }, function (error) {
          deferred.reject(error);
        });
      return deferred.promise;
    }
  };
}
