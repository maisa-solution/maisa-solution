'use strict';

angular.module('callcenterApp').controller('StoreController',
  function ($scope, $filter, $timeout, $log, dnisResponseService, commonFactory, $mdDialog, errorService,
            spinnerService, storeService, storeLookupService) {
    var i, j;

    $scope.moveToNextTab = moveToNextTab;
    $scope.filterHolidays = filterHolidays;
    $scope.savePickUpTime = savePickUpTime;

    // GET delivery mode configuration if order is started
    $scope.$on('broadcastDeliveryConfiguration', handleDeliveryModeConfiguration);

    // display alert when selected tab is store and service type not supported by restaurant
    $scope.$on('broadcastSelectedTab', handleServiceTypeSupportForStore);

    $scope.holidays = [];
    $scope.restaurantId = '';
    if ($scope.dnisResponse) {
      $scope.holidays = $scope.dnisResponse.StoreHours.Holidays;
      $scope.restaurantId = $scope.dnisResponse.Restaurant.restaurantId;
    }

    if ($scope.store) {
      $scope.store.pickupDate = new Date();
      $scope.minDate = new Date(
        $scope.store.pickupDate.getFullYear(),
        $scope.store.pickupDate.getMonth(),
        $scope.store.pickupDate.getDate()
      );

      $scope.maxDate = storeService.getMaxDate();
      $scope.store.pickupDate = storeService.getPickupDate();
      $scope.minDate = storeService.getMinDate();
      $scope.store.pickupTime = storeService.getPickupTime();
    }
    $scope.timeArray = [];
    $scope.timeDisplay = {};
    storeService.setStoreItems($scope.store);

    function initTimeArray() {
      var time = '';
      var name = '';
      var timeObject = {};
      for (i = 0; i < 13; i++) {
        if (i !== 12) {
          for (j = 0; j < 4; j++) {
            time = i + ':' + (j === 0 ? '00' : 15 * j) + ' AM';
            name = '';
            if (time === '0:00 AM') {
              name = 'Mid night';
            } else {
              name = time;
            }
            timeObject = {name: name, value: time};
            $scope.timeArray.push(timeObject);
          }
        } else {
          for (j = 0; j < 4; j++) {
            time = i + ':' + (j === 0 ? '00' : 15 * j) + ' PM';
            name = '';
            if (time === '12:00 PM') {
              name = 'Noon';
            } else {
              name = time;
            }
            timeObject = {name: name, value: time};
            $scope.timeArray.push(timeObject);
          }
        }
      }
      for (i = 1; i < 12; i++) {
        for (j = 0; j < 4; j++) {
          time = i + ':' + (j === 0 ? '00' : 15 * j) + ' PM';
          name = '';
          if (time === '12:00 PM') {
            name = 'Noon';
          } else {
            name = time;
          }
          timeObject = {name: name, value: time};
          $scope.timeArray.push(timeObject);
        }
      }
    }

    initTimeArray();

    function moveToNextTab() {
      $scope.changeTab(2);
      $scope.showPanel(2);
    }

    function handleDeliveryModeConfiguration() {
      var deliveryConfigMode = 0; // default to pickup
      if ($scope.isDeliverySelected) {
        deliveryConfigMode = 1;
      }
      if ($scope.isCurbsideSelected) {
        deliveryConfigMode = 2;
      }
      //TODO createDeliveryModeConfig and getGetDeliveryModeConfig by passing address/car details to API
      var storeInfoPromise = storeService.getDeliveryModeConfiguration(deliveryConfigMode,
        $scope.dnisResponse.UTCTimeOffset);

      if (storeInfoPromise) {
        storeInfoPromise.then(function (resp) {
          $scope.maxDate = storeService.getMaxDate();
          $scope.store.pickupDate = storeService.getPickupDate();
          $scope.minDate = storeService.getMinDate();
          $scope.store.pickupTime = storeService.getPickupTime();
          // push pickupTime to timeArray if not exists in list
          var timeExists = $filter('filter')($scope.timeArray, {value: $scope.store.pickupTime})[0];
          if (angular.isUndefined(timeExists)) {
            $scope.timeArray.push({name: $scope.store.pickupTime, value: $scope.store.pickupTime});
          }
        }).catch(function (error) {
          errorService.displayError(error);
        });
      }
    }

    function filterHolidays(date) {
      var isDateTobeFiltered = true;
      var i;

      for (i = 0; i < $scope.holidays.length; i++) {
        var holidayDate = $scope.holidays[i].CalendarDate;
        var subStrdate = holidayDate.substring(8, 10).replace('T', '');

        holidayDate = new Date(holidayDate.substring(0, 4), holidayDate.substring(5, 7) - 1, subStrdate);
        if (date.getTime() === holidayDate.getTime()) {
          isDateTobeFiltered = false;
          break;
        }
      }
      return isDateTobeFiltered;
    }

    $scope.changeStore = function (ev) {
      $mdDialog.show({
        locals: {
          address1: $scope.restaurant.address1,
          city: $scope.restaurant.city,
          state: $scope.restaurant.state,
          postalCode: $scope.restaurant.postalCode
        },
        templateUrl: 'views/store/store_lookup.html',
        parent: angular.element(document.body),
        clickOutsideToClose: false,
        bindToController: true,
        controllerAs: 'vm',
        targetEvent: ev,
        controller: storeLookupService.getStores
      });
    };

    // check if restaurant supporting agent selected service type
    function handleServiceTypeSupportForStore() {
      $scope.selectedTab = commonFactory.selectedTab;
      if ($scope.selectedTab === 1) {
        var showDialog = false;
        var serviceType;
        var restaurantName = $scope.restaurant.unitName;
        if (!$scope.isPickupAvailable && $scope.isPickupSelected) {
          showDialog = true;
          serviceType = 'Pickup';
        } else if (!$scope.isCurbsideAvailable && $scope.isCurbsideSelected) {
          showDialog = true;
          serviceType = 'Curbside';
        } else if (!$scope.isDeliveryAvailable && $scope.isDeliverySelected) {
          showDialog = true;
          serviceType = 'Delivery';
          // TODO check if user selected delivery address supporting a restaurant by calling api
        }
        if (showDialog) {
          // TODO bind to controller and use 'controllerAs' vm etc..(currently unable to change tabs if we follow same)
          $mdDialog.show({
            templateUrl: 'views/store/unsupported-service-type.html',
            parent: angular.element(document.body),
            locals: {
              restaurantName: restaurantName,
              serviceType: serviceType,
              isPickupAvailable: $scope.isPickupAvailable,
              isCurbsideAvailable: $scope.isCurbsideAvailable,
              isDeliveryAvailable: $scope.isDeliveryAvailable
            },
            clickOutsideToClose: false,
            scope: $scope,
            preserveScope: true,
            controller: function DialogController($scope, $mdDialog, restaurantName, serviceType) {
              $scope.restaurantName = restaurantName;
              $scope.serviceType = serviceType;
              $scope.close = function (ev) {
                $mdDialog.hide();
                $timeout(function () {
                  $scope.changeStore(ev);
                }, 500);
              };
              $scope.switchTab = function (tabIndex) {
                $mdDialog.hide();
                $timeout(function () {
                  $scope.changeTab(tabIndex);
                }, 500);
              };
            }
          });
        }
      }
    }

    // This is to save the pickup time after changing in Store tab
    function savePickUpTime(store) {

      var deliveryConfigMode = 0; // default to pickup
      if ($scope.isPickupSelected) {
        deliveryConfigMode = 0;
      }
      if ($scope.isDeliverySelected) {
        deliveryConfigMode = 1;
      }
      if ($scope.isCurbsideSelected) {
        deliveryConfigMode = 2;
      }

      var estimateArrivalTimeString = $filter('date')(store.pickupDate, 'yyyy-MM-dd');
      var pickUpDateTime = new Date('' + estimateArrivalTimeString + ' ' + store.pickupTime + '' +
        $scope.dnisResponse.UTCTimeOffset).getTime();
      var estimateArrivalTime = $filter('date')(pickUpDateTime, 'yyyy-MM-dd HH:mm:ss',
        $scope.dnisResponse.UTCTimeOffset);

      var saveStoreInfoPromise = storeService.saveDeliveryPickUpInformation(deliveryConfigMode,
        $scope.dnisResponse.UTCTimeOffset, pickUpDateTime, store.pickupTime);

      if (saveStoreInfoPromise) {
        spinnerService.show();
        saveStoreInfoPromise.then(function (resp) {
          spinnerService.hide();
          $mdDialog.show(
            $mdDialog.alert()
              .clickOutsideToClose(false)
              .title('Info')
              .textContent('Store date has been saved successfully')
              .ariaLabel('Save Info')
              .ok('Close')
          );
        }).catch(function (error) {
          errorService.displayError(error || 'Unable to save pickup time.');
        });
      }
    }

  }
);
