'use strict';

angular.module('callcenterApp').controller('CheckoutController',
  function ($rootScope, $scope, $log, $filter, $timeout, $mdDialog, $mdToast, $locale, orderService, promoCodeService,
            sharedProperties, commonFactory, storeService, errorService, authService, customerService) {
    init();

    // update suggestive sales when store changed
    $scope.$on('broadcastSuggestiveSales', getSuggestiveSales);
    // update checkout configuration when store changed
    $scope.$on('broadcastCheckoutConfiguration', getCheckoutConfiguration);
    // TODO move most all of these business logic functions into services and out of the controller
    $scope.openSuggestiveSaleModifiers = openSuggestiveSaleModifiers;
    $scope.getNextSuggestiveSale = getNextSuggestiveSale;
    $scope.confirmCancellingOrder = confirmCancellingOrder;
    $scope.placeOrder = placeOrder;
    $scope.manualTip = manualTip;
    $scope.applyTip = applyTip;
    $scope.applyPromoCode = applyPromoCode;
    $scope.clearPromoCode = clearPromoCode;
    $scope.updateSelectedPaymentType = updateSelectedPaymentType;
    $scope.updateSelectedPaymentTypeFromExistingCard = updateSelectedPaymentTypeFromExistingCard;

    // Listen for broadcast of orderStatus
    $scope.$on('broadCastOrderedStatus', function () {
      $scope.orderStatus = commonFactory.orderStatus;
    });

    // update orderResponse
    $scope.$on('broadcastOrderResponse', function () {
      $scope.orderResponse = commonFactory.orderResponse;
      // display next suggestive sale if exists
      if ($scope.suggestiveSales.length && $scope.currentSuggestiveSale) {
        $scope.nextSuggestiveSaleIndex += 1;
        $scope.currentSuggestiveSale = $scope.suggestiveSales[$scope.nextSuggestiveSaleIndex];
      }
    });

    // display alert when selected tab is checkout and items are empty
    $scope.$on('broadcastSelectedTab', function () {
      $scope.selectedTab = commonFactory.selectedTab;
      if ($scope.selectedTab === 3 && (angular.isUndefined($scope.orderResponse.orderItems) ||
          $scope.orderResponse.orderItems.length === 0)) {
        $mdDialog.show({
          templateUrl: 'views/cart/no-items-in-cart.html',
          parent: angular.element(document.body),
          clickOutsideToClose: false,
          scope: $scope,
          preserveScope: true,
          controller: function DialogController($scope, $mdDialog) {
            $scope.close = function () {
              $mdDialog.hide();
            };
            $scope.switchTab = function (tabIndex) {
              $mdDialog.hide();
              $timeout(function () {
                $scope.changeTab(tabIndex);
              }, 500);
            };
          }
        });
      } else if ($scope.selectedTab === 3) {
        // call checkoutConfig when visits first time after adding items
        if (!$scope.isCheckoutConfigCalled) {
          getCheckoutConfiguration();
        }
        getSuggestiveSales();
        // GET customer saved cards
        getCustomerSavedCreditCards();
      }
    });

    function init() {
      $scope.addedOrderedItems = [];
      $scope.addedOrderedItems = sharedProperties.getMenuOrderedItems();
      $log.debug('addedOrderedItems :' + JSON.stringify($scope.addedOrderedItems));
      $scope.checkout = {};
      // added default values because attr is defined checking  is > 0 or not in view properly
      $scope.orderResponse = {
        subtotal: 0, discount: 0, surchargeFee: 0, tax: 0, tip: 0, total: 0, manualTip: 0
      };
      //Get checkout configuration for a restaurant.
      $scope.checkoutConfig = {};
      $scope.paymentMethodPayAtRestaurant = null;
      $scope.paymentMethodGiftCard = null;
      $scope.paymentMethodCreditCards = []; // display only supported credit cards
      $scope.isCheckoutConfigCalled = false;
      $scope.isProcessing = false;
      $scope.selectedPaymentType = {};

      $scope.store = storeService.getStoreItems();
      $scope.tipPercentage = [5, 10, 15, 20, 25, 30];
      $scope.suggestiveSales = {};
      $scope.nextSuggestiveSaleIndex = 0;

      $scope.cardMonths = $locale.DATETIME_FORMATS.MONTH;
      $scope.currentYear = new Date().getFullYear();
      $scope.cardYears = [];
      if (!$scope.cardYears.length) {
        $scope.cardYears = $filter('range')($scope.currentYear, $scope.currentYear + 13);
      }
      $scope.existingSavedCards = [];
      $scope.existingSavedCard = null;
    }

    // get restaurant checkout configuration(paymentTypes) if orderStarted against restId and orderId
    function getCheckoutConfiguration() {
      var promiseConfig = orderService.getRestCheckoutConfiguration();
      promiseConfig.then(function (resp) {
        $scope.checkoutConfig = resp.data;
        $scope.isCheckoutConfigCalled = true;
        // Show supported payment types only in view
        $scope.paymentMethodPayAtRestaurant = $filter('filter')($scope.checkoutConfig.paymentTypes, {type: 'cash'})[0];
        $scope.paymentMethodGiftCard = $filter('filter')($scope.checkoutConfig.paymentTypes, {type: 'giftcard'})[0];
        $scope.paymentMethodCreditCards = $filter('filter')($scope.checkoutConfig.paymentTypes, {type: 'creditcard'});
      }).catch(function (error) {
        $log.error('Failed to get checkout configuration: ' + error);
      });
    }

    //  GET customer saved cards
    function getCustomerSavedCreditCards() {
      var promiseSavedCards = customerService.getSavedCreditCards();
      promiseSavedCards.then(function (resp) {
        $scope.existingSavedCards = resp.data.creditCards;
      }).catch(function (error) {
        errorService.displayError(error);
      });
    }

    // Get suggestive sales for order if any
    function getSuggestiveSales() {
      var promiseSuggestiveSale = orderService.getSuggestiveSales();
      promiseSuggestiveSale.then(function (resp) {
        $scope.suggestiveSales = resp.data.configurations;
        $scope.currentSuggestiveSale = $scope.suggestiveSales[$scope.nextSuggestiveSaleIndex];
      }).catch(function (error) {
        $log.error('Failed to get suggestive sales: ' + error);
      });
    }

    function openSuggestiveSaleModifiers(ev, item) {
      var menuItem = item;
      menuItem.itemId = item.menuItemId;
      var emitParams = {
        ev: ev,
        restId: authService.getRestaurantId(),
        menuItem: menuItem
      };
      // execute/emit menu-controller's openModifiers method from current controller
      $rootScope.$broadcast('openMenuItemModifiers', emitParams);
    }

    function getNextSuggestiveSale() {
      $scope.nextSuggestiveSaleIndex += 1;
      $scope.currentSuggestiveSale = $scope.suggestiveSales[$scope.nextSuggestiveSaleIndex];
    }

    function confirmCancellingOrder() {
      $mdDialog.show({
        clickOutsideToClose: true,
        scope: $scope,
        preserveScope: true,
        templateUrl: 'views/checkout/order-cancel-confirmation.html',
        controller: function DialogController($scope, $mdDialog) {

          $scope.keepIt = function () {
            $mdDialog.hide();
          };

          $scope.cancelOrder = function () {
            $scope.isProcessing = true;
            var promiseCancelOrder = orderService.cancelOrder();
            promiseCancelOrder.then(function (orderResp) {
              $scope.isProcessing = false;
              $mdDialog.hide();
              $timeout(function () {
                commonFactory.prepOrderStatusForBroadcast('cancelled');
                $scope.changeTab(4); // switch to 'disposition screen'
              }, 500);
            }).catch(function (error) {
              errorService.displayError(error);
            });
          };
        }
      });
    }

    /**
     * @param isValid
     */
    function placeOrder(isValid) {
      $scope.isSubmitted = true;
      var validations = validatePlaceOrder();
      if (validations.length > 0) {
        $mdToast.show({
          hideDelay: 3000,
          position: 'top right',
          templateUrl: 'views/alerts/validations-toast.html',
          controller: function ToastController($scope, $mdDialog, validations) {
            $scope.validations = validations;
          },
          locals: {validations: validations}
        });
        $scope.isSubmitted = false;
      } else if (isValid) {
        $scope.isProcessing = true;
        var selectedPaymentType = $scope.selectedPaymentType;
        var tipAmount = $scope.orderResponse.tip;
        var locationIsOnline = $scope.dnisResponse.IsOnline;
        var promisePlaceOrder = orderService.placeOrder($scope.customer, $scope.checkout, selectedPaymentType, tipAmount,
          locationIsOnline, $scope.existingSavedCard);
        promisePlaceOrder.then(function (resp) {
          if ($scope.checkout.saveCard)  {
            customerService.addCreditCard($scope.checkout, selectedPaymentType);
          }
          $timeout(function () {
            commonFactory.prepOrderStatusForBroadcast('placed');
            $scope.changeTab(4); // switch to 'disposition screen'
          }, 500);
        }).catch(function (error) {
          errorService.displayError(error);
        }).finally(function () {
          $scope.isProcessing = false;
        });
      }
    }

    function manualTip() {
      $scope.orderResponse.manualTip = parseFloat($scope.checkout.checkoutTip);
      commonFactory.prepOrderResponseForBroadcast($scope.orderResponse);
    }

    /**
     * @param index
     */
    function applyTip(index) {
      var tipPercentage = $scope.tipPercentage[index];
      var tipAmount = $filter('number')(($scope.orderResponse.subtotal / 100 * tipPercentage), 2);
      // set input value
      $scope.checkout.checkoutTip = tipPercentage + ' %  $' + tipAmount;
      $scope.orderResponse.manualTip = parseFloat(tipAmount);
      // broadcast orderResponse to update in rightNav with finalTotal
      commonFactory.prepOrderResponseForBroadcast($scope.orderResponse);
    }

    /**
     * @param ev
     */
    function applyPromoCode(ev) {
      $scope.promoErrorMessage = ''; // clear previous msg if exists
      if ($scope.checkout.promoCode) {
        $scope.isPromoProcessing = true;
        var locationIsOnline = $scope.dnisResponse.IsOnline;
        var promoPromise = promoCodeService.applyPromoCode($scope.checkout.promoCode, locationIsOnline);
        promoPromise.then(function (response) {
          $scope.isPromoValid = true;
          $scope.isPromoProcessing = false;
          var orderResponse = response.data;
          if ($scope.orderResponse.manualTip) {
            orderResponse.manualTip = $scope.orderResponse.manualTip;
          }
          // broadcast response of order
          commonFactory.prepOrderResponseForBroadcast(orderResponse);
        }).catch(function (error) {
          $scope.isPromoValid = false;
          $scope.promoErrorMessage = error;
          $scope.isPromoProcessing = false;
        });
      } else {
        $scope.promoErrorMessage = 'Please enter valid promo code';
      }
    }

    function clearPromoCode() {
      if ($scope.checkout.promoCode !== undefined) {
        $scope.isPromoProcessing = true;
        var locationIsOnline = $scope.dnisResponse.IsOnline;
        var promoPromise = promoCodeService.clearPromoCode($scope.checkout.promoCode, locationIsOnline);
        promoPromise.then(function (response) {
          // clear input and previous error message
          $scope.checkout.promoCode = '';
          $scope.isPromoValid = false;
          $scope.isPromoProcessing = false;
          $scope.promoErrorMessage = '';
          var orderResponse = response.data;
          if ($scope.orderResponse.manualTip) {
            orderResponse.manualTip = $scope.orderResponse.manualTip;
          }
          // broadcast response of order
          commonFactory.prepOrderResponseForBroadcast(response.data);
        }).catch(function (error) {
          errorService.displayError(error);
        });
      }
    }

    /**
     * @param paymentType
     */
    function updateSelectedPaymentType(paymentType) {
      $scope.selectedPaymentType = paymentType;
      $scope.checkout.paymentTypeId = paymentType.id;
      //To get selected paymentTypeMethod(radio selected) use $scope.checkout.paymentTypeMethod
    }

    /**
     * @param existingSavedCard
     */
    function updateSelectedPaymentTypeFromExistingCard(existingSavedCard) {
      $scope.existingSavedCard = existingSavedCard;
      // assign selectedPaymentType from existing
      $scope.selectedPaymentType = $filter('filter')($scope.checkoutConfig.paymentTypes, {name: existingSavedCard.ccType})[0];
      $scope.checkout.paymentTypeId = $scope.selectedPaymentType.id;
    }

    function validatePlaceOrder() {
      var validationMsgs = [];
      var paymentTypeMethod = $scope.checkout.paymentTypeMethod;
      if (angular.isUndefined(paymentTypeMethod) || paymentTypeMethod === null) {
        validationMsgs.push('A payment method must be selected.');
      }
      if (!$scope.orderResponse.orderItems.length) {
        validationMsgs.push('There are no items in the shopping cart.');
      }
      if (authService.getCustomerAuthToken() === null) {
        validationMsgs.push('A customer must be selected.');
      }
      if (authService.getRestaurantId() === null) {
        validationMsgs.push('A store must be selected.');
      }
      // on service type selection we are starting order
      if (authService.getOrderId === null) {
        validationMsgs.push('A service type must be selected');
      }
      if ($scope.isPickupSelected && !angular.isDate($scope.store.pickupDate)) {
        validationMsgs.push('A valid date and time must be selected for pickup.');
      }
      if ($scope.dnisResponse.IsOnline === false) {
        validationMsgs.push('! Store offline.');
      }
      // enable if there is a requirement to validate tip
      /*if($scope.restaurant.tipEnabled && $scope.orderResponse.tip === 0.0) {
       validations.push('A tip entry must be completed.');
       }*/
      return validationMsgs;
    }
  });
