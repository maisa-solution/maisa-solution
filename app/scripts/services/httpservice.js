'use strict';

angular.module('callcenterApp').service('httpService', function (UrlFactory, $q, $http) {

  this._getHttpResult = function (methodName, headers, relativeUrl, requestData, isRestMenuAPi) {

    var apiUrl = typeof isRestMenuAPi !== 'undefined' ? UrlFactory.getMenuApiUrl(relativeUrl) :
      UrlFactory.getApiUrl(relativeUrl);

    return $http({
      //cache: true,
      method: methodName,
      url: apiUrl,
      headers: headers,
      data: requestData
    }).then(function (response) {
      if (typeof response.data === 'object') {
        return response;
      } else {
        // invalid response
        return $q.reject(response.data);
      }
    }).catch(function (response) {
      var errorMessage = '';
      var responseData = response.data;
      // some api's returning 500 and response as {'Detail': some error text }
      if (!responseData) {
        errorMessage = 'Unknown server error. Please contact the administrator.';
      } else if (angular.isDefined(responseData.Detail)) {
        errorMessage = responseData.Detail;
      } else if (responseData.Errors) {
        if (responseData.Errors.length) {
          angular.forEach(responseData.Errors, function (error) {
            errorMessage += '<br/>' + error.Message;
          });
        }
      } else if (responseData.errorDetails) {
        errorMessage = responseData.errorDetails;
      } else {
        errorMessage = responseData.Message;
      }
      return $q.reject(errorMessage);
    });
  };
});
