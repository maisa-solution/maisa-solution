'use strict';

angular.module('callcenterApp').controller('CustomerLookupController', customerLookupController);

function customerLookupController($scope, $log, $mdDialog, spinnerService, authService, httpService, errorService,
                                  customerService) {
  $scope.hide = hide;
  $scope.cancel = cancel;
  $scope.changeCustomerCancel = changeCustomerCancel;
  $scope.onReorder = onReorder;
  $scope.onPaginate = onPaginate;
  $scope.addNewCustomer = addNewCustomer;
  $scope.selectCustomer = selectCustomer;
  $scope.searchCustomers = searchCustomers;
  $scope.getCustomers = getCustomers;

  $scope.isAniSearch = true;
  $scope.isKeywordSearch = false;

  $scope.selected = [];
  $scope.query = {order: 'LastName', limit: 5, page: 1};
  // update below when internalization applied
  $scope.paginationLabel = {page: 'Page:', rowsPerPage: 'Row per page:', of: 'of'};

  function hide() {
    $log.debug('Customer lookup dialog closed.');
    $mdDialog.hide();
  }

  function cancel() {
    $log.debug('Customer lookup dialog canceled.');
    $mdDialog.cancel();
  }

  /**
   * @param order
   */
  function onReorder(order) {}

  /**
   * @param page
   * @param limit
   */
  function onPaginate(page, limit) {}

  function addNewCustomer() {
    // If the ANI is 000-000-0000, it should not pre-populate.
    $scope.customer = {
      isNew: true,
      Id: null
    };

    $scope.resetAllServiceTypes();
    hide();
  }

  function changeCustomerCancel() {
    angular.copy($scope.master, $scope.customer);
    cancel();
  }

  /**
   * populate customer info in form
   * @param customer
   */
  function selectCustomer(customer) {
    $scope.customer = customer;
    // based on below either create customer and associate to call
    $scope.customer.isNew = false;
    if (customer.Phone === '0000000000') {
      $scope.customer.Phone = '';
    }
    hide();
    // associate call To customer and fetch previous orders to reOrder
    if ($scope.callAssociatedToId !== $scope.customer.Id) {
      spinnerService.show();
      var promiseCall = customerService.associateCallToCustomer($scope.customer.Id);
      promiseCall.then(function(resp) {
        $scope.callAssociatedToId = resp.data.Call.CustomerId;
        authService.setCustomerId(resp.data.Call.CustomerId);
        authService.setCustomerAuthToken(resp.data.Call.CustomerSessionToken);
        authService.setCustomerUserId($scope.customer.UserId);
        $scope.fetchCustomerPreviousOrders();
      }).catch(function(error) {
        errorService.displayError(error);
      });
    }
  }

  /**
   * @param isValid
   * @param searchQuery
   */
  function searchCustomers(isValid, searchQuery) {
    if (isValid) {
      $scope.query = {order: 'LastName', limit: 5, page: 1};
      $scope.paginationLabel = {page: 'Page:', rowsPerPage: 'Row per page:', of: 'of'};
      $scope.searchSubmitted = false;
      $scope.loadingCustomers = true;
      $scope.searchQuery = searchQuery;

      $scope.getCustomers(searchQuery, $scope.query.page, $scope.query.limit, $scope.query.order);

      $scope.onPaginate = function(page, limit) {
        $scope.searchSubmitted = false;
        $scope.loadingCustomers = true;
        $scope.getCustomers(searchQuery, page, limit, $scope.query.order);
      };
      $scope.onReorder = function(order) {
        $scope.searchSubmitted = false;
        $scope.loadingCustomers = true;
        order = order.replace(/^-/, ''); // replace first char if it is '-'
        $scope.getCustomers(searchQuery, $scope.query.page, $scope.query.limit, order);
      };
    }
  }

  /**
   * @param searchQuery
   * @param page
   * @param limit
   * @param order
   */
  function getCustomers(searchQuery, page, limit, order) {
    var url = '/customers?keyword=' + searchQuery + '&page=' + page + '&size=' + limit + '&sortby=' + order;
    var requestData = {};
    var headers = {'authToken': authService.getAuthKey()};
    $scope.query = {order: order, limit: limit, page: page};
    $scope.paginationLabel = {page: 'Page:', rowsPerPage: 'Row per page:', of: 'of'};
    $scope.isAniSearch = false;
    $scope.isKeywordSearch = true;
    httpService._getHttpResult('GET', headers, url, requestData).then(function(resp) {
      $scope.result = resp.data;
      $scope.customers = resp.data.Results;
      $scope.searchSubmitted = true;
      $scope.loadingCustomers = false;
      $scope.searchQuery = searchQuery;
    }).catch(function(error) {
      errorService.displayError(error);
    });
  }
}
