'use strict';

angular.module('callcenterApp').controller('MenuController',
  function($rootScope, $scope, $log, $filter, $anchorScroll, $mdDialog, restMenuService, sharedProperties,
           commonFactory, dnisResponseService, errorService, spinnerService, menuService, storeService) {
    $scope.menuGroups = [];
    $scope.menuOrderItems = [];
    $scope.isOrderStarted = false;
    $scope.isMenuItemAvailable = isMenuItemAvailable;
    $scope.pickupTime = storeService.getPickupTime();

    $scope.anchor = function(item) {
      $anchorScroll(item.toString());
    };

    if (dnisResponseService.getData()) {
      $log.debug('dnisResponseService:' + dnisResponseService.getData().CurrentStoreTimeUTC);
    }

    // get orderResponse
    $scope.$on('broadcastOrderResponse', function() {
      $scope.orderResponse = commonFactory.orderResponse;
    });

    if (angular.isDefined($scope.restaurant)) {
      $scope.showItemSpecialInstructions = $scope.restaurant.showWhoFor;

      var promiseGetMenu = restMenuService.getMenu($scope.restaurant.restaurantId);
      promiseGetMenu.then(function(response) {
          $scope.menuGroups = response.data.menuGroups;
        },
        function(error) {
          errorService.displayError(error);
        }
      );
    }

    // execute openModifiers method when requested from checkout-controller's suggestiveSale
    $scope.$on('openMenuItemModifiers', function(event, args) {
      $scope.openModifiers(args.ev, args.restId, args.menuItem);
    });

    // set Menu Items availability based on the store time change
    $scope.$on('broadcastPickUpTime', function() {
      for (var i = 0; i < $scope.menuGroups.length; i++) {
        var menuGroup = $scope.menuGroups[i];
        for (var j = 0; j < menuGroup.menuItems.length; j++) {
          var menuItem = menuGroup.menuItems[j];
          menuItem.isItemAvailable = isMenuItemAvailable(menuItem);
        }
      }
    });

    function isMenuItemAvailable(menuItem) {
      var isItemAvailable = false;
      var currentTimeHours = '';
      var isItemEnabled = false;
      if (angular.isDefined(menuItem.dayParts) && menuItem.dayParts.length) {
        var menuDayParts = menuItem.dayParts;
        currentTimeHours = storeService.formatTo24Hours(storeService.getPickupTime()).substr(0, 2);
        for (var i = 0; i < menuDayParts.length; i++) {
          var startOffset = menuDayParts[i].startOffset;
          startOffset = startOffset % 60 === 0 ? startOffset / 60 : (startOffset + 1) / 60;
          var endOffset = menuDayParts[i].endOffset;
          endOffset = endOffset % 60 === 0 ? endOffset / 60 : (endOffset + 1) / 60;
          $log.debug('currentTimeHours:' + currentTimeHours + ' startOffset:' + startOffset + ' endOffset:' +
            endOffset);
          if (currentTimeHours >= startOffset && currentTimeHours < endOffset) {
            isItemAvailable = true;
            break;
          }
        }
      }
      if (angular.isDefined(menuItem.dayParts) && menuItem.dayParts.length && !isItemAvailable) {
        isItemEnabled = true;
      }
      return isItemEnabled;
    }

    /**
     * Open menu item modifier dialog
     * @param ev event
     * @param restId resource id
     * @param menuItem item to open for customization
     */
    $scope.openModifiers = function(ev, restId, menuItem) {
      $scope.menuItemModifiers = {};
      var menuOrderItem = {
        menuItemId: menuItem.itemId,
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price,
        totalPriceAfterModifiers: menuItem.price,
        instructions: '',
        showInstructions: $scope.showItemSpecialInstructions
      };
      // check if item is available for specified time(against dayParts)

      if (angular.isDefined(menuItem.dayParts) && menuItem.dayParts.length && menuItem.isItemAvailable) {
        // show item is not available dialog
        $mdDialog.show({
          locals: {
            menuItem: menuItem
          },
          controller: errorService.getErrorDialogController,
          bindToController: true,
          templateUrl: 'views/menu/menu_item_not_available.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: false
        });

      } else {
        spinnerService.show();
        var getMenuItemModifiers = restMenuService.getMenuItem(restId, menuItem.itemId);
        $scope.menuOrderItems = sharedProperties.getMenuOrderedItems();
        getMenuItemModifiers.then(function(response) {
            spinnerService.hide();
            $mdDialog.show({
              locals: {
                menuOrderItem: menuOrderItem,
                menuOrderItems: $scope.menuOrderItems,
                addedOrders: null,
                menuItem: angular.copy(response.data),
                isEditForm: false,
                specialInstructionsMaxCharactersAllowed: $scope.restaurant && $scope.restaurant.specialInstructionsMaxCharactersAllowed
              },
              controller: menuService.getMenuModifiersController,
              bindToController: true,
              controllerAs: 'vm',
              templateUrl: 'views/menu/menu_item_modifiers.html',
              parent: angular.element(document.body),
              targetEvent: ev
            });
          },
          function(error) {
            errorService.displayError(error);
          }
        );
      }
    };

    /**
     * Checks if menuItem is added to order.
     * @param menuItemId item to check
     * @returns {boolean} menu item in cart
     */
    $scope.isMenuItemAddedToCart = function(menuItemId) {
      // for better performance check if Item added to cart or not, against $scope.orderResponse.orderItems is best
      // instead of checking against large data i.e menuOrderItems
      if ($scope.orderResponse && $scope.orderResponse.orderItems) {
        var itemInMenuList = $filter('filter')($scope.orderResponse.orderItems, {mainItemId: menuItemId})[0];
        return !!angular.isDefined(itemInMenuList);
      } else {
        return false;
      }
    };
  }
);
