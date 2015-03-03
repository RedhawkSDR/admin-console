'use strict';

/* jasmine specs for controllers go here */
describe('AdminConsole.webSCA controller', function() {

  beforeEach(function(){
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });
  });

  beforeEach(module('webSCA'));
    describe('WebSCACtrlInit', function() {
      var scope, ctrl, $httpBackend, $rootScope;
      
      beforeEach(inject(function(_$httpBackend_, _$rootScope_, $controller) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        ctrl = $controller('UserSettings', {$scope: scope});
      }));
      
      it('UserSettings queries sysinit', function() {
        $httpBackend.expectGET('/redhawk/rest/sysinfo').
            respond({
              'redhawk.version': '1.10.1',
              'rhweb.version': '1.2',
              'supportsRemoteLocations': true
            });
        $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
            respond({"domains": ["localhost:REDHAWK_DEV"]});

        expect(scope.user.sysinfo.supportsRemoteLocations).toBeFalsy();
        expect(scope.user.sysinfo['redhawk.version']).toBeUndefined();
        expect(scope.user.sysinfo['rhweb.version']).toBeUndefined();
        $httpBackend.flush();
        //  Show that the sysinfo data is set
        expect(scope.user.sysinfo.supportsRemoteLocations).toBeTruthy();
        expect(scope.user.sysinfo['redhawk.version']).toEqualData('1.10.1');
        expect(scope.user.sysinfo['rhweb.version']).toEqualData('1.2');

      });

      it('UserSettings bad sysinit works', function() {
        
        // Simulate bad sysinfo
        $httpBackend.expectGET('/redhawk/rest/sysinfo').
            respond(404, '<html><body>404 Error</body></html>');
        $httpBackend.expectGET('/redhawk/rest/domains').
            respond({"domains": ["REDHAWK_DEV"]});

        // Show that the system still works, and that supportsRemoteLocations remains falsy
        expect(scope.user.sysinfo.supportsRemoteLocations).toBeFalsy();
        expect(scope.user.sysinfo['redhawk.version']).toBeUndefined();
        expect(scope.user.sysinfo['rhweb.version']).toBeUndefined();
        $httpBackend.flush();
        expect(scope.user.sysinfo.supportsRemoteLocations).toBeFalsy();
        expect(scope.user.sysinfo['redhawk.version']).toBeUndefined();
        expect(scope.user.sysinfo['rhweb.version']).toBeUndefined();

      });
    });
  
    describe('WebSCACtrl', function(){
    var scope, ctrl, $httpBackend, $rootScope;

    beforeEach(inject(function(_$httpBackend_, _$rootScope_, $controller) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $httpBackend.expectGET('/redhawk/rest/sysinfo').
          respond({
              'redhawk.version': '1.10.1',
              'rhweb.version': '1.2',
              'supportsRemoteLocations': true
          });
      $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
          respond({"domains": ["localhost:REDHAWK_DEV"]});
      
      scope = $rootScope.$new();
      ctrl = $controller('UserSettings', {$scope: scope});
    }));


    it('UserSettings determines remote location availability', function() {
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      expect(scope.user.domain).toEqualData('localhost:REDHAWK_DEV');

      //expect(scope.phones).toEqualData(
      //    [{name: 'Nexus S'}, {name: 'Motorola DROID'}]);
    });

    it('UserSettings initializes with a list of locations', function() {
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      expect(scope.user.domain).toEqualData('localhost:REDHAWK_DEV');

      //expect(scope.phones).toEqualData(
      //    [{name: 'Nexus S'}, {name: 'Motorola DROID'}]);
    });

    it('UserSettings.add_host(): multiple locations', function() {
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
          respond({"domains": ["localhost:REDHAWK_DEV"]});
      $httpBackend.expectGET('/redhawk/rest/domains/127.0.0.1:').
          respond({"domains": ["127.0.0.1:FOOBAR"]});
      scope.newhost = '127.0.0.1';
      scope.add_host(scope.newhost);
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      $httpBackend.flush();
      expect(scope.newhost).toEqualData('');
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'},
                                              {domain: '127.0.0.1:FOOBAR', host: '127.0.0.1'}]);

    });

    it('UserSettings.add_host(): multiple domains', function() {
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
          respond({"domains": ["localhost:REDHAWK_DEV"]});
      $httpBackend.expectGET('/redhawk/rest/domains/127.0.0.1:').
          respond({"domains": ["127.0.0.1:FOOBAR", "127.0.0.1:WHATEVER"]});
      scope.newhost = '127.0.0.1';
      scope.add_host(scope.newhost);
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      $httpBackend.flush();
      expect(scope.newhost).toEqualData('');
      expect(scope.user.domains).toEqualData([
        {domain: 'localhost:REDHAWK_DEV', host: 'localhost'},
        {domain: '127.0.0.1:FOOBAR', host: '127.0.0.1'},
        {domain: '127.0.0.1:WHATEVER', host: '127.0.0.1'},
      ]);

    });


    it('UserSettings.add_host(): 404 error with host', function() {
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
          respond({"domains": ["localhost:REDHAWK_DEV"]});
      $httpBackend.expectGET('/redhawk/rest/domains/foobar:').
          respond(404, {
            message: "Unable to connect with NameService on host 'foobar'",
            error: "ResourceNotFound"
          });
      scope.newhost = 'foobar';
      scope.add_host(scope.newhost);
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      $httpBackend.flush();
      expect(scope.newhost).toEqualData('');
      expect(scope.user.alldomains).toEqualData([
        {domain: 'localhost:REDHAWK_DEV', host: 'localhost'},
        {domain: undefined, error: "Unable to connect with NameService on host 'foobar'", host: 'foobar'},
      ]);
      expect(scope.user.domains).toEqualData([
        {domain: 'localhost:REDHAWK_DEV', host: 'localhost'}
      ]);
      expect(scope.user.hoststatus).toEqualData({
        foobar: {
          error: "Unable to connect with NameService on host 'foobar'"
        }
      });

    });

    it('UserSettings.add_host(): non-JSON response', function() {
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
          respond({"domains": ["localhost:REDHAWK_DEV"]});
      $httpBackend.expectGET('/redhawk/rest/domains/foobar:').
          respond(404, '<html><body>404 Error</body></html>');
      scope.newhost = 'foobar';
      scope.add_host(scope.newhost);
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      $httpBackend.flush();
      expect(scope.newhost).toEqualData('');
      expect(scope.user.alldomains).toEqualData([
        {domain: 'localhost:REDHAWK_DEV', host: 'localhost'},
        {domain: undefined, error: "An unknown 404 error.", host: 'foobar'},
      ]);
      expect(scope.user.domains).toEqualData([
        {domain: 'localhost:REDHAWK_DEV', host: 'localhost'}
      ]);
      expect(scope.user.domain).toEqualData('localhost:REDHAWK_DEV');
    });

    it('UserSettings.remove_host()', function() {
      console.debug(scope.user);
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
          respond({"domains": ["localhost:REDHAWK_DEV"]});
      $httpBackend.expectGET('/redhawk/rest/domains/127.0.0.1:').
          respond({"domains": ["127.0.0.1:FOOBAR"]});
      scope.newhost = '127.0.0.1';
      scope.add_host(scope.newhost);
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      $httpBackend.flush();
      expect(scope.newhost).toEqualData('');
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'},
        {domain: '127.0.0.1:FOOBAR', host: '127.0.0.1'}]);
      
      // Set the domain
      scope.user.domain = scope.user.domains[1].domain
      
      // Remove that domain
      scope.remove_host(1)
      $httpBackend.expectGET('/redhawk/rest/domains/localhost:').
          respond({"domains": ["localhost:REDHAWK_DEV"]});
      expect(scope.user.hosts).toEqualData(['localhost'])
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'},
        {domain: '127.0.0.1:FOOBAR', host: '127.0.0.1'}]);
      
      // Request handle
      $httpBackend.flush();

      // expect only the one domain and the selected domain should be this one
      expect(scope.user.domains).toEqualData([{domain: 'localhost:REDHAWK_DEV', host: 'localhost'}]);
      expect(scope.user.domain).toEqualData(scope.user.domains[0].domain)

      // Remove last domain
      scope.remove_host(0);
      // This is neccessary to flush promises not associated with $httpBackend - Grr
      $rootScope.$apply();
      expect(scope.user.domains).toEqualData([]);
      expect(scope.user.domain).toBeFalsy()
    });


    it('UserSettings sets default host to first valid host', function() {
      expect(scope.user.domains).toEqualData([]);
      $httpBackend.flush();
      
      // Make first host invalid
      $httpBackend.expectGET('/redhawk/rest/domains/foobar:').
          respond(404, {
            message: "Unable to connect with NameService on host 'foobar'",
            error: "ResourceNotFound"
          });
      $httpBackend.expectGET('/redhawk/rest/domains/127.0.0.1:').
          respond({"domains": ["127.0.0.1:FOOBAR"]});
      $httpBackend.expectGET('/redhawk/rest/domains/whatever:').
          respond({"domains": ["whatever:DOMAIN1", "whatever:DOMAIN2"]});
      scope.user.hosts = [ 'foobar', '127.0.0.1', 'whatever'];
      scope.user.refreshData();
      $httpBackend.flush();
      expect(scope.user.alldomains).toEqualData([
        {domain: undefined, error: "Unable to connect with NameService on host 'foobar'", host: 'foobar'},
        {domain: '127.0.0.1:FOOBAR', host: '127.0.0.1'},
        {domain: 'whatever:DOMAIN1', host: 'whatever'},
        {domain: 'whatever:DOMAIN2', host: 'whatever'}
      ]);

      // Domain should be first valid domain
      expect(scope.user.domain).toEqualData(scope.user.alldomains[1].domain);

      // Remove that domain
      scope.remove_host(1);
      $httpBackend.expectGET('/redhawk/rest/domains/foobar:').
          respond(404, {
            message: "Unable to connect with NameService on host 'foobar'",
            error: "ResourceNotFound"
          });
      $httpBackend.expectGET('/redhawk/rest/domains/whatever:').
          respond({"domains": ["whatever:DOMAIN1", "whatever:DOMAIN2"]});

      // Request handle
      $httpBackend.flush();

      // expect only the one domain and the selected domain should be this one
      expect(scope.user.domain).toEqualData(scope.user.alldomains[1].domain)
    });

    //it('should set the default value of orderProp model', function() {
    //  expect(scope.orderProp).toBe('age');
    //});
  });
});
