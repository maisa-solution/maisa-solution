/*
* API returning datetime as '/Date(1449090240000-0500)/'
* this filter humanizes api returned string into datetime in given format
* */
'use strict';
angular.module('callcenterApp').filter('humanizeApiDateTime', HumanizeApiDateTime);
HumanizeApiDateTime.$inject = [
  '$filter'
];
function HumanizeApiDateTime($filter) {
  /**
   * @param apiTimeStamp (as string)
   * @param format (optional)
   */
  return function(apiTimeStamp, format) {
    format = typeof format !== 'undefined' ? format : 'MM-dd-yyyy hh:mm a';
    // apiDateTimeStamp looks like '/Date(1449090240000-0500)/'
    // Regular Expression to get a string between parentheses
    var regExp = /\(([^)]+)\)/;
    var timeAndOffsetStr = regExp.exec(apiTimeStamp)[1]; //ex: 1449090240000-0500
    // split string at 13 chars to get both unix time stamp and offset
    var timeAndOffsetArray = timeAndOffsetStr.match(/.{1,13}/g); //ex: ['1449090240000','0500']
    var timeStamp = timeAndOffsetArray[0];
    var offset = timeAndOffsetArray[1];
    return $filter('date')(timeStamp, format, offset);
  };
}
