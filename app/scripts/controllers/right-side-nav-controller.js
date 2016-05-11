'use strict';

angular.module('callcenterApp')
  .controller('RightSideNavController',
    function ($scope, $timeout, $log, $filter, $mdDialog, $mdToast, sharedProperties, restMenuService, commonFactory,
              authService, errorService, spinnerService, menuService, orderService) {
      $scope.cancel = cancel;
      $scope.checkOut = checkOut;
      $scope.editOrderItem = editOrderItem;
      $scope.reOrder = reOrder;
      $scope.removeItemConfirmation = removeItemConfirmation;
      $scope.orderStatus = '';
      $scope.isRepeatOrder = false;

      $scope.addedOrderedItems = [];
      // added default values because attr is defined checking  is > 0 or not in view properly
      $scope.orderResponse = {
        subtotal: 0, discount: 0, surchargeFee: 0, tax: 0, tip: 0, total: 0, manualTip: 0
      };
      $scope.previousOrders = [];
      $scope.rightNavTemplateUrl = 'views/cart/order_items.html';

      $scope.$on('broadCastOrderedItemsChanges', function () {
        $scope.addedOrderedItems = sharedProperties.getMenuOrderedItems();
      });

      // broadcast orderStatus to available for other controllers
      $scope.$on('broadCastOrderedStatus', function() {
        $scope.orderStatus = commonFactory.orderStatus;
      });

      // get orderResponse
      $scope.$on('broadcastOrderResponse', function() {
        $scope.orderResponse =  commonFactory.orderResponse;
        $scope.rightNavTemplateUrl = 'views/cart/order_items.html';
      });

      // get customer Previous Orders on selection from lookup table
      $scope.$on('broadcastPreviousOrders', function () {
        $scope.previousOrders = commonFactory.previousOrders;
        if ($scope.previousOrders.length > 0) {
          $scope.rightNavTemplateUrl = 'views/cart/previous_orders.html';
          // open right side nav with previous Orders info
          commonFactory.prepareForBroadCast('tab', 'right', true);
        }
      });

      function checkOut() {
        // move to checkout tab
        // TODO watch scope selectedTab and move to 'Checkout' tab
        // TODO do this through a navService and don't use $scope.$parent ever.
        $scope.$parent.changeTab(3);
      }

      function cancel() {
        $log.debug('Menu modifiers dialog canceled.');
        $mdDialog.cancel();
      }

      function reOrder(repeatOrderId, deliveryType, restaurantId) {
        spinnerService.show();
        // update service type information with repeat order info
        commonFactory.prepReorderServiceType(deliveryType);
        var repeatPromise = orderService.repeatOrderFromHistory(repeatOrderId);
        repeatPromise.then(function (orderResp) {
          $scope.isRepeatOrder = true;
          var orderId = orderResp.data.order.orderId;
          authService.setOrderId(orderId); // set order in session
          // broadcast OrderResponse to available for other controllers
          commonFactory.prepOrderResponseForBroadcast(orderResp.data.order);
          //update current restaurant with reOrder restaurant
          commonFactory.prepStoreChange(restaurantId);
          $scope.isOrderStarted = true;
          $timeout(function () {
            $scope.changeTab(3); // switch to 'disposition screen'
          }, 500);
        }).catch(function (error) {
          errorService.displayError(error);
        }).finally(function () {
          spinnerService.hide();
        });
      }

      /**
       * Open dialog for editing the modifiers of an ordered item
       * @param ev event
       * @param orderItem item to edit
       * @param {number} index
       */
      function editOrderItem(ev, orderItem, index) {
        var orderItemToEdit = $filter('filter')($scope.addedOrderedItems, {menuItemId: orderItem.mainItemId})[0];
        if (orderItemToEdit) {
          spinnerService.show();
          var getMenuItemModifiers = restMenuService.getMenuItem(authService.getRestaurantId(), orderItemToEdit.menuItemId);
          getMenuItemModifiers.then(function (response) {
              var menuItem = response.data;
              var menuOrderItem = {
                menuItemId: orderItemToEdit.menuItemId,
                name: orderItemToEdit.name,
                questions: orderItemToEdit.questions,
                quantity: orderItemToEdit.quantity,
                price: menuItem.price,
                totalPriceAfterModifiers: menuItem.price,
                instructions: orderItemToEdit.instructions,
                showInstructions: orderItemToEdit.showInstructions,
                orderItemId: orderItemToEdit.orderItemId
              };

              spinnerService.hide();
              $mdDialog.show({
                locals: {
                  menuOrderItem: menuOrderItem,
                  menuOrderItems: angular.copy(sharedProperties.getMenuOrderedItems()),
                  addedOrders: angular.copy($scope.addedOrderedItems),
                  menuItem: angular.copy(menuItem),
                  isEditForm: true,
                  specialInstructionsMaxCharactersAllowed: $scope.restaurant && $scope.restaurant.specialInstructionsMaxCharactersAllowed,
                  editIndex: index
                },
                controller: menuService.getMenuModifiersController,
                bindToController: true,
                controllerAs: 'vm',
                templateUrl: 'views/menu/menu_item_modifiers.html',
                parent: angular.element(document.body),
                targetEvent: ev
              });
            },
            function (error) {
              errorService.displayError(error);
            }
          );
        } else {
          $log.error('Existing order item not found: ' + orderItem.mainItemId);
        }
      }

      /**
       * @param ev
       * @param orderedItem
       */
      function removeItemConfirmation(ev, orderedItem) {
        $scope.orderedItem = orderedItem;
        $mdDialog.show({
          locals: {orderedItem: orderedItem},
          scope: $scope,
          controller: RemoveItemDialogController,
          preserveScope: true,
          templateUrl: 'views/cart/remove_item.html',
          parent: angular.element(document.body),
          targetEvent: ev
        });
      }

      /**
       * @param $scope
       * @param $mdDialog
       * @param $mdToast
       * @constructor
       */
      function RemoveItemDialogController($scope, $mdDialog, $mdToast) {
        $scope.keepIt = function () {
          $log.debug('Remove item dialog canceled.');
          cancel();
        };

        // TODO keep response of order in scope and broadcast it for subtotal, tip discount etc values
        $scope.removeItemFromCart = function (item) {
          $scope.isProcessing = true;
          var promiseOrderItem = orderService.removeItem(item);
          promiseOrderItem.then(function(orderResp) {
            // remove item price(modifiers+quantity etc) from subtotal
            $scope.addedOrderedItems.subTotal -= item.priceTotal;
            var menuItem =  $filter('filter')($scope.addedOrderedItems, {menuItemId: item.mainItemId})[0];
            $scope.addedOrderedItems.splice($scope.addedOrderedItems.indexOf(menuItem), 1);
            // broadcast OrderResponse to available for other controllers
            commonFactory.prepOrderResponseForBroadcast(orderResp.data.order);
            $scope.isProcessing = false;

            $log.debug('Remove item dialog closed.');
            $mdDialog.hide();

            $mdToast.show(
              $mdToast.simple()
                .textContent(item.itemDescription + ' removed from cart.')
                .position('top right')
                .hideDelay(2000)
            );
          }, function (error) {
            errorService.displayError(error);
          });
        };
      }
    });
