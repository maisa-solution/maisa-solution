'use strict';

angular.module('callcenterApp').service('sharedProperties', function () {
  var gear = '';
  var clickedCurbsideSaveChanges = false;
  var selectedCardIndex = '';
  var menuOrderedItems = [];
  return {
    getGear: function () {
      return gear;
    },
    setGear: function(value) {
      gear = value;
    },
    getClickedCurbsideSaveChanges:function() {
      return clickedCurbsideSaveChanges;
    },
    setClickedCurbsideSaveChanges:function(value) {
      clickedCurbsideSaveChanges = value;
    },
    getSelectedCardIndex:function() {
      return selectedCardIndex;
    },
    setSelectedCardIndex:function(value) {
      selectedCardIndex = value;
    },
    getMenuOrderedItems:function() {
      return menuOrderedItems;
    },
    setMenuOrderedItems:function(value) {
      menuOrderedItems = value;
    }
  };
});
