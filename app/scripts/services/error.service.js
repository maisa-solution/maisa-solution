'use strict';

angular.module('callcenterApp').service('errorService', ErrorHandler);

ErrorHandler.$inject = ['$log', '$mdDialog'];

function ErrorHandler($log, $mdDialog) {
  return {
    displayError: displayError,
    getErrorDialogController: DialogController
  };

  function showErrorDialog(error) {
    $log.warn('Showing dialog for: ' + error);
    sessionStorage.setItem('errorMessage', error);
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'views/error.html',
      parent: angular.element(document.body)
    });
  }

  function DialogController(scope) {
    scope.errorMessage = sessionStorage.getItem('errorMessage');
    scope.submitted = false;
    scope.menuItem = this.menuItem;
    scope.closeErrorDialog = function () {
      $log.debug('Error dialog closed.');
      $mdDialog.hide();
    };
    scope.cancelErrorDialog = function () {
      $log.debug('Error dialog canceled.');
      $mdDialog.cancel();
    };
  }

  /**
   * @param error message to display to the user
   */
  function displayError(error) {
    showErrorDialog(error);
  }
}
