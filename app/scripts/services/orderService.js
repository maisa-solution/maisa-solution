'use strict';

/**
 * This service will start order, add/remove menuItem to order.
 */
angular.module('callcenterApp').factory('orderService',
  function(httpService, authService, $q) {
    return {
      startOrder: function() {
        var headers = {
          authToken: authService.getAuthKey(),
          customerAuthToken: authService.getCustomerAuthToken()
        };
        var deferred = $q.defer();
        var requestData = {CallId: authService.getCallId()};
        // create/update customer based on isNew boolean
        var requestUrl = '/calls/startorder';

        httpService._getHttpResult('POST', headers, requestUrl, requestData).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      addOrUpdateMenuItem: function(menuItem, isEdit) {
        var requestUrl;
        var requestMethod;
        var headers = {'authToken': authService.getCustomerAuthToken()};
        var siteId = authService.getRestaurantId();
        var orderId = authService.getOrderId();
        var itemId = menuItem.orderItemId;
        var questions = [];
        var deferred = $q.defer();
        //construct question and answers for requestBody
        angular.forEach(menuItem.questions, function(eachQuestion) {
          var currentQuestion = {
            questionId: eachQuestion.questionId,
            order: orderId,
            specialInstructions: eachQuestion.specialInstructions,
            answers: []
          };
          angular.forEach(eachQuestion.answers, function(answer) {
            currentQuestion.answers.push({
              answerId: answer.answerId,
              quantity: menuItem.quantity
            });
          });
          questions.push(currentQuestion);
        });
        //construct request Data
        var requestData = {
          orderId: orderId,
          menuItemId: menuItem.menuItemId,
          quantity: menuItem.quantity,
          instructions: menuItem.instructions, //TODO check with api team is correct or not
          isSuggestedSale: true, //TODO remove hard coding
          questions: questions,
          scaleModQuantityWithItemQuantity: true,//TODO remove hard coding
          verifyLocationIsOnline: true,//TODO remove hard coding
          'whoFor': menuItem.instructions //TODO check with api team is correct or not
        };
        //add orderItemId to request body if updating an item
        requestData.orderItemId = itemId;

        if (isEdit) {
          requestUrl =
            '/restaurant/' + siteId + '/order/' + orderId +
            '/item/' + itemId;
          requestMethod = 'PUT';
        } else {
          requestUrl =
            '/restaurant/' + siteId + '/order/' + orderId +
            '/item';
          requestMethod = 'POST';
        }
        httpService._getHttpResult(requestMethod, headers, requestUrl, requestData, true).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      removeItem: function(menuItem) {
        var headers = {'authToken': authService.getCustomerAuthToken()};
        var siteId = authService.getRestaurantId();
        var orderId = authService.getOrderId();
        var itemId = menuItem.orderItemId;
        var deferred = $q.defer();
        var requestData = {};
        //TODO gt clarification from api about verifyLocationIsOnline=true
        var requestUrl = '/restaurant/' + siteId + '/order/' +
          orderId + '/item/' + itemId;
        httpService._getHttpResult('DELETE', headers, requestUrl, requestData, true).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      applyPromoCode: function(promoCode) {
        var requestData = {
          promoAmount: 0.0,
          promoCode: promoCode,
          verifyLocationIsOnline: true
        };
        var headers = {authToken: authService.getCustomerAuthToken()};
        var deferred = $q.defer();
        var restaurantId = authService.getRestaurantId();
        var orderId = authService.getOrderId();
        var requestUrl = '/restaurant/' + restaurantId +
          '/order/' + orderId + '/promo';
        httpService._getHttpResult('PUT', headers, requestUrl, requestData, true).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      cancelOrder: function() {
        var headers = {'authToken': authService.getCustomerAuthToken()};
        var siteId = authService.getRestaurantId();
        var orderId = authService.getOrderId();
        var deferred = $q.defer();
        var requestData = {};
        var requestUrl = '/restaurant/' + siteId + '/order/' +
          orderId;
        httpService._getHttpResult('DELETE', headers, requestUrl, requestData, true).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },
      // GET payment types supported by restaurant 'Pat AT Restaurant' ,'Credit Card' etc..
      getRestCheckoutConfiguration: function() {
        var headers = {'authToken': authService.getCustomerAuthToken()};
        var siteId = authService.getRestaurantId();
        var orderId = authService.getOrderId();
        var deferred = $q.defer();
        var requestData = {};
        var requestUrl = '/restaurant/' + siteId + '/order/' +
          orderId + '/checkoutconfig';
        httpService._getHttpResult('GET', headers, requestUrl, requestData, true).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      // Place/Submit Order
      //TODO update below to support all types of payments
      placeOrder: function(customer, checkout, selectedPaymentType, tipAMount, locationIsOnline, existingSavedCard) {
        var paymentTypeMethod = checkout.paymentTypeMethod; // new/existing card , payAtRestaurant, GiftCard..
        var headers = {'authToken': authService.getCustomerAuthToken()};
        var siteId = authService.getRestaurantId();
        var orderId = authService.getOrderId();
        // common requestData
        var requestData = {
          paymentTypeId: selectedPaymentType.id,
          firstName: customer.FirstName,
          lastName: customer.LastName,
          email: customer.Email ||
          'cc_email_declined@snapfinger.com',
          phone: customer.Phone,
          tipAmount: tipAMount,
          verifyLocationIsOnline: locationIsOnline,
          specialDirections: checkout.specialInstruction,
          paymentTypes: [selectedPaymentType]
        };
        if (paymentTypeMethod === 'newCard') {
          requestData.ccNumber = checkout.ccNumber;
          requestData.ccExpireMonth = checkout.ccExpireMonth;
          requestData.ccExpireYear = checkout.ccExpireYear;
          requestData.ccCvv = checkout.ccCvv;
          //TODO update below with delivery address selected information if needed
          requestData.ccAvsAddress = {
            address1: checkout.ccBillingAddress,
            deliveryInstructions: null, //TODO update if any
            name: checkout.ccHolderName,
            nameSetForBackwardsCompatibility: true,
            postalCode: checkout.ccPostalCode
          };
        } else if (paymentTypeMethod === 'existingCard') {
          requestData.ccToken = existingSavedCard.token;
          requestData.ccCvv = checkout.ccCvvExisting;
          //TODO update below with delivery address selected information if needed
          requestData.ccAvsAddress = {
            address1: checkout.ccBillingAddressExisting,
            deliveryInstructions: null, //TODO update if any
            nameSetForBackwardsCompatibility: true,
            postalCode: checkout.ccPostalCodeExisting
          };
        } else if (paymentTypeMethod === 'giftCard') {
          requestData.giftCardNumber = checkout.giftCardNumber;
          //requestData.giftCvv = "String content"; //TODO Update once get info from API team
          //requestData.giftSourceCode = "String content"; //TODO Update once get info from API team
        }
        var deferred = $q.defer();
        var requestUrl = '/restaurant/' + siteId + '/order/' +
          orderId;
        httpService._getHttpResult('POST', headers, requestUrl, requestData, true).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      endCall: function(disposition) {
        var headers = {'authToken': authService.getAuthKey()};
        var callId = authService.getCallId();
        var requestData = {
          DispositionReasonId: disposition.reasonId,
          Comment: disposition.comment
        };
        var deferred = $q.defer();
        var requestUrl = '/calls/' + callId + '/endcall';
        httpService._getHttpResult('PUT', headers, requestUrl, requestData).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },

      // Starts a brand new order, based on an order from the user's order history.
      repeatOrderFromHistory: function(repeatOrderId) {
        var headers = {'authToken': authService.getCustomerAuthToken()};
        var restaurantId = authService.getRestaurantId();
        var userId = authService.getCustomerUserId();
        var requestUrl = '/account/' + userId + '/restaurant/' +
          restaurantId + '/orderhistory/' + repeatOrderId +
          '/copy';
        var deferred = $q.defer();
        httpService._getHttpResult('GET', headers, requestUrl, {}, true).then(function(resp) {
          deferred.resolve(resp);
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      },
      // GET suggestive sale(questions) to display in checkout screen if exists
      getSuggestiveSales: function() {
        var headers = {'authToken': authService.getCustomerAuthToken()};
        var restaurantId = authService.getRestaurantId();
        var orderId = authService.getOrderId();
        var requestUrl = '/restaurant/' + restaurantId + '/order/' + orderId + '/suggestivesales';
        var deferred = $q.defer();
        httpService._getHttpResult('GET', headers, requestUrl, {}, true).then(function(resp) {
          deferred.resolve(resp);
        }).catch(function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      }
    };
  });
