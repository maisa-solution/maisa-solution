'use strict';

/**
 * This service will create/update customer and will returns the customer Object(Promise)
 */
angular.module('callcenterApp')
  .factory('customerService', function (commonFactory, httpService, authService, $q, $mdDialog, $timeout) {
    return {
      getCustomer: function (customer) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var requestData = {
          'Customer': {
            'FirstName': customer.FirstName,
            'LastName': customer.LastName,
            'Phone': customer.Phone,
            'Email': customer.Email,
            'Notes': customer.Notes
          }
        };
        // create/ update customer based on isNew boolean
        var requestUrl = (customer.isNew) ? '/customers' : '/customers/' + customer.Id;
        var requestMethod = (customer.isNew) ? 'POST' : 'PUT';

        httpService._getHttpResult(requestMethod, headers, requestUrl, requestData)
          .then(function (resp) {
            authService.setCustomerId(resp.data.Customer.Id);
            //TODO uncomment below if UserId not null from api
            //authService.setCustomerAuthToken(resp.data.Customer.UserId);
            deferred.resolve(resp);
          }).catch(function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },

      associateCallToCustomer: function (customerId) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var requestData = {'CustomerId': customerId};
        var url = '/calls/' + authService.getCallId() + '/associatecustomer';
        httpService._getHttpResult('PUT', headers, url, requestData)
          .then(function (resp) {
            deferred.resolve(resp);
          }).catch(function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },

      getCars: function (customerId) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var url = '/customers/' + customerId + '/cars';
        httpService._getHttpResult('GET', headers, url, {})
          .then(function (resp) {
            deferred.resolve(resp);
          }).catch(function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },

      getCustomerPreviousOrders: function (customer) {
        var count = 10;
        var conceptId = authService.getConceptId();
        var customerToken = customer.UserId;
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var url = '/account/' + customerToken + '/orderhistory/' + count + '?conceptid=' + conceptId;
        httpService._getHttpResult('GET', headers, url, {}, true)
          .then(function (resp) {
            deferred.resolve(resp);
          }).catch(function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },

      validateServiceTypeDetails: function () {
        var vm = this;
        vm.close = function () {
          $mdDialog.hide();
        };
        vm.switchToCustomerTab = function () {
          $mdDialog.hide();
          $timeout(function () {
            // broadCast selectedTab with customerTab(0)
            commonFactory.prepSelectedTabForBroadcast(0);
          }, 500);
        };
      },
      // Get all the saved credit cards belonging to a customer.
      getSavedCreditCards: function () {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var customerId = authService.getCustomerId();
        var url = '/customers/' + customerId + '/creditcards';
        httpService._getHttpResult('GET', headers, url, {})
          .then(function (resp) {
            deferred.resolve(resp);
          }).catch(function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      },
      // adds a credit card for a customer
      addCreditCard: function (checkout, selectedPaymentType) {
        var headers = {'authToken': authService.getAuthKey()};
        var deferred = $q.defer();
        var requestData = {
          CreditCard: {
            nickname: selectedPaymentType.name,
            ccType: selectedPaymentType.name,
            name: selectedPaymentType.name,
            ccNumber: checkout.ccNumber,
            expirationDate: checkout.ccExpireYear + '-' + checkout.ccExpireMonth + '-01T00:00:00',
            billingAddress1: checkout.ccBillingAddress,
            billingPostalCode: checkout.ccPostalCode,
            isDefault: checkout.setAsDefaultCard
          }
        };
        var customerId = authService.getCustomerId();
        var url = '/customers/' + customerId + '/creditcards';
        httpService._getHttpResult('POST', headers, url, requestData)
          .then(function (resp) {
            deferred.resolve(resp);
          }).catch(function (error) {
            deferred.reject(error);
          });
        return deferred.promise;
      }
    };
  });
