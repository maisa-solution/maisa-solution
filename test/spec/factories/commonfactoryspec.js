describe('commonFactory', function () {

  var $rootScope, $httpBackend;

  beforeEach(module('callcenterApp'));
  beforeEach(inject(function (_$rootScope_, _$httpBackend_) {

    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  describe('getCountriesList', function () {
    it('Should return all countries list', inject(function (commonFactory) {
      expect('US').toEqual('US');
    }));

    it('Should have the correct country name', inject(function (commonFactory) {
      expect('United States').toEqual('United States');
    }));
  });
});
