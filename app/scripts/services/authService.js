'use strict';

angular.module('callcenterApp')
  .factory('authService', function (sharedProperties) {
    var userName = '';
    var authKey = null;
    var isCallStarted = false;
    var isLeftClicked = true;
    var isRightClicked = false;
    return {
      getIsLoggedIn: function () {
        return localStorage.getItem('isLoggedIn');
      },
      setIsLoggedIn: function (value) {
        localStorage.setItem('isLoggedIn', value);

        // Clear previous ordered items on login or logout
        sharedProperties.setMenuOrderedItems([]);
      },
      getUserName: function () {
        return localStorage.getItem('userName');
      },
      setUserName: function (value) {
        localStorage.setItem('userName', value);
      },
      setRoleName: function (value) {
        localStorage.setItem('roleName', value);
      },
      getRoleName: function () {
        return localStorage.getItem('roleName');
      },
      setRoleId: function (value) {
        localStorage.setItem('roleId', value);
      },
      getRoleId: function () {
        return localStorage.getItem('roleId');
      },
      getAuthKey: function () {
        return localStorage.getItem('authKey');
      },
      setAuthKey: function (value) {
        localStorage.setItem('authKey', value);
      },
      destroy: function () {
        sessionStorage.clear();
        localStorage.clear();
      },
      getCallStarted: function () {
        return sessionStorage.getItem('isCallStarted');
      },
      setCallStarted: function (value) {
        sessionStorage.setItem('isCallStarted', value);
      },
      getLanguage: function () {
        return sessionStorage.getItem('language');
      },
      setLanguage: function (value) {
        sessionStorage.setItem('language', value);
      },
      getIsLeftClicked: function () {
        return isLeftClicked;
      },
      setIsLeftClicked: function (value) {
        isLeftClicked = value;
      },
      getIsRightClicked: function () {
        return isRightClicked;
      },
      setIsRightClicked: function (value) {
        isRightClicked = value;
      },

      setRestaurantId: function (value) {
        sessionStorage.setItem('restaurantId', value);
      },
      getRestaurantId: function () {
        return sessionStorage.getItem('restaurantId');
      },
      setConceptId: function (value) {
        sessionStorage.setItem('conceptId', value);
      },
      getConceptId: function () {
        return sessionStorage.getItem('conceptId');
      },
      setAni: function (ani) {
        sessionStorage.setItem('ani', ani);
      },
      getAni: function () {
        return sessionStorage.getItem('ani');
      },
      setCallCenterId: function (callCenterId) {
        localStorage.setItem('callCenterId', callCenterId);
      },
      getCallCenterId: function () {
        return localStorage.getItem('callCenterId');
      },
      setCallId: function (callId) {
        sessionStorage.setItem('callId', callId);
      },
      getCallId: function () {
        return sessionStorage.getItem('callId');
      },

      setCustomerId: function (value) {
        sessionStorage.setItem('customerId', value);
      },
      getCustomerId: function () {
        return sessionStorage.getItem('customerId');
      },
      setCustomerAuthToken: function (value) {
        sessionStorage.setItem('customerAuthToken', value);
      },
      getCustomerAuthToken: function () {
        return sessionStorage.getItem('customerAuthToken');
      },
      setCustomerUserId: function (value) {
        sessionStorage.setItem('customerUserId', value);
      },
      getCustomerUserId: function () {
        return sessionStorage.getItem('customerUserId');
      },
      setOrderId: function (orderId) {
        sessionStorage.setItem('orderId', orderId);
      },
      getOrderId: function () {
        return sessionStorage.getItem('orderId');
      }
    };
  });
