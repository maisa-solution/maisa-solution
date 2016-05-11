'use strict';

angular.module('callcenterApp').factory('commonFactory', CommonFactory);
CommonFactory.$inject = [
  '$rootScope', 'authService', '$mdSidenav', 'sharedProperties'
];
function CommonFactory($rootScope, authService, $mdSidenav, sharedProperties) {
  var commonFactoryService = {
    isLeftClicked: true,
    isRightClicked: false,
    isSaveChangeClicked: false,
    orderedItems: [],
    orderStatus: '',
    orderResponse: {},
    isOrderStarted: false,
    selectedTab: 0,
    previousOrders: [],
    restaurantId: '',
    deliveryType: 0
  };

  commonFactoryService.prepareForBroadCast = function (isNavClicked, navId, isMenuTabClicked) {
    if (navId === 'right') {
      if (isMenuTabClicked) {
        this.isRightClicked = true;
      } else if (isNavClicked === 'tab') {
        this.isRightClicked = false;
      } else {
        this.isRightClicked = isNavClicked ? false : true;
      }
      authService.setIsRightClicked(this.isRightClicked);
    } else if (navId === 'left') {
      this.isLeftClicked = isNavClicked ? false : true;
      authService.setIsLeftClicked(this.isLeftClicked);
    }
    this.broadCastItem();
  };

  commonFactoryService.toggleForBroadCast = function (navId) {
    if (navId === 'right') {
      commonFactoryService.isRightClicked = true;
      $mdSidenav(navId).toggle();
      authService.setIsRightClicked(this.isRightClicked);
    } else if (navId === 'left') {
      commonFactoryService.isLeftClicked = true;
      $mdSidenav(navId).toggle();
      authService.setIsLeftClicked(this.isLeftClicked);
    }
    this.broadCastItem();
  };

  commonFactoryService.editChangesForBroadCast = function (isSaveClicked) {
    sharedProperties.setClickedCurbsideSaveChanges(isSaveClicked);
    this.broadCastSaveChanges();
  };

  /**
   * Save the ordered items to sharedProperties service and broadcast the changed items.
   * @param orderedItems to save and broadcast
   */
  commonFactoryService.orderedItemsForBroadCast = function (orderedItems) {
    sharedProperties.setMenuOrderedItems(orderedItems);
    this.broadCastOrderedItemsChanges();
  };

  commonFactoryService.broadCastItem = function () {
    $rootScope.$broadcast('handleBroadCast');
  };
  commonFactoryService.broadCastSaveChanges = function () {
    $rootScope.$broadcast('broadCastSaveChanges');
  };
  commonFactoryService.broadCastOrderedItemsChanges = function () {
    $rootScope.$broadcast('broadCastOrderedItemsChanges');
  };

  commonFactoryService.prepOrderStatusForBroadcast = function(val) {
    this.orderStatus = val;
    this.broadcastOrderStatus();
  };

  commonFactoryService.broadcastOrderStatus = function() {
    $rootScope.$broadcast('broadCastOrderedStatus');
  };

  /**
   * Save the order(start order,updateItem,RemoveItem,addItem) response.
   * @param orderData to save and broadcast
   */
  commonFactoryService.prepOrderResponseForBroadcast = function(orderData) {
    this.orderResponse = orderData;
    this.broadcastOrderResponse();
  };
  commonFactoryService.broadcastOrderResponse = function() {
    $rootScope.$broadcast('broadcastOrderResponse');
  };

  //To GET restaurant checkoutConfiguration for order if it is started
  commonFactoryService.prepIsOrderStartedForBroadcast = function() {
    this.isOrderStarted = true;
    this.broadcastIsOrderStarted();
  };
  commonFactoryService.broadcastIsOrderStarted = function() {
    $rootScope.$broadcast('broadcastIsOrderStarted');
  };

  // For curbside, Delivery:
  // CreateDeliveryModeConfiguration and GetDeliveryModeConfiguration when an delivery address/car details updated
  // OR store changed
  commonFactoryService.prepDeliveryConfigurationForBroadcast = function() {
    $rootScope.$broadcast('broadcastDeliveryConfiguration');
  };

  // Get checkoutConfiguration when agent on checkout page OR store changed
  commonFactoryService.prepCheckoutConfigurationForBroadcast = function() {
    $rootScope.$broadcast('broadcastCheckoutConfiguration');
  };

  // GET suggestive sales when new item added/removed to order OR store changed
  commonFactoryService.prepSuggestiveSalesForBroadcast = function() {
    $rootScope.$broadcast('broadcastSuggestiveSales');
  };

  //broadcast currentTab when tab clicks or switch to the tab from other sections
  commonFactoryService.prepSelectedTabForBroadcast = function(val) {
    this.selectedTab = val;
    this.broadcastSelectedTab();
  };
  commonFactoryService.broadcastSelectedTab = function() {
    $rootScope.$broadcast('broadcastSelectedTab');
  };

  commonFactoryService.preferedPickUpTimeForBroadcast = function(storeServiceValue, pickupTime) {
    storeServiceValue.setPickupTime(pickupTime);
    this.broadcastPickUpTime();
  };
  commonFactoryService.broadcastPickUpTime = function() {
    $rootScope.$broadcast('broadcastPickUpTime');
  };

  /**
   * GET customer previous Orders if any, and show in right panel of customer tab to reorder.
   * @param orders to save and broadcast
   */
  commonFactoryService.prepPreviousOrdersForBroadcast = function(orders) {
    this.previousOrders = orders;
    this.broadcastPreviousOrders();
  };
  commonFactoryService.broadcastPreviousOrders = function() {
    $rootScope.$broadcast('broadcastPreviousOrders');
  };

  /**
   * update delivery mode configuration(pickupSelected etc..) when agent wants to reOrder
   * @param deliveryType to save and broadcast
   */
  commonFactoryService.prepReorderServiceType = function(deliveryType) {
    this.deliveryType = deliveryType;
    this.broadcastReorderServiceType();
  };
  commonFactoryService.broadcastReorderServiceType = function() {
    $rootScope.$broadcast('broadcastReorderServiceType');
  };

  /**
   * Update restaurant info if store changed or when reOrder from past
   * @param restaurantId to save and broadcast
   */
  commonFactoryService.prepStoreChange = function(restaurantId) {
    this.restaurantId = restaurantId;
    this.broadcastStoreChange();
  };
  commonFactoryService.broadcastStoreChange = function() {
    $rootScope.$broadcast('broadcastStoreChange');
  };

  return commonFactoryService;
}
