'use strict';

angular.module('callcenterApp').service('menuService', MenuService);

MenuService.$inject = [
  '$log', '$mdDialog', '$filter', '$mdToast', 'commonFactory', 'errorService', 'orderService'
];

function MenuService($log, $mdDialog, $filter, $mdToast, commonFactory, errorService, orderService) {

  return {
    getMenuModifiersController: MenuModifiersController
  };

  function MenuModifiersController() {
    var vm = this;
    var answerId = 0, menuAnswerId;
    var b, c, i, j;

    vm.cancel = cancel;
    vm.addMenuItemToOrder = addMenuItemToOrder;
    vm.addModifierToMenuItemOrder = addModifierToMenuItemOrder;
    vm.addSpecialInstructionsToModifier = addSpecialInstructionsToModifier;
    vm.menuItemDecreaseQuantity = menuItemDecreaseQuantity;
    vm.menuItemIncreaseQuantity = menuItemIncreaseQuantity;
    vm.addTabCount = addTabCount;
    vm.addChildTabCount = addChildTabCount;
    vm.menuOrderItemQuestions = [];
    vm.isProcessing = false;
    vm.menuCategories = vm.menuItem.questionSet.categories;
    vm.parentSelectedAnswerId = {};
    vm.selectedIndex = 0;
    vm.tabsCount = 0;
    vm.previousSelectedTab = 0;
    vm.validateQuestionsInTab = validateQuestionsInTab;
    vm.isNewTab = isNewTab;

    $log.debug(vm.menuItem);
    if (vm.menuItem && vm.menuItem.questionSet && vm.menuItem.questionSet.categories &&
      vm.menuItem.questionSet.categories[0].questions) {
      vm.menuItemQuestions = vm.menuItem.questionSet.categories[0].questions;
    } else {
      vm.menuItemQuestions = [];
    }

    // If editing an existing order, and it has been customized, initialize the vm.addedAnswersArray
    // and vm.menuOrderItemQuestions arrays.
    if (vm.isEditForm && vm.menuOrderItem.questions) {
      initializeExistingOrderQuestions();
    }

    /**
     * initialize the answer and questions lists.
     */
    function initializeExistingOrderQuestions() {
      vm.addedAnswersArray = [];
      // Add all questions and answers from the item being edited to an array
      // TODO consider using Array.map or other async features of JavaScript instead of making nested loops
      for (b = 0; b < vm.menuOrderItem.questions.length; b++) {
        for (c = 0; c < vm.menuOrderItem.questions[b].answers.length; c++) {
          answerId = vm.menuOrderItem.questions[b].answers[c].answerId;
          vm.addedAnswersArray.push(answerId);
        }
      }
      $log.debug('Added Answers: ' + vm.addedAnswersArray);
      for (var k = 0; k < vm.menuItem.questionSet.categories.length; k++) {
        vm.menuItemQuestions = vm.menuItem.questionSet.categories[k].questions;
        for (i = 0; i < vm.menuItemQuestions.length; i++) {
          // Add question level instruction if already added
          // filtering over already added item questions (small set of objects)
          // TODO(performance) return if element is match in filter against questionId
          var existingQuestion = $filter('filter')(vm.menuOrderItem.questions,
            {questionId: vm.menuItemQuestions[i].questionId})[0];

          if (angular.isDefined(existingQuestion)) {
            vm.menuItemQuestions[i].specialInstructions = existingQuestion.specialInstructions;
          }

          for (j = 0; j < vm.menuItemQuestions[i].answers.length; j++) {
            menuAnswerId = vm.menuItemQuestions[i].answers[j].answerId;

            if (vm.addedAnswersArray.indexOf(menuAnswerId) !== -1) {
              vm.menuItemQuestions[i].answers[j].isSelected = true;
              if (vm.menuItemQuestions[i].answerType === 3) {
                vm.menuItemQuestions[i].selectedAnswer = vm.menuItemQuestions[i].answers[j].answerId;
              }
              addModifierToMenuItemOrder(vm.menuItemQuestions[i], vm.menuItemQuestions[i].answers[j], true, existingQuestion.tab);
            }
          }
        }
      }

      $log.debug('Ordered Item Questions: ' + JSON.stringify(vm.menuOrderItemQuestions));
    }

    function validateQuestionsInTab() {
      var i;

      var selectedAnswersIsNotValid = [];
      for (i = vm.previousSelectedTab; i < vm.selectedIndex; i++) {
        checkForInvalidAnswers(vm.menuItem, vm.menuOrderItemQuestions, selectedAnswersIsNotValid, i);
        if (selectedAnswersIsNotValid.length > 0) {
          vm.selectedIndex = i;
          vm.previousSelectedTab = i;
          break;
        }
      }
      if (selectedAnswersIsNotValid.length !== 0) {
        vm.selectedIndex = vm.previousSelectedTab;
        var invalidQuestions = [], l;
        $log.debug('Number of invalid questions: ' + selectedAnswersIsNotValid.length);

        for (l = 0; l < selectedAnswersIsNotValid.length; l++) {
          if (selectedAnswersIsNotValid[l].answeredCount === 0) {
            invalidQuestions.push('Selection of ' + selectedAnswersIsNotValid[l].name + ' is required');
          } else {
            invalidQuestions.push('Maximum of ' + selectedAnswersIsNotValid[l].answeredCount +
              ' answers can be selected for ' + selectedAnswersIsNotValid[l].name);
          }
        }
        $mdToast.show({
          controller: 'ModifierValidationToastController',
          bindToController: true,
          controllerAs: 'vm',
          hideDelay: 2000,
          position: 'top right',
          templateUrl: 'views/menu/modifier_validation_toast.html',
          locals: {
            validationMessages: invalidQuestions
          }
        });
      } else {
        vm.previousSelectedTab = vm.selectedIndex;
      }
    }

    /**
     * Perform validation, then add menuItem that is currently being modified to Order
     * with modifiers (question and answers)
     */
    function addMenuItemToOrder() {
      var selectedAnswersIsNotValid = [];

      checkForInvalidAnswers(vm.menuItem, vm.menuOrderItemQuestions, selectedAnswersIsNotValid, vm.selectedIndex);

      if (selectedAnswersIsNotValid.length === 0) {
        if (vm.selectedIndex !== vm.tabsCount - 1) {
          vm.selectedIndex++;
          return false;
        }
        vm.menuOrderItem.questions = vm.menuOrderItemQuestions;
        vm.isProcessing = true;
        // If editing an item update it, otherwise add the ordered item
        invokeAddOrUpdateItem();
      } else {
        var invalidQuestions = [], l;
        $log.debug('Number of invalid questions: ' + selectedAnswersIsNotValid.length);

        for (l = 0; l < selectedAnswersIsNotValid.length; l++) {
          if (selectedAnswersIsNotValid[l].answeredCount === 0) {
            invalidQuestions.push('Selection of ' + selectedAnswersIsNotValid[l].name + ' is required');
          } else {
            invalidQuestions.push('Maximum of ' + selectedAnswersIsNotValid[l].answeredCount +
              ' answers can be selected for ' + selectedAnswersIsNotValid[l].name);
          }
        }
        $mdToast.show({
          controller: 'ModifierValidationToastController',
          bindToController: true,
          controllerAs: 'vm',
          hideDelay: 2000,
          position: 'top right',
          templateUrl: 'views/menu/modifier_validation_toast.html',
          locals: {
            validationMessages: invalidQuestions
          }
        });
      }
    }

    /**
     * Merge modifier updates into order items and update total Norder price
     * @param singleQuestion modifier whose answers need to be merged in
     */
    function mergeModifiersAndUpdatePrice(singleQuestion) {
      var j, l, i, a, removedQuestionsCategories = [];
      // TODO as this only happens during editing a menu modifier, we shouldn't need to go through all of these
      // inefficient loops. We should just update the item we are editing directly and update the price.

      for (l = 0; l < vm.menuOrderItemQuestions.length; l++) {
        for (i = 0; i < singleQuestion.answers.length; i++) {
          if (removedQuestionsCategories.indexOf(vm.menuOrderItemQuestions[l].categoryId) === -1 &&
            singleQuestion.tab === vm.menuOrderItemQuestions[l].tab &&
            singleQuestion.answers[i].leadToCategoryId === vm.menuOrderItemQuestions[l].categoryId) {

            removedQuestionsCategories.push(vm.menuOrderItemQuestions[l].categoryId);
            var removingCategory = $filter('filter')(vm.menuItem.questionSet.categories,
              {categoryId: vm.menuOrderItemQuestions[l].categoryId})[0];
            for (a = 0; a < removingCategory.questions.length; a++) {
              var removingQuestion = removingCategory.questions[a];
              deselectAnswersWhileEditing(removingQuestion);
              var removeFromMenuOrderQuestion = $filter('filter')(vm.menuOrderItemQuestions, {questionId: removingQuestion.questionId})[0];
              vm.menuOrderItemQuestions.splice(
                vm.menuOrderItemQuestions.indexOf(removeFromMenuOrderQuestion), 1);
            }
          }
        }
      }
    }

    function deselectAnswersWhileEditing(removingQuestion) {
      var k;
      if (removingQuestion.answerType === 1 || removingQuestion.answerType === 2) {
        for (k = 0; k < removingQuestion.answers.length; k++) {
          removingQuestion.answers[k].isSelected = false;
          // Update price to add modifier price
          updateTotalPriceAfterModifiers(removingQuestion.answers[k].price, '-');
        }
        removingQuestion.selectedAnswer = '';
      } else if (removingQuestion.answerType === 3) {
        var removingAnswer = $filter('filter')(removingQuestion.answers,
          {answerId: removingQuestion.selectedAnswer})[0];
        // Update price to add modifier price
        updateTotalPriceAfterModifiers(removingAnswer.price, '-');
        removingQuestion.selectedAnswer = '';
      }
    }
    /**
     * Add or remove menuItem modifiers (question and its answers)
     * @param question modifier attribute
     * @param answer modifier value
     * @param isParent whether to set the parentSelectedAnswerId
     */
    function addModifierToMenuItemOrder(question, answer, isParent, tabValueFromOrder) {
      // Based on this assignment will display the corresponding questions
      if (isParent) {
        vm.parentSelectedAnswerId[question.questionId] = answer.answerId;
      }
      var tabValue = tabValueFromOrder ? tabValueFromOrder : vm.selectedIndex;
      // find if question already exists
      var singleQuestion = $filter('filter')(vm.menuOrderItemQuestions, {questionId: question.questionId})[0];
      var answerAttrs = {
        answerId: answer.answerId,
        text: answer.text,
        price: answer.price,
        leadToCategoryId: answer.leadToCategoryId
      };

      //TODO check if answer price > 0 and then add to menuOrderItem.price
      // Question already exists, so check if answer already exists.
      if (angular.isDefined(singleQuestion)) {
        // Case1: if question exists, delete it and add new one
        // TODO use a constant and not a magic number here.
        if (question.answerType === 3) {
          // Subtract previous answer price if it exists
          updateTotalPriceAfterModifiers(singleQuestion.answers[0].price, '-');

          // radio btn so single answer delete question
          vm.menuOrderItemQuestions.splice(vm.menuOrderItemQuestions.indexOf(singleQuestion), 1);
          if (isParent) {
            mergeModifiersAndUpdatePrice(singleQuestion);
          }
          // re-add question with answer
          vm.menuOrderItemQuestions.push({
            isParent: isParent,
            tab: tabValue,
            questionId: question.questionId,
            categoryId: question.categoryId,
            answerType: question.answerType,
            text: question.text,
            answers: [answerAttrs],
            specialInstructions: question.specialInstructions
          });
          // Update price to add modifier price
          updateTotalPriceAfterModifiers(answer.price, '+');
        }
        // Case2: add answer to question
        else if (question.answerType === 1 || question.answerType === 2) {
          var singleQuestionAnswer = $filter('filter')(singleQuestion.answers, {answerId: answer.answerId})[0];

          if (angular.isDefined(singleQuestionAnswer)) {
            // remove answer from question
            singleQuestion.answers.splice(
              arrayObjectIndexOf(singleQuestion.answers, answerAttrs.answerId, 'answerId'), 1);
            // delete question if answers is empty
            if (singleQuestion.answers.length === 0) {
              vm.menuOrderItemQuestions.splice(vm.menuOrderItemQuestions.indexOf(singleQuestion), 1);
            }
            // Update price to subtract modifier price
            updateTotalPriceAfterModifiers(answer.price, '-');
          } else {
            // add answer to question
            singleQuestion.answers.push(answerAttrs);
            // Update price to add modifier price
            updateTotalPriceAfterModifiers(answer.price, '+');
          }
        }
      } else {
        // Question does not exist. Add it along with its answer.
        vm.menuOrderItemQuestions.push({
          isParent: isParent,
          tab: tabValue,
          questionId: question.questionId,
          categoryId: question.categoryId,
          answerType: question.answerType,
          name: question.text,
          answers: [answerAttrs],
          specialInstructions: question.specialInstructions
        });
        // Update price to add modifier price
        updateTotalPriceAfterModifiers(answer.price, '+');
      }
    }

    /**
     * Function adds/removes modifier price from menuOrderItem.
     * @param answerPrice price for a specific question based on condition
     * @param method '+' or '-' to add or subtract price
     */
    function updateTotalPriceAfterModifiers(answerPrice, method) {
      if (answerPrice > 0 && method === '+') {
        vm.menuOrderItem.totalPriceAfterModifiers += answerPrice;
      }
      if (answerPrice > 0 && method === '-') {
        vm.menuOrderItem.totalPriceAfterModifiers -= answerPrice;
      }
    }

    function menuItemDecreaseQuantity() {
      if (vm.menuOrderItem.quantity > vm.menuItem.quantityChoiceLowerLimit) {
        vm.menuOrderItem.quantity--;
      }
    }

    function menuItemIncreaseQuantity() {
      if (vm.menuOrderItem.quantity < vm.menuItem.quantityChoiceLimit) {
        vm.menuOrderItem.quantity++;
      }
    }

    // add or update menuItem(orderItem) based on form request
    function invokeAddOrUpdateItem() {
      var message;
      var promiseOrderItem = orderService.addOrUpdateMenuItem(vm.menuOrderItem, vm.isEditForm);
      promiseOrderItem.then(function(orderResp) {
        // get recently added/updated item from orderItems response
        var currentItem = orderResp.data.order.orderItems[orderResp.data.order.orderItems.length - 1];
        // add orderItemId to menuOrderItem at top level for editing purpose
        vm.menuOrderItem.orderItemId = currentItem.orderItemId;
        if (vm.isEditForm) {
          vm.menuOrderItems[vm.editIndex] = vm.menuOrderItem;
          message = vm.menuItem.name + ' updated.';
        } else {
          vm.menuOrderItems.push(vm.menuOrderItem);
          message = vm.menuItem.name + ' added to cart.';
        }
        // broadcast data to available in right panel checkout section
        commonFactory.orderedItemsForBroadCast(vm.menuOrderItems);
        // broadcast OrderResponse to available for other controllers
        commonFactory.prepOrderResponseForBroadcast(orderResp.data.order);

        cancel();
        vm.isProcessing = false;
        $mdToast.show(
          $mdToast.simple()
            .textContent(message)
            .position('top right')
            .hideDelay(2000)
        );
      }).catch(function(error) {
        errorService.displayError(error || 'Failed to add item to cart.');
      });
    }

    function addTabCount(categories1) {
      categories1.tab = vm.tabsCount;
      vm.tabsCount++;
    }
  }

  /**
   * Find out required questions to validate the max answers and min answers validation
   * @param menuItem item that contains menu questions
   * @param menuOrderItemQuestions item that contains ordered questions
   * @param selectedIndex index of selected item
   */
  function questionsToValidateTheAnswers(menuItem, menuOrderItemQuestions, selectedIndex) {

    var menuQuestionsForCheck, menuQuestions = [];
    var j, l;
    for (j = 0; j < menuItem.questionSet.categories.length; j++) {
      if (menuItem.questionSet.categories[j].tab === selectedIndex) {
        menuQuestionsForCheck = menuItem.questionSet.categories[j].questions;
        if (menuItem.itemId !== menuItem.questionSet.categories[j].mainItemId) {
          for (l = 0; l < menuOrderItemQuestions.length; l++) {
            var isQuestionRequiredToValidate = $filter('filter')(menuOrderItemQuestions[l].answers, {leadToCategoryId: menuQuestionsForCheck[0].categoryId})[0];
            if (isQuestionRequiredToValidate) {
              menuQuestions = menuItem.questionSet.categories[j].questions;
            }
          }
        } else {
          menuQuestions = menuItem.questionSet.categories[j].questions;
        }

      }
    }
    return menuQuestions;
  }

  /**
   * Validate questions in order and put errors in selectedAnswersIsNotValid array
   * @param menuItem item that contains menu questions
   * @param menuOrderItemQuestions item that contains ordered questions
   * @param selectedAnswersIsNotValid array of invalid answers
   * @param selectedIndex index of selected item
   */
  function checkForInvalidAnswers(menuItem, menuOrderItemQuestions, selectedAnswersIsNotValid, selectedIndex) {

    var menuQuestions, orderQuestionId, orderedQuestions = [];
    var i, k, j;

    // Initialize menu questions
    if (!menuItem.questionSet.categories[0]) {
      menuQuestions = [];
    }

    // Initialize ordered questions
    for (k = 0; k < menuOrderItemQuestions.length; k++) {
      orderedQuestions.push(menuOrderItemQuestions[k].questionId);
    }

    // Going through all categories to do the required validation from the selected tab
    menuQuestions = questionsToValidateTheAnswers(menuItem, menuOrderItemQuestions, selectedIndex);

    // Go through all possible questions and check for invalid answers
    for (i = 0; i < menuQuestions.length; i++) {
      // If there is a minimum number of answers required for the question
      if (menuQuestions[i].answerMinLimit > 0 && menuQuestions[i].cssClass !== 'hide') {
        orderQuestionId = menuQuestions[i].questionId;

        // There are questions in the order, check them
        if (orderedQuestions.length > 0) {
          // If the ordered question is not found, then this is not a valid answer.
          if (orderedQuestions.indexOf(orderQuestionId) === -1) {
            var notValidAnswers = $filter('filter')(selectedAnswersIsNotValid, {questionId: orderQuestionId})[0];
            // If this not valid answer hasn't been added to the list yet, add it.
            if (angular.isUndefined(notValidAnswers)) {
              selectedAnswersIsNotValid.push({
                questionId: orderQuestionId,
                name: menuQuestions[i].text,
                answeredCount: 0
              });
            }
          }
        }
        // There are no questions in the order. This violates the minLimit. Add to the not valid answers list.
        else {
          selectedAnswersIsNotValid.push({
            questionId: menuQuestions[i].questionId,
            name: menuQuestions[i].text,
            answeredCount: 0
          });
        }
      }

      // If there is a max number of answers for a question
      if (menuQuestions[i].answerMaxLimit > 0 && menuQuestions[i].cssClass !== 'hide') {
        var orderQuestionMaxAnswers = menuQuestions[i].answerMaxLimit;
        orderQuestionId = menuQuestions[i].questionId;

        // Check that the answers for that question aren't above the max limit of answers
        if (orderedQuestions.length > 0) {
          for (j = 0; j < orderedQuestions.length; j++) {
            if (orderQuestionId === orderedQuestions[j].questionId) {
              // jshint -W073
              if (orderQuestionMaxAnswers < orderedQuestions[j].answers.length) {
                selectedAnswersIsNotValid.push({
                  questionId: menuQuestions[i].questionId,
                  name: menuQuestions[i].text,
                  answeredCount: orderQuestionMaxAnswers
                });
              }
              // jshint +W073
            }
          }
        }
      }
    }
  }

  /**
   * Find the index of an object in an array
   * @param myArray
   * @param searchTerm
   * @param property
   * @returns {number}
   */
  function arrayObjectIndexOf(myArray, searchTerm, property) {
    for (var i = 0, len = myArray.length; i < len; i++) {
      if (myArray[i][property] === searchTerm) {
        return i;
      }
    }
    return -1;
  }

  /**
   * add question level instructions
   * @param question which contains a questionId
   * @param menuOrderItemQuestions list of questions
   */
  function addSpecialInstructionsToModifier(question, menuOrderItemQuestions) {
    // TODO or confirm, currently special instructions at modifier level will work if it is added (at least one check)
    var singleQuestion = $filter('filter')(menuOrderItemQuestions, {questionId: question.questionId})[0];
    if (angular.isDefined(singleQuestion)) {
      singleQuestion.specialInstructions = question.specialInstructions;
    }
  }

  /**
   * Cancel the modifier dialog.
   */
  function cancel() {
    $log.debug('Menu modifiers dialog closed.');
    $mdDialog.cancel();
  }

  function addChildTabCount(categories1, tabId) {
    categories1.tab = tabId;
  }

  /* Find out which category to display as a new tab */
  function isNewTab(categories, menuItemId) {
    return categories.mainItemId === menuItemId;
  }
}
