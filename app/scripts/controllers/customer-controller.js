'use strict';

// TODO break this controller up into manageable services and separate controller files
angular.module('callcenterApp').controller('CustomerController',
  function($scope, $log, $sce, $q, $filter, $location, $window, $timeout, $anchorScroll, $mdDialog, $mdMedia, // jshint ignore:line
           authService, $rootScope, httpService, commonFactory, dnisResponseService, sharedProperties, customerService,
           listService, errorService, spinnerService, orderService, restMenuService) {

    // get restaurant data from service
    $scope.dnisResponse = dnisResponseService.getData();
    // this function has to execute first, if no dnis-data redirect to begincallscreen form
    if (angular.isUndefined($scope.dnisResponse)) {
      $location.path('/begincallscreen');
      return;
    }
    $scope.init = init;
    $scope.pickup = pickup;
    $scope.changeTab = changeTab;
    $scope.changeTabCurbsideCar = changeTabCurbsideCar;
    $scope.changeTabDelivery = changeTabDelivery;
    $scope.showPanel = showPanel;
    $scope.displayScriptInfo = displayScriptInfo;
    $scope.displayAdditionalInfo = displayAdditionalInfo;
    $scope.curbside = curbside;
    $scope.selectCar = selectCar;
    $scope.editCar = editCar;
    $scope.addCar = addCar;
    $scope.delivery = delivery;
    $scope.selectDeliveryAddress = selectDeliveryAddress;
    $scope.editDeliverAddress = editDeliverAddress;
    $scope.addDeliveryAddress = addDeliveryAddress;
    $scope.changeCustomer = changeCustomer;
    $scope.getCustomersApi = getCustomersApi;
    $scope.submitCustomerInfo = submitCustomerInfo;
    $scope.shouldShowCustomerFab = shouldShowCustomerFab;
    $scope.resetAllServiceTypes = resetAllServiceTypes;
    $scope.fetchCustomerPreviousOrders = fetchCustomerPreviousOrders;
    $scope.commonFactory = commonFactory;
    $scope.selectedTab = 0;

    $scope.$on('handleBroadCast', handleBroadCast);
    $scope.$on('broadCastSaveChanges', broadCastSaveChanges);
    $scope.$on('broadcastOrderResponse', broadcastOrderResponse);
    $scope.$on('broadcastSelectedTab', broadcastSelectedTab);
    // watch orderStatus to disable other tabs except disposition when order placed or cancelled
    $scope.$on('broadCastOrderedStatus', broadCastOrderedStatus);
    // update serviceType i.e isPickupSelected etc with PreviousOrder when its a reOrder
    $scope.$on('broadcastReorderServiceType', broadcastReorderServiceType);
    // update restaurant info when agent changes store from look up search or when selects reOrder
    $scope.$on('broadcastStoreChange', handleStoreChange);

    $rootScope.isCallStarted = authService.getCallStarted();
    $scope.isLeftNavDisplayed = true;
    $scope.isRightNavDisplayed = false;
    $scope.callAssociatedToId = '';
    $scope.isStartCallApiInvoked = false;
    $scope.searchSubmitted = false;
    $scope.showFloatingRaiseBtn = false;
    $scope.storeTabUrl = 'views/store/store.html';
    $scope.menuTabUrl = 'views/menu/menu.html';
    $scope.checkoutTabUrl = 'views/checkout/checkout.html';
    $scope.master = {};
    $scope.parent = {};
    $scope.parent.selectedTab = 0;
    $scope.store = {};
    $scope.disableTab = false;
    $scope.$mdMedia = $mdMedia;
    // add customer default information
    $scope.customer = {
      dfirstName: 'Customer', dlastName: 'TBD'
    };

    $scope.dispositionTabUrl = 'views/disposition/index.html';
    $scope.isOrderStarted = false;
    $scope.orderResponse = {};

    var restaurant = $scope.dnisResponse.Restaurant;
    $scope.restaurant = restaurant;
    $scope.ani = authService.getAni(); // '0000000000'

    // to parse the script and insert HTML line breaks <BR> for every carriage return
    $scope.restaurantScript = $sce.trustAsHtml($scope.dnisResponse.Script);

    // fetch Service types if deliveryMode=> 0=Pickup ,1=Delivery ,2=Curbsideb
    $scope.isPickupAvailable = false;
    $scope.isDeliveryAvailable = false;
    $scope.isCurbsideAvailable = false;

    $scope.isCurbsideSelected = false;
    $scope.isDeliverySelected = false;
    $scope.isPickupSelected = false;
    // update below when agent selects customer delivery address/ car
    //TODO and send the details to deliveryModeConfiguration API
    $scope.deliveryAddressDetails = null;
    $scope.carDetails = null;

    $scope.serviceTypes = []; // fill in left panel with ng-repeat
    angular.forEach(restaurant.deliveryModeOptions, function(option) {
      switch (option.deliveryMode) {
        case 0:
          $scope.serviceTypes.push('Pickup');
          $scope.isPickupAvailable = true;
          break;
        case 1:
          $scope.serviceTypes.push('Delivery');
          $scope.isDeliveryAvailable = true;
          break;
        case 2:
          $scope.serviceTypes.push('Curbside');
          $scope.isCurbsideAvailable = true;
          break;
      }
    });

    $scope.pickupHours = [];
    $scope.deliveryHours = [];
    // if RestaurantHoursTypeId = 1 then it is pickup hours
    // if RestaurantHoursTypeId = 3 then it is Delivery hours
    // if RestaurantHoursTypeId = 4 then it is Store hours
    angular.forEach($scope.dnisResponse.StoreHours.Hours, function(hours) {
      if (angular.equals(hours.RestaurantHoursTypeId, 1)) {
        $scope.pickupHours = hours.Times;
      } else if (angular.equals(hours.RestaurantHoursTypeId, 3)) {
        $scope.deliveryHours = hours.Times;
      }
    });

    $rootScope.restaurantConceptName = restaurant.conceptName;
    // Start timer from 00:00
    $rootScope.startTimer = false;
    $rootScope.$broadcast('timer-start');
    $rootScope.startTimer = true;

    $scope.arrow_icon = 'assets/arrow_down.svg';
    $scope.isContentDisplayed = true;
    $scope.ai_arrow_icon = 'assets/arrow_down.svg';
    $scope.isAdditionalContentDisplayed = true;

    $scope.curbsideCars = {};
    $scope.selectedCarIndex = -1;
    $scope.selectedDeliveryAddrIndex = -1;

    /**
     * @param isClicked
     */
    function displayScriptInfo(isClicked) {
      $scope.isContentDisplayed = isClicked ? false : true;
      $scope.isInfoDisplayed = isClicked ? false : true;
      $scope.arrow_icon = isClicked ? 'assets/arrow_up.svg' : 'assets/arrow_down.svg';
    }

    /**
     * @param isClicked
     */
    function displayAdditionalInfo(isClicked) {
      $scope.isAdditionalContentDisplayed = isClicked ? false : true;
      $scope.isAdditionalInfoDisplayed = isClicked ? false : true;
      $scope.ai_arrow_icon = isClicked ? 'assets/arrow_up.svg' : 'assets/arrow_down.svg';
    }

    /**
     * @param tabIndex
     */
    function changeTab(tabIndex) {
      commonFactory.prepSelectedTabForBroadcast(tabIndex);
      $scope.parent.selectedTab = tabIndex;
      /*if (tabIndex === 0) {
       $scope.pickup(true);
       }*/
    }

    /**
     * @param tabIndex
     */
    function changeTabCurbsideCar(tabIndex) {
      commonFactory.prepSelectedTabForBroadcast(tabIndex);
      $scope.parent.selectedTab = tabIndex;
      $scope.curbside(true, $scope.customer);
      $anchorScroll('serviceTypeBtns');
    }

    /**
     * @param tabIndex
     */
    function changeTabDelivery(tabIndex) {
      commonFactory.prepSelectedTabForBroadcast(tabIndex);
      $scope.parent.selectedTab = tabIndex;
      $scope.delivery(true);
      $anchorScroll('serviceTypeBtns');
    }

    function showPanel(tabIndex) {
      commonFactory.prepSelectedTabForBroadcast(tabIndex);
      $scope.selectedTab = tabIndex;
      //TODO refactor below
      if (tabIndex === 2 || tabIndex === 3 || tabIndex === 4 || $scope.custTabVisited || $scope.storeTabVisited) {
        commonFactory.isRightClicked = true;
        commonFactory.prepareForBroadCast('tab', 'right', true);
        $scope.$parent.custTabVisited = true;
        $scope.$parent.storeTabVisited = true;
      } else {
        commonFactory.isRightClicked = false;
        commonFactory.prepareForBroadCast('tab', 'right', false);
      }
      // If navigating back to customer tab and an order type is already selected, re-enable the FAB
      if (tabIndex === 0 &&
          ($scope.isCurbsideSelected || $scope.isPickupSelected  || $scope.isDeliverySelected)) {
        $scope.showFloatingRaiseBtn = true;
      }
      // if agent selected curbside or delivery serviceType and without providing details and switch to other other tabs
      // then show a alert dialog Car/DeliveryAddress details are must
      if (tabIndex === 1 || tabIndex === 2 || tabIndex === 3) {
        var showDialog = false;
        var msg = 'You must add/edit or select a ';
        if ($scope.isCurbsideSelected && !$scope.carDetails) {
          showDialog = true;
          msg += 'car';
        } else if ($scope.isDeliverySelected && !$scope.deliveryAddressDetails) {
          showDialog = true;
          msg += 'delivery address';
        }
        if (showDialog) {
          $mdDialog.show({
            locals: { msg: msg },
            templateUrl: 'views/alerts/delivery-or-car-details-must.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false,
            bindToController: true,
            controllerAs: 'vm',
            controller: customerService.validateServiceTypeDetails
          });
        }
      }
    }

    function handleBroadCast() {
      $log.debug('right:' + commonFactory.isRightClicked + '  :Left:' + commonFactory.isLeftClicked);
      $scope.isLeftNavDisplayed = commonFactory.isLeftClicked;
      $scope.isRightNavDisplayed = commonFactory.isRightClicked;
    }

    function broadCastSaveChanges() {
      $scope.selectedCarIndex = sharedProperties.getSelectedCardIndex();
      $log.debug('handle card index: ' + $scope.selectedCarIndex);
    }

    // get orderResponse
    function broadcastOrderResponse() {
      $scope.orderResponse = commonFactory.orderResponse;
    }

    function broadcastSelectedTab() {
      $scope.selectedTab = commonFactory.selectedTab;
      //TODO refactor .parent using (handle selectedTab in a good way)
      $scope.parent.selectedTab = commonFactory.selectedTab;
      // If navigating back to customer tab and an order type is already selected, re-enable the FAB
      if ($scope.selectedTab === 0 &&
        ($scope.isCurbsideSelected || $scope.isPickupSelected || $scope.isDeliverySelected)) {
        $scope.showFloatingRaiseBtn = true;
      } else if ($scope.selectedTab !== 0) {
        $scope.showFloatingRaiseBtn = false;
      }
    }

    function broadCastOrderedStatus() {
      $scope.orderStatus = commonFactory.orderStatus;
      $scope.disableTab = true;
    }

    function broadcastReorderServiceType() {
      var deliveryType = commonFactory.deliveryType;
      switch (deliveryType) {
        case 0:
          $scope.isPickupSelected = true;
          break;
        case 1:
          $scope.isDeliverySelected = true;
          break;
        case 2:
          $scope.isCurbsideSelected = true;
          break;
      }
    }

    function handleStoreChange() {
      var restaurantId = commonFactory.restaurantId;
      var promoPromise = restMenuService.getRestaurantById(restaurantId);
      promoPromise.then(function(response) {
        // update session info of restaurant
        $scope.restaurant = response.data.restaurant;
        authService.setRestaurantId($scope.restaurant.restaurantId);
        authService.setConceptId($scope.restaurant.conceptId);
        // get delivery configuration
        commonFactory.prepDeliveryConfigurationForBroadcast();
        // get checkout configuration for changed store
        commonFactory.prepCheckoutConfigurationForBroadcast();
        // get suggestive sales for changed store
        commonFactory.prepSuggestiveSalesForBroadcast();
      }).catch(function(error) {
        errorService.displayError(error);
      });
    }

    /*******************************       PICKUP  *********************--------------------------------------- -----*/
    function pickup(isValid) {
      $scope.submitted = true;

      $scope.loginResponse = [{}];
      if (isValid) {
        $scope.isDeliverySelected = false;
        $scope.isCurbsideSelected = false;
        $scope.isPickupSelected = true;
        $scope.showFloatingRaiseBtn = true;

        spinnerService.show(); // show progress circular
        // create/update customer and get customer info then associate call to customer if not yet
        var customerPromise = customerService.getCustomer($scope.customer);
        customerPromise.then(
          function(resp) {
            // set customer
            $scope.customer = resp.data.Customer;
            $scope.customer.isNew = false;
            //$scope.deliveryAddresses =  $scope.customer.Addresses;
            spinnerService.hide(); // close progress circular
            // associate call to customer if not yet based on CustomerId
            associateCallToCustomer();
          },
          function(error) {
            errorService.displayError(error);
          });
      }
    }

    /*******************************      END PICKUP  *********************--------------------------------------- ---*/

    /*******************************       CURBSIDE  *********************--------------------------------------- -----*/

    // get customerCars by promise ..
    function getCustomerCars(customerId) {
      customerService.getCars(customerId).then(function(carResponse) {
        $scope.curbsideCars = carResponse.data.Cars;
        spinnerService.hide(); //cl
      }).catch(function(error) {
        errorService.displayError(error);
      });
    }

    /**
     * @param isValid
     * @param customer
     */
    function curbside(isValid, customer) {
      $scope.submitted = true;
      $scope.loginResponse = [{}];
      if (isValid) {
        $scope.isCurbsideSelected = true;
        $scope.isDeliverySelected = false;
        $scope.isPickupSelected = false;
        $scope.showFloatingRaiseBtn = true;
        $timeout(function() {
          $anchorScroll('curbsideCarSection');
        }, 100);

        spinnerService.show(); // show progress circular
        // create/update customer and get customer info then associate call to customer if not yet
        var customerPromise = customerService.getCustomer($scope.customer);
        customerPromise.then(
          function(customerResponse) {
            // set customer
            $scope.customer = customerResponse.data.Customer;
            $scope.customer.isNew = false;
            // get CarsInformation and inject
            getCustomerCars($scope.customer.Id);
            // associate call to customer if not yet based on CustomerId
            associateCallToCustomer();
          },
          function(error) {
            errorService.displayError(error);
          });
      }
    }

    /**
     * @param $index index of car that was selected
     */
    function selectCar($index, car) {
      $scope.selectedCarIndex = $index;
      $scope.carDetails = car;
      // broadcast delivery configuration to get delivery info for selected car details
      commonFactory.prepDeliveryConfigurationForBroadcast();
    }

    $scope.isSaveChangesClicked = false;

    /**
     * @param $index index of car to edit
     * @param car
     * @param ev
     */
    function editCar($index, car, ev) {
      $scope.selectedCar = {
        'Id': car.Id, CustomerId: car.CustomerId, 'make_and_model': car.CarModel,
        'color': car.CarColor
      };

      $mdDialog.show({
        controller: EditCarController,
        templateUrl: 'views/editcar.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        locals: {selectedCar: $scope.selectedCar, selectIndex: $index},
      });
    }

    function addCar(ev, curbsideCars) {
      $mdDialog.show({
        controller: AddCarController,
        templateUrl: 'views/add_car.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        locals: {carIndex: curbsideCars.length}
      });
    }

    /**
     * @param $scope
     * @param $mdDialog
     * @param carIndex
     * @constructor
     */
    function AddCarController($scope, $mdDialog, carIndex) {
      $scope.submitted = false;
      $scope.hide = function() {
        $log.debug('Add car dialog closed.');
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $log.debug('Add car dialog canceled.');
        $mdDialog.cancel();
      };
      $scope.addCar = function(ev, isValid, addCarForm) {
        $scope.submitted = true;
        $scope.customerId = authService.getCustomerId();
        if (isValid) {
          var addeCarsRelativeUrl = '/customers/' + $scope.customerId + '/cars/';
          var requestData = {
            'Car': {
              'CarColor': addCarForm.color,
              'CarModel': addCarForm.makeandmodel
            }
          };
          var headers = {'authToken': authService.getAuthKey()};
          httpService._getHttpResult('POST', headers, addeCarsRelativeUrl, requestData).then(function(resp) {
            getCustomerCars($scope.customerId);
            $log.debug('carIndex:' + carIndex);
            sharedProperties.setSelectedCardIndex(carIndex);
            commonFactory.editChangesForBroadCast(true);
            $scope.cancel();
          }).catch(function(error) {
            errorService.displayError(error);
          });
        }
      };
    }

    /**
     * @param $scope
     * @param $mdDialog
     * @param selectedCar
     * @constructor
     */
    function DeleteCarController($scope, $mdDialog, selectedCar) {
      $scope.makeandmodel = selectedCar.make_and_model;
      $scope.color = selectedCar.color;
      $scope.hide = function() {
        $log.debug('Delete car dialog closed.');
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $log.debug('Delete car dialog canceled.');
        $mdDialog.cancel();
      };
      $scope.deleteCar = function() {
        var deleteCarsRelativeUrl = '/customers/' + selectedCar.CustomerId + '/cars/' + selectedCar.Id + '';
        var requestData = '';
        var headers = {'authToken': authService.getAuthKey()};
        httpService._getHttpResult('DELETE', headers, deleteCarsRelativeUrl, requestData).then(function(resp) {
          getCustomerCars(selectedCar.CustomerId);
          $scope.cancel();
        }).catch(function(error) {
          errorService.displayError(error);
        });
      };
    }

    /**
     * @param $scope
     * @param $mdDialog
     * @param selectedCar
     * @param selectIndex
     * @constructor
     */
    function EditCarController($scope, $mdDialog, selectedCar, selectIndex) {
      $scope.submitted = false;
      $scope.editCar = {};
      $scope.editCar.makeandmodel = selectedCar.make_and_model;
      $scope.editCar.color = selectedCar.color;
      $scope.hide = function() {
        $log.debug('Edit car dialog closed.');
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $log.debug('Edit car dialog canceled.');
        $mdDialog.cancel();
      };
      $scope.saveChanges = function(ev, isValid, editCar) {
        $scope.submitted = true;
        if (isValid) {
          var updateCarsRelativeUrl = '/customers/' + selectedCar.CustomerId + '/cars/' + selectedCar.Id + '';
          var requestData = {
            'Car': {
              'CarColor': editCar.color,
              'CarModel': editCar.makeandmodel
            }
          };
          var headers = {'authToken': authService.getAuthKey()};
          httpService._getHttpResult('PUT', headers, updateCarsRelativeUrl, requestData).then(function(resp) {
            sharedProperties.setSelectedCardIndex(selectIndex);
            commonFactory.editChangesForBroadCast(true);

            getCustomerCars(selectedCar.CustomerId);
            $scope.carDetails = requestData; //TODO replace with response returns

            $scope.cancel();
          }).catch(function(error) {
            errorService.displayError(error);
          });
        }
      };
      $scope.submitted = false;
      //Delete car
      $scope.deleteCar = function(ev) {
        $mdDialog.show({
          controller: DeleteCarController,
          templateUrl: 'views/cardeleteconfirm.html',
          locals: {selectedCar: selectedCar}
        });
      };
    }

    /***********************END DELIVERY ********************* ******-------------------------------------------------*/

    /***************************************** DELIVERY ***********--------------------------------------------------*/
    function delivery(isValid) {
      $scope.submitted = true;
      $scope.loginResponse = [{}];
      $scope.selectedDeliveryAddrIndex = -1; // Whatever the default selected index is, use -1 for no selection=false;
      if (isValid) {
        $scope.isDeliverySelected = true;
        $scope.isCurbsideSelected = false;
        $scope.isPickupSelected = false;
        $scope.showFloatingRaiseBtn = true;
        $timeout(function() {
          $anchorScroll('deliveryAddressSection');
        }, 100);

        spinnerService.show(); // show progress circular
        // create/update customer and get customer info then associate call to customer if not yet
        customerService.getCustomer($scope.customer).then(function(resp) {
          // set customer
          $scope.customer = resp.data.Customer;
          $scope.customer.isNew = false;
          $scope.deliveryAddresses = $scope.customer.Addresses;
          spinnerService.hide(); // close progress circular

          // associate call to customer if not yet based on CustomerId
          associateCallToCustomer();
        }).catch(function(error) {
          errorService.displayError(error);
        });
      }
    }

    /**
     * @param $index index of delivery address that was selected
     */
    function selectDeliveryAddress($index, deliveryAddress) {
      $scope.selectedDeliveryAddrIndex = $index;
      $scope.deliveryAddressDetails = deliveryAddress;
      // broadcast delivery configuration to get delivery info for selected address
      commonFactory.prepDeliveryConfigurationForBroadcast();
    }

    /**
     * @param $index index of delivery address to edit
     * @param address
     * @param ev
     * @param customer
     */
    function editDeliverAddress($index, address, ev, customer) {
      // $scope.selectedDeliveryAddrIndex = $index; // uncomment if card to be selected
      $scope.address = address;
      $scope.customer = customer;

      spinnerService.show();
      // get states and address
      var statesPromise = listService.getStates($scope.customer);
      var addressTypePromise = listService.getAddressTypes($scope.customer);
      $q.all({states: statesPromise, addressTypes: addressTypePromise}).then(function(results) {
        $scope.states = results.states;
        $scope.addressTypes = results.addressTypes;
        spinnerService.hide();
        $mdDialog.show({
          locals: {customer: $scope.customer, address: $scope.address},
          scope: $scope,
          preserveScope: true,
          controller: editDeliveryAddressController,
          templateUrl: 'views/delivery/edit_address.html',
          parent: angular.element(document.body),
          targetEvent: ev
        });
      }).catch(function(error) {
        errorService.displayError(error);
      });
    }

    /**
     * @param $index
     * @param ev
     * @param customer
     */
    function addDeliveryAddress($index, ev, customer) {
      $scope.customer = customer;
      $scope.addressTypes = [];
      $scope.address = {};
      spinnerService.show();
      // get states and address
      var statesPromise = listService.getStates($scope.customer);
      var addressTypePromise = listService.getAddressTypes($scope.customer);
      $q.all({states: statesPromise, addressTypes: addressTypePromise}).then(function(results) {
          $scope.states = results.states;
          $scope.addressTypes = results.addressTypes;
          spinnerService.hide();
          $mdDialog.show({
            locals: {customer: $scope.customer, address: $scope.address},
            scope: $scope,
            preserveScope: true,
            controller: addDeliveryAddressController,
            templateUrl: 'views/delivery/add_address.html',
            parent: angular.element(document.body),
            targetEvent: ev
          });
        },
        function(error) {
          errorService.displayError(error);
        });
    }

    /**
     * @param $scope
     * @param $mdDialog
     * @param customer
     * @param address
     */
    function addDeliveryAddressController($scope, $mdDialog, customer, address) {
      $scope.createDeliveryAddress = createDeliveryAddress;
      $scope.customer = customer;
      $scope.address = address;

      $scope.hide = function() {
        $log.debug('Add delivery address dialog closed.');
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $log.debug('Add delivery address dialog canceled.');
        $mdDialog.cancel();
      };
      $scope.submitted = false;

      /**
       * Create Address
       * @param isValid
       */
      function createDeliveryAddress(isValid) {
        $scope.submitted = true;

        if (isValid) {
          $scope.isProcessing = true;
          // get state by user selected Id from states(already in scope)
          var state = $filter('filter')($scope.states, {Id: $scope.address.StateId})[0];
          var addressType = $filter('filter')($scope.addressTypes, {Id: $scope.address.AddressTypeId})[0];

          // TODO remove Country Hard coding below
          $scope.address.Country = {'Id': 223, 'CountryCode': 'US', 'CountryName': 'United States'};
          $scope.address.State = {'Id': state.Id, 'StateCode': state.Code, 'StateName': state.Name};
          $scope.address.AddressType = {'Id': addressType.Id, 'Name': addressType.Name};
          $scope.address['CustomerId'] = $scope.customer.Id;
          // TODO currently hardcoded to customer Phone whatever in customer form
          $scope.address['Phone1'] = $scope.customer.Phone;

          var url = '/customers/' + $scope.customer.Id + '/addresses/';
          var requestData = {
            'Address': $scope.address
          };
          var headers = {'authToken': authService.getAuthKey()};
          httpService._getHttpResult('POST', headers, url, requestData).then(function(resp) {
            // push the newly created address to customer addresses
            $scope.deliveryAddresses.push(resp.data.Address);
            $scope.isProcessing = false;
            $scope.selectedDeliveryAddrIndex = $scope.deliveryAddresses.indexOf(resp.data.Address);
            $scope.cancel();
          }).catch(function(error) {
            errorService.displayError(error);
          });
        }
      }
    }

    /**
     * @param $scope
     * @param $mdDialog
     * @param customer
     * @param address
     */
    function editDeliveryAddressController($scope, $mdDialog, customer, address) {
      $scope.deleteDeliveryAddressConfirm = deleteDeliveryAddressConfirm;
      $scope.updateDeliveryAddress = updateDeliveryAddress;
      $scope.customer = customer;
      $scope.address = address;

      $scope.hide = function() {
        $log.debug('Edit delivery address dialog closed.');
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $log.debug('Edit delivery address dialog canceled.');
        $mdDialog.cancel();
      };
      $scope.submitted = false;

      /**
       * Delete Address
       * @param ev
       * @param address
       * @param customer
       */
      function deleteDeliveryAddressConfirm(ev, address, customer) {
        $scope.address = address;
        $scope.customer = customer;
        $scope.addressTypeName = $scope.address.Address1;
        $mdDialog.show({
          locals: {
            customer: $scope.customer,
            address: $scope.address,
            addressTypeName: $scope.addressTypeName
          },
          scope: $scope,
          preserveScope: true,
          controller: deleteDeliveryAddressController,
          templateUrl: 'views/delivery/delete_address_confirm.html',
          parent: angular.element(document.body),
          targetEvent: ev
        });
      }

      /**
       * @param isValid
       * @param customer
       * @param address
       */
      function updateDeliveryAddress(isValid, customer, address) {
        $scope.customer = customer;
        $scope.address = address;

        $scope.submitted = true;
        if (isValid) {
          $scope.isProcessing = true;
          // get state by user selected Id from states(already in scope)
          var state = $filter('filter')($scope.states, {Id: $scope.address.StateId})[0];
          var addressType = $filter('filter')($scope.addressTypes, {Id: $scope.address.AddressTypeId})[0];

          //TODO remove Country Hard coding below
          $scope.address.Country = {'Id': 223, 'CountryCode': 'US', 'CountryName': 'United States'};
          $scope.address.State = {'Id': state.Id, 'StateCode': state.Code, 'StateName': state.Name};
          $scope.address.AddressType = {'Id': addressType.Id, 'Name': addressType.Name};
          $scope.address['CustomerId'] = $scope.customer.Id;
          $scope.address['Phone1'] = $scope.customer.Phone;//TODO currently hadrdcoded to customer Phone whatever in customer form

          var url = '/customers/' + $scope.customer.Id + '/addresses/' + $scope.address.Id;
          var requestData = {
            'Address': $scope.address
          };
          var headers = {'authToken': authService.getAuthKey()};
          httpService._getHttpResult('PUT', headers, url, requestData).then(function(resp) {
            // update item in list with changes
            var index = $scope.deliveryAddresses.indexOf(address);
            $scope.deliveryAddresses[index] = resp.data.Address;
            $scope.selectedDeliveryAddrIndex = index;
            $scope.isProcessing = false;
            $scope.deliveryAddressDetails = resp.data.Address;
            $scope.cancel();
          }).catch(function(error) {
            errorService.displayError(error);
          });
        }
      }
    }

    /**
     * @param $scope
     * @param $mdDialog
     * @param customer
     * @param address
     */
    function deleteDeliveryAddressController($scope, $mdDialog, customer, address) {
      $scope.deleteDeliveryAddress = deleteDeliveryAddress;
      $scope.customer = customer;
      $scope.address = address;

      $scope.hide = function() {
        $log.debug('Delete delivery address dialog closed.');
        $mdDialog.hide();
      };

      $scope.cancel = function() {
        $log.debug('Delete delivery address dialog canceled.');
        $mdDialog.cancel();
      };

      function deleteDeliveryAddress() {
        var url = '/customers/' + $scope.customer.Id + '/addresses/' + $scope.address.Id + '';
        var requestData = '';
        var headers = {'authToken': authService.getAuthKey()};

        // remove address from deliveryAddresses and then invoke api it will delete the address asynchronously
        var indexOfDeleting = $scope.deliveryAddresses.indexOf($scope.address);
        $scope.deliveryAddresses.splice(indexOfDeleting, 1);
        $mdDialog.cancel();

        httpService._getHttpResult('DELETE', headers, url, requestData).then(function(resp) {
          $scope.cancel();
        }).catch(function(error) {
          errorService.displayError(error);
        });
      }
    }

    /************************************* END DELIVERY ***********---------------------------------------------------*/

    /**
     * After page load invoke 'Start Call' API
     * @param ev
     * @param dnis
     * @param ani
     */
    function init(ev, dnis, ani) {
      // start call if not yet
      if (!$scope.isStartCallApiInvoked) {
        var requestData = {'Dnis': dnis};
        var headers = {'authToken': authService.getAuthKey()};
        var url = '/' + authService.getCallCenterId() + '/calls/startcall';
        $log.debug('Invoking Start Call API');
        httpService._getHttpResult('POST', headers, url, requestData).then(function(resp) {
          // set callId in session to associate call to customer after
          $scope.isStartCallApiInvoked = true;
          authService.setCallId(resp.data.Call.Id);
        }).catch(function(error) {
          errorService.displayError(error);
        });
      }

      //Get Customers by ANI -------------------------------------------
      $scope.ani = ani;
      $scope.dnis = dnis;
      $scope.searchQuery = ani;
      $scope.evt = ev;

      if (!$scope.dnisResponse) {
        return;
      }
      // show dialog 'Store is not available' and on click of 'OK' get customer's data
      if ($scope.dnisResponse.IsOnline) {
        if ($scope.ani === '0000000000') {
          $scope.customers = [];
          $mdDialog.show({
            scope: $scope,
            preserveScope: true,
            controller: 'CustomerLookupController',
            templateUrl: 'views/customer_lookup/customer_lookup.html',
            parent: angular.element(document.body),
            targetEvent: $scope.evt,
            clickOutsideToClose: false
          });
        } else {
          lookupCustomersByAni();
        }

      } else {
        $mdDialog.show({
          scope: $scope,        // use parent scope in template
          preserveScope: true,
          controller: errorService.getErrorDialogController,
          templateUrl: 'views/alerts/store-is-offline.html',
          parent: angular.element(document.body),
          targetEvent: $scope.evt,
          clickOutsideToClose: false
        }).then(function() {
          lookupCustomersByAni();
        }).catch(function(error) {
          $log.error('Unknown error: ' + error);
          lookupCustomersByAni();
        });
      }
    }

    //-End Of init() ******------------------------------------------------------

    function lookupCustomersByAni() {
      spinnerService.show();
      var aniRelativeUrl = '/customers/' + $scope.ani + '';
      var requestData = {};
      var headers = {'authToken': authService.getAuthKey()};
      httpService._getHttpResult('GET', headers, aniRelativeUrl, requestData).then(function(resp) {
        spinnerService.hide();
        // check if customers exists
        if (angular.isDefined(resp.data.Customers) && resp.data.Customers.length > 0) {
          $scope.customers = resp.data.Customers;
          $mdDialog.show({
            scope: $scope,
            preserveScope: true,
            controller: 'CustomerLookupController',
            templateUrl: 'views/customer_lookup/customer_lookup.html',
            parent: angular.element(document.body),
            targetEvent: $scope.evt,
            clickOutsideToClose: false
          });
        } else {
          $mdDialog.show({
            scope: $scope,
            controller: 'CustomerNotFoundController',
            preserveScope: true,
            templateUrl: 'views/customer_lookup/customers_not_found.html',
            parent: angular.element(document.body),
            targetEvent: $scope.evt,
            clickOutsideToClose: false
          });
        }
      }).catch(function(error) {
        errorService.displayError(error);
      });
    }

    /**
     * @param ani
     * @param customers
     */
    function changeCustomer(ani, customers) {
      $scope.customers = customers;
      $scope.master = angular.copy($scope.customer);
      $scope.ani = ani;
      $scope.searchQuery = ani;
      // Reset Customer info form and set it as a new
      // TODO add below top scope and access it like angular.copy($scope.customer)
      $scope.customer = {
        isNew: true,
        FirstName: '',
        LastName: '',
        Email: '',
        LoyaltyAccountNumber: '',
        Id: null
      };
      // TODO this needing to set the form untouched is the sign of a deeper problem.
      // Fix that so that this is not needed.
      $scope.customerForm.$setPristine();
      $scope.customerForm.$setUntouched();
      // Reset Service type options
      resetAllServiceTypes();

      $mdDialog.show({
        scope: $scope,
        preserveScope: true,
        controller: 'CustomerLookupController',
        templateUrl: 'views/customer_lookup/customer_lookup.html',
        parent: angular.element(document.body),
        clickOutsideToClose: false
      });
    }

    /**
     * @param searchQuery
     * @param page
     * @param limit
     */
    function getCustomersApi(searchQuery, page, limit) {
      var url = '/customers?keyword=' + searchQuery + '&page=' + page + '&size=' + limit + '&sortby=FirstName';
      var requestData = {};
      var headers = {'authToken': authService.getAuthKey()};
      var result = {};
      $scope.loadingCustomers = true;
      httpService._getHttpResult('GET', headers, url, requestData).then(function(resp) {
        result = resp.data;
        $scope.result = resp.data; // update customers data in table
        $scope.customers = $scope.result.Results; // update customers data in table
        $scope.loadingCustomers = false;
      }).catch(function(error) {
        errorService.displayError(error);
      });
    }

    /**
     * When user clicks on floating action button
     */
    function submitCustomerInfo() {
      $scope.showFloatingRaiseBtn = false;
      $scope.parent.selectedTab = 1;
      commonFactory.prepSelectedTabForBroadcast(1);
    }

    // resets buttons to previous state
    function resetAllServiceTypes() {
      $scope.isPickupSelected = false;
      $scope.isCurbsideSelected = false;
      $scope.isDeliverySelected = false;
      $scope.showFloatingRaiseBtn = false;
    }

    var w = angular.element($window);
    $scope.$watch(
      function() {
        return $window.innerHeight;
      },
      function(value) {
        $scope.leftNavHeight = value - 64;
        $scope.rightNavHeight = value - 64;
        $scope.middleHeightSm = value - 64;
        $scope.innerMiddleHeightSm = value - 161;
        $scope.middleHeight = value - 100;
        $scope.innerMiddleHeight = value - 197;
      },
      true
    );

    w.bind('resize', function() {
      $timeout(function() {
        $scope.$apply();
      }, 0, false);
    });

    // Associate call to customer if not yet against the callId(unique callId and CustomerId)
    function associateCallToCustomer() {
      // clear previousOrders(reOrders)
      commonFactory.prepPreviousOrdersForBroadcast([]);
      if ($scope.callAssociatedToId === $scope.customer.Id) {
        // call already associated on 'customer selection' so start Order only
        startOrderIfNotYet();
      } else {
        // associate Call to Customer and startOrder
        var promiseCall = customerService.associateCallToCustomer($scope.customer.Id);
        promiseCall.then(function(resp) {
          $scope.callAssociatedToId = resp.data.Call.CustomerId;
          authService.setCustomerId(resp.data.Call.CustomerId);
          authService.setCustomerAuthToken(resp.data.Call.CustomerSessionToken);
          authService.setCustomerUserId($scope.customer.UserId);
          //start order if not yet and only on service type selection
          startOrderIfNotYet();
        }).catch(function(error) {
          errorService.displayError(error);
        });
      }
    }

    function startOrderIfNotYet() {
      if (!$scope.isOrderStarted) {
        var promiseStartOrder = orderService.startOrder();
        promiseStartOrder.then(function(orderResp) {
          var orderId = orderResp.data.Order.orderid;
          authService.setOrderId(orderId); // set order in session
          // broadcast OrderResponse to available for other controllers
          commonFactory.prepOrderResponseForBroadcast(orderResp.data.Order);
          $scope.isOrderStarted = true;
          // broadcast delivery configuration to get delivery info if it is pickup
          // for delivery and curbside need to handle on selecting a address/car
          commonFactory.prepDeliveryConfigurationForBroadcast();
        }).catch(function(error) {
          errorService.displayError(error);
        });
      }
    }

    function fetchCustomerPreviousOrders() {
      // clear previousOrders of past customer
      commonFactory.prepPreviousOrdersForBroadcast([]);
      var previousOrdersPromise = customerService.getCustomerPreviousOrders($scope.customer);
      previousOrdersPromise.then(function(response) {
        if (response.data.orders.length > 0) {
          // broadcast previous  customer orders to reOrder
          commonFactory.prepPreviousOrdersForBroadcast(response.data.orders);
        }
      }).catch(function(error) {
        errorService.displayError(error);
      }).finally(function() {
        spinnerService.hide();
      });
    }

    /**
     * @returns {boolean} true if the FAB should be visible to suggest moving to the store tab
     * TODO remove $scope.showFloatingRaiseBtn and all of the duplicate logic to keep it in sync
     */
    function shouldShowCustomerFab() {
      if (!$scope.showFloatingRaiseBtn ||
          !$scope.customer.FirstName.length ||
          !$scope.customer.LastName.length ||
          !$scope.customer.Phone.length) {
        return false;
      } else if ($scope.isDeliverySelected) {
        return $scope.selectedDeliveryAddrIndex !== -1;
      } else if ($scope.isCurbsideSelected) {
        return $scope.selectedCarIndex !== -1;
      } else {
        return true;
      }
    }
  });
