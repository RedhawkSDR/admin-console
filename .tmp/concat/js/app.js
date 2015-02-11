 /*!                                                                                           
  * This file is protected by Copyright. Please refer to the COPYRIGHT file                    
  * distributed with this source distribution.                                                 
  *                                                                                            
  * This file is part of REDHAWK redhawk-admin-console.                                              
  *                                                                                            
  * REDHAWK redhawk-admin-console is free software: you can redistribute it and/or modify it         
  * under the terms of the GNU Lesser General Public License as published by the               
  * Free Software Foundation, either version 3 of the License, or (at your                     
  * option) any later version.                                                                 
  *                                                                                            
  * REDHAWK redhawk-admin-console is distributed in the hope that it will be useful, but WITHOUT     
  * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or                      
  * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License               
  * for more details.                                                                          
  *                                                                                            
  * You should have received a copy of the GNU Lesser General Public License                   
  * along with this program.  If not, see http://www.gnu.org/licenses/.                        
  *                                                                                            
  * redhawk-admin-console - v2.1.0 - 2015-02-11          
  */                                                                                           
 /*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
angular.module('RedhawkConfig', [])
  .provider('RedhawkConfig', [function(){
    var getWSBasePath = function() {
      var loc = window.location, new_uri;
      if (loc.protocol === "https:") {
        new_uri = "wss:";
      } else {
        new_uri = "ws:";
      }
      new_uri += "//" + loc.host;

      return new_uri;
    };

    this.restPath = '/redhawk/rest';
    this.wsPath = '/redhawk/rest';
    this.websocketUrl = getWSBasePath() + this.wsPath;
    this.restUrl = this.restPath;

    this.setLocation = function(host, port, basePath) {
      this.restUrl = "http://" + host + (port? ':'+port: '') + (basePath? '/'+basePath: '') + this.restPath;
      this.websocketUrl = 'ws://'+ host + (port? ':'+port: '') + (basePath? '/'+basePath: '') + this.wsPath;
    };

    var provider = this;
    this.$get = function() {
      return {
        restPath: provider.restPath,
        websocketPath: provider.wsPath,
        websocketUrl: provider.websocketUrl,
        restUrl: provider.restUrl
      };
    };
  }]);

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
/**
 * Directives for REDHAWK
 */
angular.module('redhawkDirectives', ['RecursionHelper', 'webSCAServices'])
    .factory('PropertyProcessorService', ['RecursionHelper', function(RecursionHelper) {
      return {
        compile: function (element) {
          return RecursionHelper.compile(element, function (scope, element, attrs) {

            scope.$watch("properties",function(newValue, oldValue) {
              scope.form = {};
              angular.forEach(scope.properties, function (prop) {

                prop.canEdit = false;
                if(prop.scaType == 'simple')
                  prop.canEdit = prop.mode != 'readonly' && prop.kinds && prop.kinds.indexOf('configure') > -1;

                if(prop.canEdit) {
                  scope.form[prop.id] = prop.value;
                }
              });
            });
          });

        }
      }
    }])
    .directive('properties', function(PropertyProcessorService) {
      return {
        restrict: 'E',
        scope: {
          properties: "=info",
          compact: "=?",
          title: "=?",
          canEdit: '@?',
          configure: "&"
        },
        templateUrl: 'components/redhawk/templates/properties.html',
        compile: PropertyProcessorService.compile,
        controller: function($scope) {
          $scope.booleanSelectOptions = [{ name: 'True', value: true }, { name: 'False', value: false }];

          $scope.toggleEdit = function() {
            $scope.edit = !$scope.edit;

            if($scope.edit == true) {
              angular.forEach($scope.properties, function(item){
                  if($scope.form[item.id])
                    $scope.form[item.id] = item.value;
                })
            }
          };

          $scope.submit = function() {
            $scope.edit = false;
            $scope.configure({properties: $scope.form})
          }
        }
      }
    })
    .directive('property', function(PropertyProcessorService){
      return {
        restrict: 'E',
        scope: {
          prop: "=info"
        },
        templateUrl: 'components/redhawk/templates/property.html',
        compile: PropertyProcessorService.compile
      }
    })
    .directive('status', function(){
      return {
        restrict: 'E',
        scope: {
          status: "=info"
        },
        templateUrl: 'components/redhawk/templates/status.html'
      }
    })
    .directive('startStatus', function(){
      return {
        restrict: 'E',
        scope: {
          isStarted: "=info"
        },
        template: '<span ng-if="isStarted" class="label label-success">Started</span><span ng-if="!isStarted" class="label label-danger">Stopped</span>'
      }
    })
    .directive('waveform', ['RedhawkREST', 'RedhawkDomain', function(RedhawkREST, RedhawkDomain){
      return {
        restrict: 'E',
        scope: {
          id: "=",
          domainId: '='
        },
        templateUrl: 'components/redhawk/templates/waveform.html',
        link: function(scope, element, attrs) {
          scope.$watchCollection('[id, domainId]', function(newValues){
            var id = newValues[0];
            var domainId = newValues[1];

            if(id && domainId) {
              scope.waveform = RedhawkDomain.getDomain(domainId).getWaveform(id);
            }
          });

          scope.configure = function(properties) {
            var data = [];
            angular.forEach(properties, function(value, key){
              data.push({id: key, value: value});
            });
            scope.waveform.configure(data);
          };

          scope.messages = [];
        }
      }
    }])
    .directive('component', ['RedhawkREST', 'RedhawkDomain', function(RedhawkREST, RedhawkDomain){
      return {
        restrict: 'E',
        scope: {
          id: "=",
          waveformId: '=',
          domainId: '='
        },
        templateUrl: 'components/redhawk/templates/component.html',
        link: function(scope, element, attrs) {
          scope.$watchCollection('[id, domainId, waveformId]', function(newValues){
            var id = newValues[0];
            var domainId = newValues[1];
            var waveformId = newValues[2];

            if(id && domainId && waveformId) {
              scope.component = RedhawkDomain.getDomain(domainId).getComponent(id, waveformId);
            }
          });

          scope.configure = function(properties) {
            var data = [];
            angular.forEach(properties, function(value, key){
              data.push({id: key, value: value});
            });
            scope.component.configure(data);
          };
        }
      }
    }])
    .directive('device', ['RedhawkDomain', function(RedhawkDomain){
      return {
        restrict: 'E',
        scope: {
          id: "=",
          managerId: '=',
          domainId: '='
        },
        templateUrl: 'components/redhawk/templates/device.html',
        link: function(scope, element, attrs) {
          scope.$watchCollection('[id, domainId, managerId]', function(newValues){
            var id = newValues[0];
            var domainId = newValues[1];
            var managerId = newValues[2];

            if(id && domainId && managerId) {
              scope.device = RedhawkDomain.getDomain(domainId).getDevice(id, managerId);
            }
          });
        }
      }
    }])
//    .directive('fileSystem', ['RedhawkConfig','RedhawkDomain', '$modal',
//      function(RedhawkConfig, RedhawkDomain, $modal){
//      return {
//        restrict: 'E',
//        scope: {
//          domainId: '='
//        },
//        templateUrl: 'components/redhawk/templates/file-system.html',
//        link: function(scope, element, attrs) {
//          var viewablePattern = /\.(xml|py)$/i;
//          var launchablePattern = /\.xml$/i;
//
//          scope.$watch('domainId', function(){
//            scope.loadFileSystem('');
//          });
//
//          scope.loadFileSystem = function(branch) {
//            var data = RedhawkDomain.getDomain(scope.domainId).getFileSystem(branch);
//            data.$promise.then(function(newData) {
//              angular.forEach(newData.children, function(value) {
//                value.canView = viewablePattern.test(value.name) && !value.directory;
//              });
//              angular.forEach(newData.children, function(value) {
//                value.canLaunch = launchablePattern.test(value.name) && !value.directory;
//                if(value.canLaunch)
//                  value.launchName = value.name.replace(/\./g, '_');
//              });
//
//              var parent = '/';
//              if(!angular.equals(branch, '/')) {
//                parent = branch.substring(0, branch.lastIndexOf('/'));
//              }
//
//              scope.filesystem = {
//                cwd: branch,
//                parent: parent,
//                data: newData
//              };
//            });
//          };
//
//          scope.fileUrl = function(path) {
//            return RedhawkConfig.restUrl + '/domains/' + scope.domainId + '/fs' + path;
//          };
//
//          scope.launchWaveform = function(fileName) {
//            RedhawkDomain.getDomain(scope.domainId).launch(fileName);
//          };
//
//          scope.fileViewer = function(path) {
//            var url = scope.fileUrl(path);
//            $modal.open({
//              templateUrl: 'components/redhawk/templates/file-viewer.html',
//              controller: function ($scope, $modalInstance) {
//                $scope.path = url;
//                $scope.close = function() {
//                  $modalInstance.close();
//                }
//              },
//              size: 'lg'
//            });
//          }
//        }
//      }
//    }])
;

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
angular.module('ngAnimate',[]);
angular.module('redhawk-notifications', [
    'toaster',
  ])
  .service('RedhawkNotificationService', [
    'toaster',
    function(toastr){
      var self = this;

      self.msg = function(severity, message, subject) {
        var title = subject || severity.toUpperCase();

        console.log("["+severity.toUpperCase()+"] :: "+message);
        switch (severity) {
          case 'error':
            toastr.pop('error', title, message);
            break;
          case 'success':
            toastr.pop('success', title, message);
            break;
          case 'info':
          default:
            toastr.pop('info', title, message);
            break;
        }
      };

      self.error = function(text, subject) {
        self.msg("error", text, subject);
      };
      self.info = function(text, subject) {
        self.msg("info", text, subject);
      };
      self.success = function(text, subject) {
        self.msg("success", text, subject);
      };
    }
  ])
;

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
angular.module('RedhawkREST', ['ngResource', 'RedhawkConfig'])
  .service('RedhawkREST', ['$resource', 'RedhawkConfig', function($resource, RedhawkConfig) {
    this.domain = $resource(RedhawkConfig.restUrl + '/domains', {}, {
      query: {method: 'GET'},
      add: {method: 'POST'},
      info: {method: 'GET', url: RedhawkConfig.restUrl + '/domains/:domainId'},
      configure: {method: 'PUT', url: RedhawkConfig.restUrl + '/domains/:domainId/configure'},
      events: {method: 'GET', url: RedhawkConfig.restUrl + '/domains/:domainId/eventChannels', isArray:true}
    });
    this.fileSystem = $resource(RedhawkConfig.restUrl + '/domains/:domainId/fs/:path', {}, {
      query: {method: 'GET'}
    });
    this.deviceManager = $resource(RedhawkConfig.restUrl + '/domains/:domainId/deviceManagers/:id', {}, {
      query: {method: 'GET'}
    });
    this.device = $resource(RedhawkConfig.restUrl + '/domains/:domainId/deviceManagers/:managerId/devices/:deviceId', {}, {
      query: {method: 'GET'}
    });
    this.waveform = $resource(RedhawkConfig.restUrl + '/domains/:domainId/applications', {}, {
      query:     {method: 'GET',    url: RedhawkConfig.restUrl + '/domains/:domainId/applications/:id'},
      status:    {method: 'GET',    url: RedhawkConfig.restUrl + '/domains/:domainId/applications'},
      launch:    {method: 'POST',   url: RedhawkConfig.restUrl + '/domains/:domainId/applications'},
      release:   {method: 'DELETE', url: RedhawkConfig.restUrl + '/domains/:domainId/applications/:id'},
      update:    {method: 'POST',   url: RedhawkConfig.restUrl + '/domains/:domainId/applications/:id'},
      configure: {method: 'PUT',    url: RedhawkConfig.restUrl + '/domains/:domainId/applications/:id/properties'}
    });
    this.component = $resource(RedhawkConfig.restUrl + '/domains/:domainId/applications/:applicationId/components/:componentId', {}, {
      query: {method: 'GET'},
      configure: {method: 'PUT', url: RedhawkConfig.restUrl + '/domains/:domainId/applications/:applicationId/components/:componentId/properties'}
    });
  }]);

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
angular.module('redhawkServices', ['webSCAConfig', 'SubscriptionSocketService', 'redhawk-notifications', 'RedhawkConfig', 'RedhawkREST'])
    .config(['$httpProvider', function($httpProvider) {
      $httpProvider.defaults.transformResponse.unshift(function(response, headersGetter) {
        var ctype = headersGetter('content-type');
        if(ctype && ctype.indexOf('json') > -1) {
          var reg = /:\s?(Infinity|-Infinity|NaN)\s?\,/g;
          return response.replace(reg, ": \"$1\", ");
        } else {
          return response;
        }
      });
    }])
    .factory('RedhawkDomain', ['RedhawkREST', 'RedhawkSocket', 'RedhawkNotificationService', '$q',
      function(RedhawkREST, RedhawkSocket, RedhawkNotificationService, $q){
      var notify = RedhawkNotificationService;

        /**
         *
         * Factory Object returned to the injector. Used to store {Domain} objects.
         *
         * Public Interfaces:
         * {getDomainIds()}
         * {getDomain()}
         *
         * @type {{
         *          getDomainIds: function(),
         *          getDomain: function(),
         *          addDomain: function()
         *       }}
         */
      var redhawk = {
        domainIds: null,
        __domains: {}
      };

      /**
       *  Returns a list of REDHAWK Domains available.
       *
       * @returns {Array.<string>}
       */
      redhawk.getDomainIds = function(){
        if(!redhawk.domainIds) {
          redhawk.domainIds = [];

          redhawk.domainIds.$promise = RedhawkREST.domain.query().$promise.then(function(data){
            var domains = data['domains'];
            angular.forEach(domains, function(item){
              this.push(item);
            }, redhawk.domainIds);
            return redhawk.domainIds;
          });
        }

        return redhawk.domainIds;
      };

        /**
         * Returns a resource with a promise to a {Domain} object.
         *
         * @param id - String ID of the domain
         * @returns {Domain}
         */
      redhawk.getDomain = function(id){
        if(!redhawk.__domains[id])
          redhawk.__domains[id] = new Domain(id);
        return redhawk.__domains[id];
      };

      /**
       * Add a domain not currently known to the application
       *
       * @deprecated Feature no longer implemented on the backend
       *
       * @param id
       * @param name
       * @param uri
       * @returns {promise}
       */
      redhawk.addDomain = function(id, name, uri) {
        var defer = $q.defer();

        RedhawkREST.domain.add({id: id, name: name, uri: uri}, function(){
          RedhawkREST.domain.query(function(data) {
            angular.copy(data, redhawk.domainIds);
            defer.resolve(redhawk.domainIds);
          });
        });

        return defer.promise;
      };

      /**
       * Makes a string out of the arguments. Used to ID objects in a cache.
       *
       * @returns {string}
       */
      var uniqueId = function() {
        return $.makeArray(arguments).join("::");
      };

      var portDataTypeRegex = /^data(.*)$/;
      /**
       * Adds FrontEnd JS specifiv data to the port data returned by the server.
       *
       * @param ports
       */
      var processPorts = function(ports) {
        angular.forEach(ports, function(port) {
          if(port.direction != "Uses") {
            port.canPlot = false;
            return;
          }

          var idl = port.idl;
          var matches = portDataTypeRegex.exec(idl.type);

          if(idl.namespace == "BULKIO" && matches) {
            port.canPlot = true;
            port.plotType = matches[1].toLowerCase();
          } else {
            port.canPlot = false;
            console.log("DEBUG: " + port.name + " port has unrecognized repid: " + port.repId)
          }
        });
      };

      /**
       * Angular-style resource that encapsulates the Domain interface from the server.
       *
       * @param id - {string} Domain name
       * @constructor
       */
      var Domain = function(id) {
        var self = this;

        self.getEvents = function() {
          return self.events;
        };

        /**
         * Update the data in this object (used for both REST and socket-based updates).
         * @param updateData
         * @private
         */
        self._update = function(updateData) {
          if(updateData) {
            angular.extend(self, updateData);

            processPorts(self.ports);
          }
        };

        /**
         * Handles loading data from the REST interface.
         * @param id
         * @private
         */
        self._load = function(id) {
          self._restId = id;

          self.events = new EventChannel(id);
          self.devicemanagers = {};
          self.waveforms = {};
          self.components = {};
          self.devices = {};

          self.$promise = RedhawkREST.domain.info({domainId: self._restId}, function(data){
            self._update(data);
          }).$promise;
        };

        /**
         * Reloads the data based on existing identifiers.
         * @private
         */
        self._reload = function() { self._load(self._restId); };

        /**
         * Configure REDHAWK properties for this object.
         * @param properties
         */
        self.configure = function(properties) {
          RedhawkREST.domain.configure({domainId: self._restId},{properties: properties});
        };

        /**
         * Gets filesystem information at path.
         * @deprecated - Not implemented in current versions of the backend
         * @param path
         * @returns {*}
         */
        self.getFileSystem = function(path) {
          return RedhawkREST.fileSystem.query({domainId: self._restId, path: path});
        };

        /**
         * Get event channels available.
         * @deprecated - Not implemented in current versions of the backend
         * @returns {*}
         */
        self.getEventChannels = function() {
          return RedhawkREST.domain.events({domainId: self._restId});
        };

        /**
         * Get a device object from this domain.
         * @param id
         * @param deviceManagerId
         * @returns {*}
         */
        self.getDevice = function(id, deviceManagerId){
          var devId = uniqueId(id, deviceManagerId);
          if(!self.devices[devId]){
            self.devices[devId] = new Device(id, self._restId, deviceManagerId);
          }

          return self.devices[devId];
        };

        /**
         * Get a device manager object from this domain.
         * @param id
         * @returns {*}
         */
        self.getDeviceManager = function(id) {
          if(!self.devicemanagers[id]) {
            self.devicemanagers[id] = new DeviceManager(id, self._restId);
          }

          return self.devicemanagers[id];
        };

        /**
         * Get a component object from this domain.
         * @param id
         * @param applicationId
         * @returns {*}
         */
        self.getComponent = function(id, applicationId){
          var compId = uniqueId(id, applicationId);

          if(!self.components[compId]) {
            self.components[compId] = new Component(id, self._restId, applicationId);
          }

          return self.components[compId];
        };

        /**
         * Get a waveform object from this domain.
         * @param id
         * @returns {*}
         */
        self.getWaveform = function(id){
          if(!self.waveforms[id]) {
            self.waveforms[id] = new Waveform(id, self._restId);
          }

          return self.waveforms[id];
        };

        /**
         * Get a list of Waveforms available for launching.
         * @returns {Array}
         */
        self.getLaunchableWaveforms = function() {
          if(!redhawk.availableWaveforms) {
            redhawk.availableWaveforms = [];
            redhawk.availableWaveforms.$promise =
                RedhawkREST.waveform.status({domainId: self._restId}).$promise.then(function(data){
                  angular.forEach(data['waveforms'], function(item){
                    this.push(item['name']);
                  },redhawk.availableWaveforms);

                  return redhawk.availableWaveforms;
                }
            );
          }

          return redhawk.availableWaveforms
        };

        /**
         * Launch a Waveform.
         * @param name
         * @returns {*}
         */
        self.launch = function(name) {
          return RedhawkREST.waveform.launch({domainId: self._restId}, {name: name},
            function(data){
              notify.success("Waveform "+data['launched']+" launched");
              self._reload();
            },
            function(){
              notify.error("Waveform "+name+" failed to launch.");
            }
          );
        };

        self._load(id);
      };

      /**
       * Creates a listener to all event channels and stores the messages.
       *
       * @constructor
       */
      var EventChannel = function(domainId) {
        var self = this;

        self.messages = [];
        self.channels = [];

        var on_connect = function(){
          redhawk.getDomain(domainId).getEventChannels().$promise.then(function(channels){
            angular.forEach(channels, function(chan){
              if(self.channels.indexOf(chan.id) == -1) {
                eventMessageSocket.addChannel(chan.id, domainId);
                self.channels.push(chan.id);
              }
            });
          });
        };
        var on_msg = function(json){
          self.messages.push(json);

          if(self.messages.length > 500)
            angular.copy(self.messages.slice(-500), self.messages);
        };
        var eventMessageSocket = RedhawkSocket.eventChannel(on_msg, on_connect);
        eventMessageSocket.socket.addBinaryListener(function(data){
          console.log("WARNING Event Channel Binary Data!");
        });

        self.getMessages = function() {
          return self.messages;
        };
        self.getChannelNames = function() {
          return self.channels;
        };
      };

      /**
       * Angular-style resource that encapsulates the Waveform interface from the server.
       *
       * @param id
       * @param domainId
       * @constructor
       */
      var Waveform = function(id, domainId) {
        var self = this;

        /**
         * @see {Domain._update()}
         */
        self._update = function(updateData) {
          if(updateData) {
            angular.extend(self, updateData);

            processPorts(self.ports);
            //self.uniqueId = uniqueId(self.identifier);
          }
        };

        /**
         * @see {Domain._load()}
         */
        self._load = function(id, domainId) {
          self.$promise = RedhawkREST.waveform.query({id: id, domainId: domainId}, function(data){
            self._update(data);
            self.domainId = domainId;
          }).$promise;
        };
        /**
         * @see {Domain._reload()}
         */
        self._reload = function() {
          self._load(self.id, self.domainId);
          self.$promise.then(function(wf){
            angular.forEach(wf.components,
              function(comp){
                var obj = redhawk.getDomain(self.domainId).getComponent(comp.id, self.id);
                // Calling obj after the fact to make the obj has been intiated
                obj.$promise.then(
                  function(){
                    // calling the parent ref instead of the function param since the
                    // promise resolves to the rest data not the obj.
                    obj._reload();
                  }
                );
              }
            )
          });
        };

        /**
         * Start the Waveform
         * @returns {*}
         */
        self.start = function() {
          return RedhawkREST.waveform.update(
            {id: self.id, domainId: domainId}, {started: true},
            function(){
              notify.success("Waveform "+self.name+" started.");
              self._reload();
            },
            function(){notify.error("Waveform "+self.name+" failed to start.")}
          );
        };
        /**
         * Stop the Waveform
         * @returns {*}
         */
        self.stop = function() {
          return RedhawkREST.waveform.update(
            {id: self.id, domainId: domainId},{started: false},
            function(){
              notify.success("Waveform "+self.name+" stopped.");
              self._reload();
            },
            function(){notify.error("Waveform "+self.name+" failed to stop.");}
          );
        };
        /**
         * Release (delete) the Waveform
         * @returns {*}
         */
        self.release = function() {
          return RedhawkREST.waveform.release(
            {id: self.id, domainId: self.domainId},{},
            function(){
              notify.success("Waveform "+self.name+" released.");
              redhawk.getDomain(self.domainId)._reload();
            },
            function(){notify.error("Waveform "+self.name+" failed to release.");
          });
        };
        /**
         * @see {Domain.configure()}
         */
        self.configure = function(properties) {
          return RedhawkREST.waveform.configure({id: self.id, domainId: self.domainId}, {properties: properties});
        };

        self._load(id, domainId);
      };

      /**
       * Angular-style resource that encapsulates the Component interface from the server.
       *
       * @param id
       * @param domainId
       * @param applicationId
       * @constructor
       */
      var Component = function(id, domainId, applicationId) {
        var self = this;

        /**
         * @see {Domain._update()}
         */
        self._update = function(updateData) {
          if(updateData) {
            angular.extend(this, updateData);

            processPorts(this.ports);
            //self.uniqueId = uniqueId(this.identifier, this.waveform.id);
          }
        };
        /**
         * @see {Domain._load()}
         */
        self._load = function(id, domainId, applicationId) {
          self.$promise = RedhawkREST.component.query({componentId: id, applicationId: applicationId, domainId: domainId}, function(data){
            self._update(data);
            self.waveform = {id: applicationId};
            self.domainId = domainId;
          }).$promise;
        };
        /**
         * @see {Domain._reload()}
         */
        self._reload = function() { self._load(self.id, self.domainId, self.waveform.id); };

        /**
         * @see {Domain.configure()}
         */
        self.configure = function(properties) {
          return RedhawkREST.component.configure(
              {componentId: self.id, applicationId: self.waveform.id, domainId: self.domainId},
              {properties: properties},
              function(){ self._reload(); }
          );
        };

        self._load(id, domainId, applicationId);
      };

      /**
       * Angular-style resource that encapsulates the Device interface from the server.
       *
       * @param id
       * @param domainId
       * @param managerId
       * @constructor
       */
      var Device = function(id, domainId, managerId) {
        var self = this;

        /**
         * @see {Domain._update()}
         */
        self._update = function(updateData) {
          if(updateData) {
            angular.extend(this, updateData);

            //self.uniqueId = uniqueId(self.identifier, self.deviceManager.id);
          }
        };
        /**
         * @see {Domain._load()}
         */
        self._load = function(id, domainId, managerId) {
          self.$promise = RedhawkREST.device.query({deviceId: id, managerId: managerId, domainId: domainId}, function(data){
            self._update(data);
            self.deviceManager = {id: managerId};
            self.domainId = domainId;
          }).$promise;
        };
        /**
         * @see {Domain._reload()}
         */
        self._reload = function() { self._load(self.id, self.domainId, self.deviceManager.id); };

        self.configure = function(properties) {
          return RedhawkREST.device.configure(
              {deviceId: self.id, managerId: self.deviceManager.id, domainId: self.domainId},
              {properties: properties},
              function(){ self._reload(); }
          );
        };

        self._load(id, domainId, managerId);
      };

      /**
       * Angular-style resource that encapsulates the Device Manager interface from the server.
       * @param id
       * @param domainId
       * @constructor
       */
      var DeviceManager = function(id, domainId) {
        var self = this;

        /**
         * @see {Domain._update()}
         */
        this._update = function(updateData) {
          if(updateData) {
            angular.extend(self, updateData);

            //self.uniqueId = uniqueId(self.identifier);
          }
        };
        /**
         * @see {Domain._load()}
         */
        self._load = function(id, domainId) {
          self.$promise = RedhawkREST.deviceManager.query({id: id, domainId: domainId}, function(data){
            self._update(data);
            self.domainId = domainId;
          }).$promise;
        };
        /**
         * @see {Domain._reload()}
         */
        self._reload = function() { self._load(self.id, self.domainId); };

        self.configure = function(properties) {
          return RedhawkREST.component.configure(
              {id: self.id, domainId: self.domainId},
              {properties: properties},
              function(){ self._reload(); }
          );
        };

        self._load(id, domainId);
      };

      /**
       * Recursively searches the properties array looking for the property with the given id.
       * @param properties {Array} - Array of property objects
       * @param propertyId {string} - Id of the property to find
       * @returns {Object} - property with the given id
       */
      var findPropertyByDCE = function(properties, propertyId){
        var res = undefined;

        angular.forEach(properties, function(prop){
          if(prop.id==propertyId) {
            res = prop;
          } else if(prop.structs) {
            res = findPropertyByDCE(prop.structs, propertyId);
          }
        });

        return res;
      };

      /**
       * Modifies a property in an array of properties based on the propertyId.
       * @param properties {Array} - Array of nested properties
       * @param propertyId {string} - The DCE of the property
       * @param newProp {Object} - New contents of the property
       */
      var updateProperty = function(properties, propertyId, newProp) {
        var prop = findPropertyByDCE(properties, propertyId);

        if(prop) {
          if(prop.name == newProp.name) {
            //console.log("RedhawkDomain::updateProperty - Found property '"+prop.name+"'.");
            angular.extend(prop, newProp);
          }

          angular.forEach(prop.simples, function(simple){
            if(simple.id==newProp.id) {
              //console.log("RedhawkDomain::updateProperty - Found simple '"+simple.name+"'.");
              angular.extend(simple, newProp);
            }
          });
        }
      };

      /**
       * Searches all the cached domain objects and updates new property based on the path.
       * @param {string} path - String representing the property location, modeled after the rest API URI
       * @param {object} newProperty - New property value.
       */
      var updateProperties = function(path, newProperty){
        var nav = path.split('/');

        // Path follows the format of /domains/{domainId}/{typeName}/{typeId}/{type2Name}/{type2Id}/..
        var domainId = nav[2];
        var type = nav[3];
        var typeId = nav[4];
        var subType = nav[5];
        var subTypeId = nav[6];

        var domain = redhawk.__domains[domainId];
        if(!domain) {
          return;
        }

        // Eventually type should end with /properties/{propertyId}
        var propertyId = nav[nav.indexOf('properties')+1];
        if(propertyId == 0) {
          console.log("RedhawkDomain::updateProperties::WARNING - Cannot find propertiesId");
          console.log(nav);
        }

        var properties;
        if(type=='properties') {
          properties = domain.properties;
        } else if(type=='waveforms' && subType=='properties') {
          var waveform = domain.waveforms[typeId];
          if(waveform) {
            properties = waveform.properties;
          }
        } else if(type=='waveforms' && subType == 'components') {
          var id = uniqueId(subTypeId, typeId);
          var component = domain.components[id];
          if(component){
            properties = component.properties;
          }
        } else if(type=='deviceManagers' && subType=='properties') {
          var deviceManager = domain.devicemanagers[typeId];
          if(deviceManager) {
            properties = deviceManager.properties;
          }
        } else if(type=='deviceManagers' && subType=='devices') {
          var id = uniqueId(subTypeId, typeId);
          var device = domain.devices[id];
          if(device){
            properties = device.properties
          }
        } else {
          console.log("RedhawkDomain::updateProperties - Unknown Properties Container - "+path);
        }

        if(!properties) {
          return;
        }

        // properties all follow the same format so they can
        // be passed to a generalized function.
        updateProperty(properties, propertyId, newProperty);
      };

      RedhawkSocket.status.addJSONListener(function(event) {
        var element = event.ChangedElement;
        var elementType = element.eobj_type;

        var domain = redhawk.__domains[event.domain];
        if(!domain) {
          if(event.domain)
            console.log("Skipping notification for other domain '"+event.domain+"'.");
          return;
        }

        switch(elementType) {
          case "ScaWaveformFactory":
            if(redhawk.domain)
              domain._reload();
            break;
          case "ScaWaveform":
            var applicationId = event.waveformInstance;
            if(domain.waveforms[applicationId]){
              //console.log("Updating Application  "+applicationId);
              domain.waveforms[applicationId]._update(element);
            }
            break;
          case "ScaComponent":
            var compId = uniqueId(event.componentInstance, event.waveformInstance);
            if(domain.components[compId]) {
              //console.log("Updating Component "+compId);
              domain.components[compId]._update(element);
            }
            break;
          case "ScaSimpleProperty":
            var path = event.Notification.path;
            updateProperties(path, element);
            break;
          default:
            //console.log("RedhawkDomain::NOTIF ["+elementType+"] Unknown type");
            //console.log(event);
        }
      });

      return redhawk;
    }])
    .factory('RedhawkSocket', ['SubscriptionSocket', 'RedhawkConfig', function(SubscriptionSocket, RedhawkConfig) {
      var statusSocket = function() {
        var socket = SubscriptionSocket.createNew();

// TODO: Waiting for backend implementation
//        socket.connect(RedhawkConfig.websocketUrl + '/status', function(){
//          console.log("Connected to REDHAWK Status");
//        });

        return socket;
      };

      var RedhawkSocket = {};
      RedhawkSocket.status = statusSocket();
      RedhawkSocket.port = function(options, on_data, on_sri) {
        var portSocket = SubscriptionSocket.createNew();

        var url = RedhawkConfig.websocketUrl;

        if(options.domain)
          url += '/domains/'+options.domain;
        if(options.waveform)
          url += '/applications/'+options.waveform;
        if(options.component)
          url += '/components/'+options.component;
        if(options.port)
          url += '/ports/'+options.port;

        url += '/bulkio';

        if(on_data)
          portSocket.addBinaryListener(on_data);
        if(on_sri)
          portSocket.addJSONListener(on_sri);

        portSocket.connect(url, function(){
          console.log("Connected to Port " + options.port);
        });

        return portSocket;
      };

      var EventChannelSocket = function(on_msg, on_connect) {
        var self = this;

        self.close = function(){
          console.log("Disconnected from Event Channel");
          self.socket.close();
        };

        var Msg = function(command, topic, domainId) {
          return {command: command, topic: topic, domainId: domainId}
        };
        self.addChannel = function(topic, domainId) {
          console.log('Adding topic "'+topic+'".');
          self.socket.send(JSON.stringify(new Msg('ADD', topic, domainId)));
        };
        self.removeChannel = function(topic, domainId) {
          console.log('Removing topic "'+topic+'".');
          self.socket.send(JSON.stringify(new Msg('REMOVE', topic, domainId)));
        };

        self.socket = SubscriptionSocket.createNew();
        var url = RedhawkConfig.websocketUrl + '/msg';

// TODO: Waiting for backend implementation
//        self.socket.connect(url, function() {
//          console.log("Connected to Event Channel");
//          if(on_connect) on_connect.call(self);
//        });

        if(on_msg) {
          self.socket.addJSONListener(on_msg);
        }
      };

      RedhawkSocket.eventChannel = function(on_msg, on_connect) {
        return new EventChannelSocket(on_msg, on_connect);
      };

      return RedhawkSocket;
    }])
;

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
angular.module('SubscriptionSocketService', [])
  .service('SubscriptionSocket', ['$rootScope', function ($rootScope) {
    /**
     * Convenience class to add a listener pattern to the standard WebSocket
     *
     * @constructor
     */
    var Socket = function() {
      var self = this;
      this.callbacks = {
        message: [],
        json: [],
        binary: []
      };
      this._call = function (callbacks, data) {
        var scope = this.ws;
        angular.forEach(callbacks, function (callback) {
          //console.log("Service calling callback");
          $rootScope.$apply(function () {
            callback.call(scope, data);
          });
        });
      };
      this.connect = function (path, callback) {

        self.path = path;
        self.ws = new WebSocket(path);
        self.ws.onopen = function (data) {
          console.log("Socket opened: "+self.path);
          self.ws.binaryType = "arraybuffer";
          callback.call(this.ws, data);
        };
        self.ws.onmessage = function (e) {
          //console.log("Service got message: ");
          //console.log(e.data);
          self._call(self.callbacks.message);

          if (e.data instanceof ArrayBuffer) {
            self._call(self.callbacks.binary, e.data)
          } else {
            var reg = /:\s?(Infinity|-Infinity|NaN)\s?\,/g;
            var myData = e.data.replace(reg, ": \"$1\", ");
            self._call(self.callbacks.json, JSON.parse(myData));
          }
        };
      };
      this.addListener = function (callback) {
        this.callbacks.message.push(callback);
      };
      this.addJSONListener = function (callback) {
        this.callbacks.json.push(callback);
      };
      this.addBinaryListener = function (callback) {
        this.callbacks.binary.push(callback);
      };
      this.send = function (data) {
        var self = this;
        self.ws.send(data);
      };
      this.close = function() {
        console.log("Socket closed: "+self.path);
        self.ws.close();
      }
    };

    return {
      createNew: function() { return new Socket(); }
    }
  }]);

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
/**
  * directives.js
  *
  * Placeholder for directives.
  */

angular.module("webSCADirectives", [])
  .directive('jsonWindow', ['$window', '$compile',
    function($window, $compile) {
      return {
        restrict: 'EA',
        scope: {
          info: "="
        },
        template: "<button class='btn btn-link' ng-click='openWindow(info);'><small>JSON</small></button>",
        link: function($scope, $element, attr) {
          $scope.openWindow = function(info) {
            var win = $window.open('http://yahoo.com', '_blank');
            win.document.open("text/html", "replace");
            win.document.write(angular.toJson(info, true));
            win.document.close();
          };

        }
      }
    }
  ])
//  .directive('jsonSource', ['$modal', function($modal) {
//    return {
//      restrict: 'E',
//      scope: {
//        jsonData: "="
//      },
//      template: '<button class="btn btn-sm btn-link" ng-click="openViewer()"><small><span class="glyphicon glyphicon-barcode"></span></small></button>',
//      link: function($scope, $element, $attr) {
//        $scope.openViewer = function() {
//          var json = $scope.jsonData;
//          $modal.open({
//            templateUrl: 'components/websca/templates/json-source.html',
//            controller: function ($scope, $modalInstance) {
//              $scope.json = json;
//              $scope.close = function() {
//                $modalInstance.close();
//              }
//            },
//            size: 'lg'
//          });
//        }
//      }
//    }
//  }])
;

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
/**
 * app.js
 *
 * App definition for the webSCA project.
 */

angular.module('webSCA', [
    'webSCAConfig',
    'redhawkServices',
    'webSCADirectives',
    'redhawkDirectives',
    'ngRoute'//,
//    'ui.bootstrap',
//    'hljs'
  ])
  .config(['$routeProvider',
    function($routeProvider) {
      $routeProvider
        .when('/overview', {
          templateUrl: 'views/overview.html',
          controller: 'Overview'
        })
        .when('/waveforms/:action?', {
          templateUrl: 'views/waveforms.html',
          controller: 'Waveforms'
        })
        .when('/deviceManagers', {
          templateUrl: 'views/device-managers.html',
          controller: 'DeviceManagers'
        })
        .when('/manager/:managerId/device/:deviceId', {
          templateUrl: 'views/device.html',
          controller: 'Device'
        })
        .when('/plot/waveform/:waveformId/port/:portName/:dataType?', {
          templateUrl: 'views/plot.html',
          controller: 'Plot'
        })
        .when('/plot/waveform/:waveformId/component/:componentId/port/:portName/:dataType?', {
          templateUrl: 'views/plot.html',
          controller: 'Plot'
        })
        .otherwise({
                redirectTo: '/overview'
        });
    }
  ])
//  .config(function (hljsServiceProvider) {
//    hljsServiceProvider.setOptions({
//      // replace tab with 4 spaces
//      tabReplace: ' '
//    });
//  })
  .config(function($logProvider){
    $logProvider.debugEnabled(true);
  })
  .filter('reverse', function () {
    return function(items) {
      return items.slice().reverse();
    };
  })
  .filter('limit', function () {
    return function(items, num) {
      return items.slice(0, num);
    };
  })
  .factory('user', ['RedhawkDomain', function(RedhawkDomain){
      var user = {domain: undefined};

      RedhawkDomain.getDomainIds().$promise.then(function(data){
        user.domain = data[0];
      });
      return user;
  }])
  .controller('UserSettings', ['$scope', 'user', '$timeout', 'RedhawkDomain',
    function($scope, user, $timeout, RedhawkDomain){
      $scope.user = user;
      $scope.domains = RedhawkDomain.getDomainIds();
    }
  ])
  .controller('Overview', ['$scope', 'RedhawkSocket',  'RedhawkDomain', 'user',
    function($scope, RedhawkSocket, RedhawkDomain, user) {
      $scope.user = user;
      $scope.$watch('user.domain', function(domainId){
        if(!domainId) return;

        $scope.domain = RedhawkDomain.getDomain(domainId);
        var events = $scope.domain.getEvents();

        $scope.messages = events.getMessages();
        $scope.channels = events.getChannelNames();
      });

      $scope.configure = function(properties) {
        var data = [];
        angular.forEach(properties, function(value, key){
          data.push({id: key, value: value});
        });
        $scope.redhawk.configure(data);
      };
    }
  ])
  .controller('Waveforms', ['$scope', 'RedhawkDomain', 'user', function($scope, RedhawkDomain, user) {
    $scope.user = user;
    $scope.$watch('user.domain', function(domainId) {
      $scope.domain = RedhawkDomain.getDomain(domainId);

      $scope.waveforms = $scope.domain.getLaunchableWaveforms();

      $scope.currentWaveform = null;
    });

    $scope.$watch('domain.applications', function(waveforms){
      if(waveforms && waveforms.length)
        $scope.setWaveform(waveforms[0].id);
    });

    $scope.setWaveform = function(id) {
      if(id)
        $scope.currentWaveform = id;
      return $scope.currentWaveform;
    };

    $scope.launch = function(name) {
      $scope.domain.launch(name).$promise.then(function(waveform){
        $scope.domain.$promise.then(function(){
          $scope.setWaveform(waveform.id);
        });
      })
    };
  }])
  .controller('DeviceManagers', ['$scope', 'RedhawkDomain', 'user', function($scope, RedhawkDomain, user) {
    $scope.user = user;
    $scope.$watch('user.domain', function(domainId) {
      $scope.redhawk = RedhawkDomain.getDomain(domainId);
    });

    $scope.$watch('redhawk.deviceManagers', function(deviceMgrs){
      if( deviceMgrs && deviceMgrs.length > 0 && deviceMgrs.indexOf($scope.currentManager) == -1) {
        $scope.setManager(deviceMgrs[0].id);
      }
    });

    $scope.setManager = function(id) {
      if(!id)
        return $scope.currentManager;

      $scope.manager = $scope.redhawk.getDeviceManager(id);

      $scope.currentManager = id;
      return $scope.currentManager;
    };

  }])
  .controller('Device', ['$scope', '$window', '$filter', '$routeParams', 'RedhawkDomain', 'user',
    function($scope, $window, $filter, $routeParams, RedhawkDomain, user){
      $scope.user = user;
      $scope.$watch('user.domain', function(domainId) {
        $scope.device = RedhawkDomain.getDomain(domainId).getDevice($routeParams.deviceId, $routeParams.managerId);
      });
    }
  ])
  .controller('Plot', ['$scope', '$routeParams', 'RedhawkSocket', 'user',
    function($scope, $routeParams, RedhawkSocket, user){

      $scope.waveformId = $routeParams.waveformId;
      $scope.componentId = $routeParams.componentId;
      $scope.name = $routeParams.portName;

      var dataType = $routeParams.dataType ? $routeParams.dataType : 'float';

      var defaultSettings = {
        xdelta:10.25390625,
        xstart: -1,
        xunits: 3,
        ydelta : 0.09752380952380953,
        ystart: 0,
        yunits: 1,
        subsize: 8192,
        size: 32768,
        format: 'SF'
      };
      $scope.plotSettings = angular.copy(defaultSettings);

      $scope.useSRISettings = true;
      $scope.customSettings = angular.copy(defaultSettings);

      $scope.$watch('useSRISettings', function(value) {
        if(plot && raster && value) {
          $scope.customSettings = angular.copy($scope.plotSettings);
          reloadSri = true;
        }
      });

      var plot, raster, layer, layer2;

      var fillStyle = [
        "rgba(255, 255, 100, 0.7)",
        "rgba(255, 0, 0, 0.7)",
        "rgba(0, 255, 0, 0.7)",
        "rgba(0, 0, 255, 0.7)"
      ];

      var createPlot = function(format, settings) {

        plot = new sigplot.Plot(document.getElementById("plot"), {
          all: true,
          expand: true,
          autohide_panbars: true,
          autox: 3,
          legend: false,
          xcnt: 0,
          colors: {bg: "#222", fg: "#888"},
          cmode: "D2"
        });
        plot.change_settings({
          fillStyle: fillStyle
        });

        layer = plot.overlay_array(null, angular.extend(settings, {'format': format}));
      };

      var createRaster = function(format, settings) {
        raster = new sigplot.Plot(document.getElementById("raster"), {
          all: true,
          expand: true,
          autol: 100,
          autox: 3,
          autohide_panbars: true,
          xcnt: 0,
          colors: {bg: "#222", fg: "#888"},
          cmode: "D2",
          nogrid: true
        });
        raster.change_settings({
          fillStyle: fillStyle
        });
        layer2 = raster.overlay_pipe(angular.extend(settings, {type: 2000, 'format': format, pipe: true, pipesize: 1024 * 1024 * 5}));
      };

      var reloadSri, useCustomSettings;

      $scope.updateCustomSettings = function() {
        if(!$scope.useSRISettings) {
          useCustomSettings = true;
          reloadSri = true;
        } else {
          useCustomSettings = false;
        }
      };

      var getDataConverter = (function(){
        /*
         Create a map to convert the standard REDHAWK BulkIO Formats
         into Javascript equivalents.
         ----
         byte      = 8-bit signed
         char      = 8-bit unsigned
         octet     = 8-bit The signed-ness is undefined
         short     = 16-bit signed integer
         ushort    = 16-bit unsigned integer
         long      = 32-bit signed integer
         ulong     = 32-bit unsigned integer
         longlong  = 64-bit signed integer
         ulonglong = 64-bit unsigned integer
         float     = 32-bit floating point
         double    = 64-bit floating point
         ----
         */
        var conversionMap = {
          byte: Int8Array,
          char: Uint8Array,
          octet: Uint8Array,
          ushort: Uint16Array,
          short: Int16Array,
          long: Int32Array,
          ulong: Uint32Array,
          longlong: undefined, //This should be 64-bit
          ulonglong: undefined, //This should be 64-bit
          float: Float32Array,
          double: Float64Array
        };
        var defaultConversion = Float32Array;

        return function(type) {
          var fn = conversionMap[type];
          console.log("Requesting dataconverter for type '"+type+"'."+fn);

          if(type == 'octet')
            console.log("Plot::DataConverter::WARNING - Data type is 'octet' assuming unsigned.");

          if(!fn) {
            console.log("Plot::DataConverter::WARNING - Data type is '"+type+"' using default.");
            fn = defaultConversion;
          }

          return function(data) { return new fn(data); };
        };
      })();
      var dataConverter = getDataConverter(dataType);

      var lastDataSize = 1000;

      var on_data = function(data) {
        var bpa;
        switch (dataType) {
          case 'double':
            bpa = 8;
            break;
          case 'float':
            bpa = 4;
            break;
          case 'octet':
          case 'short':
            bpa = 1;
            break;
          default:
            return;
        }

        var ape;
        switch (mode) {
          case 'S':
            ape = 1;
            break;
          case 'C':
            ape = 2;
            break;
          default:
            return;
        }

        //USE THIS CODE WHEN back-end is fixed
        //assume single frame per handler invocation
//        var array = dataConverter(data);
//        lastDataSize = array.length;
//        if (plot && raster) {
//          reloadPlots(array);
//        }

        //WORKAROUND: take only number of bytes to make one frame
        //back-end will be modified to send only one frame
        var frameSize = $scope.plotSettings.subsize * bpa * ape;
        //console.log(frameSize + ' bytes extracted');
        data = data.slice(0, frameSize);
        var array = dataConverter(data);//NB the return value toggles between two different length values. Thus the data is sometimes not properly formatted
        lastDataSize = array.length;
        //console.log(array.length + ' ' + dataType + ' elements plotted');
        if (plot && raster) {
          //WORKAROUND: This check should not be necessary. Every other frame seems to have invalid format
          // apparently containing values that are not of the type specified in dataType
          //if (array.length !== frameSize / bpa) {
          //  return;
          //}
          reloadPlots(array);
        }
      };

      var reloadPlots = function(data) {
        if (reloadSri ) {
          if (useCustomSettings) {
            $scope.plotSettings = $scope.customSettings;
          }
          plot.reload(layer, data, $scope.plotSettings);
          plot.refresh();
          plot._Gx.ylab = 27; //this is a hack, but sigplot seems to be ignoring the settings value
          raster.push(layer, data, $scope.plotSettings);
          raster.refresh();
          raster._Gx.ylab = 27; //this is a hack, but sigplot seems to be ignoring the settings value
          reloadSri = false;
        } else {
          plot.reload(layer, data);
          plot._Gx.ylab = 27; //this is a hack, but sigplot seems to be ignoring the settings value
          raster.push(layer, data);
          raster._Gx.ylab = 27; //this is a hack, but sigplot seems to be ignoring the settings value
        }
      };

      var mode = undefined;

      var updatePlotSettings = function(data) {
        var isDirty = false;
        angular.forEach(data, function(item, key){
          if (angular.isDefined($scope.plotSettings[key]) && !angular.equals($scope.plotSettings[key], item) && item != 0) {
            isDirty = true;
            console.log("Plot settings change "+key+": "+$scope.plotSettings[key]+" -> "+item);
            $scope.plotSettings[key] = item;
          }
        });

//        $scope.plotSettings['size'] = lastDataSize * $scope.plotSettings['xdelta'];
//        if(data['subsize'] == 0) {
//          $scope.plotSettings['subsize'] = lastDataSize;
//        }

        if (!plot || !raster) {
          var format = undefined;
          switch (data.mode) {
            case 0:
              mode = "S";
              break;
            case 1:
              mode = "C";
              break;
            default:
          }

          if (mode) {
            switch (dataType) {
              case "float":
                createPlot(mode + "F", defaultSettings);
                createRaster(mode + "F", defaultSettings);
                raster.mimic(plot, {xzoom: true, unzoom: true});
                console.log("Create plots with format " + mode + "F");
                break;
              case "double":
                createPlot(mode + "D", defaultSettings);
                createRaster(mode + "D",defaultSettings);
                raster.mimic(plot, {xzoom: true, unzoom: true});
                console.log("Create plots with format " + mode + "D");
                break;
              case "short":
              case "octet":
                createPlot(mode + "B", defaultSettings);
                createRaster(mode + "B", defaultSettings);
                raster.mimic(plot, {xzoom: true, unzoom: true});
                console.log("Create plots with format " + mode + "D");
                break;
              default:
            }
            isDirty = true;
          }
        }

        if(isDirty && $scope.useSRISettings) {
          reloadSri = true;
          $scope.customSettings = angular.copy($scope.plotSettings);
        }
      };

      var sriData = {};
//      var keysFound=[];
      var on_sri = function(sri) {
        if (typeof sri === 'string') {
          return;
        }
        updatePlotSettings(sri);
        angular.forEach(sri, function(value, key){
//          var found = keysFound.some(function(k) {
//            return k == key;
//          });
//          if (!found) {
//            console.log("SRI: " + key + " = " + JSON.stringify(value));
//            keysFound.push(key);
//          }
          if(angular.isArray(value)) {
            sriData[key] = value.join(", "); }
          else if (angular.isObject(value) && typeof value !== 'string') {
            var str = [];
            angular.forEach(value, function(value, key) {
              str.push(key+": "+value);
            });
            sriData[key] = '{' + str.join(', ') + '}';
          } else {
            sriData[ key ] =  value;
          }
        });

        $scope.sri = sriData;
      };

      $scope.port = RedhawkSocket.port(
          {domain: user.domain, waveform: $scope.waveformId, component: $scope.componentId, port: $scope.name},
          on_data,
          on_sri
      );

      $scope.$on("$destroy", function(){
        $scope.port.close();
      })
    }
  ])
;

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
angular.module('webSCAConfig', []);

/*
 * This file is protected by Copyright. Please refer to the COPYRIGHT file
 * distributed with this source distribution.
 *
 * This file is part of REDHAWK admin-console.
 *
 * REDHAWK admin-console is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * REDHAWK admin-console is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
/**
 * services.js
 *
 * Interface to the REDHAWK REST API
 */

angular.module('webSCAServices', [])
;

/*!

 File: tinycolor.js
 TinyColor v0.9.15+
 https://github.com/bgrins/TinyColor
 2013-02-24, Brian Grinstead, MIT License

 File: CanvasInput.js
  CanvasInput v1.0.10
  http://goldfirestudios.com/blog/108/CanvasInput-HTML5-Canvas-Text-Input

  (c) 2013, James Simpson of GoldFire Studios
  goldfirestudios.com

  (c) 2013, Axios, Inc.
  Modifications made by Axios, Inc.
  axiosengineering.com

  MIT License

 File: spin.js
 Copyright (c) 2011-2013 Felix Gnass
 Licensed under the MIT license

 File: sigplot.layer1d.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or
 (at your option) any later version. This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the
 GNU Lesser General Public License along with SigPlot.

 File: sigplot.layer2d.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or
 (at your option) any later version. This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the
 GNU Lesser General Public License along with SigPlot.

 File: license.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser 
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or 
 (at your option) any later version. This library is distributed in the hope that it will be useful, but 
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the 
 GNU Lesser General Public License along with SigPlot.

 Portions of SigPlot may utilize the following open-source software:

   loglevel.js          - MIT License; Copyright (c) 2014, Tim Perry
   typedarray.js        - MIT License; Copyright (c) 2010, Linden Research, Inc.
   tinycolor.js         - MIT License; Copyright (c) 2013, Brian Grinstead
   CanvasInput.js       - MIT License; Copyright (c) 2013, James Simpson of GoldFire Studios
   spin.js              - MIT License; Copyright (c) 2011-2013 Felix Gnass
   Array.remove         - MIT License; Copyright (c) 2007, John Resig
   Firefox subarray fix - Public Domain; Copyright (c) 2011, Ryan Berdeen

 File: typedarray.js
 $LicenseInfo:firstyear=2010&license=mit$

 Copyright (c) 2010, Linden Research, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 $/LicenseInfo$

 Copyright (c) 2013, Michael Ihde - Added big-endian/little-endian support

 File: common.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or
 (at your option) any later version. This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the
 GNU Lesser General Public License along with SigPlot.


 File: bluefile.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or
 (at your option) any later version. This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the
 GNU Lesser General Public License along with SigPlot.


 File: m.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or
 (at your option) any later version. This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the
 GNU Lesser General Public License along with SigPlot.

 File: mx.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or
 (at your option) any later version. This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the
 GNU Lesser General Public License along with SigPlot.

 File: sigplot.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or
 (at your option) any later version. This library is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the
 GNU Lesser General Public License along with SigPlot.
*/
var ArrayBuffer,ArrayBufferView,Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,DataView;
(function(){function e(){document&&document.createTextNode("").splitText(1);throw new RangeError("INDEX_SIZE_ERR");}function a(c){if(Object.getOwnPropertyNames&&Object.defineProperty){var r=Object.getOwnPropertyNames(c),n;for(n=0;n<r.length;n+=1)Object.defineProperty(c,r[n],{value:c[r[n]],writable:!1,enumerable:!1,configurable:!1})}}function d(c){function r(n){Object.defineProperty(c,n,{get:function(){return c._getter(n)},set:function(r){c._setter(n,r)},enumerable:!0,configurable:!1})}if(Object.defineProperty){var n;
for(n=0;n<c.length;n+=1)r(n)}}function x(c){return[c&255]}function q(c){return n(c[0],8)}function l(c){return[c&255]}function f(c){return s(c[0],8)}function g(c){return[c>>8&255,c&255]}function h(c){return n(c[0]<<8|c[1],16)}function p(c){return[c>>8&255,c&255]}function B(c){return s(c[0]<<8|c[1],16)}function u(c){return[c>>24&255,c>>16&255,c>>8&255,c&255]}function w(c){return n(c[0]<<24|c[1]<<16|c[2]<<8|c[3],32)}function C(c){return[c>>24&255,c>>16&255,c>>8&255,c&255]}function y(c){return s(c[0]<<
24|c[1]<<16|c[2]<<8|c[3],32)}function F(c){var n=[];for(c=c.join("");c.length;)n.push(parseInt(c.substring(0,8),2)),c=c.substring(8);return n}function E(c){var n=[],r,k;for(r=c.length;r;r-=1)for(b=c[r-1],k=8;k;k-=1)n.push(b%2?1:0),b>>=1;n.reverse();return n}function K(c){return[c&255]}function U(c){return n(c[0],8)}function T(c){return[c&255]}function O(c){return s(c[0],8)}function J(c){return[c&255,c>>8&255]}function X(c){return n(c[1]<<8|c[0],16)}function c(c){return[c&255,c>>8&255]}function t(c){return s(c[1]<<
8|c[0],16)}function A(c){return[c&255,c>>8&255,c>>16&255,c>>24&255]}function G(c){return n(c[3]<<24|c[2]<<16|c[1]<<8|c[0],32)}function Q(c){return[c&255,c>>8&255,c>>16&255,c>>24&255]}function z(c){return s(c[3]<<24|c[2]<<16|c[1]<<8|c[0],32)}function S(c){var n=[];for(c=c.join("");c.length;)n.push(parseInt(c.substring(c.length-8,c.length),2)),c=c.substring(0,c.length-8);return n}function r(c){var n=[],r,k;for(r=0;r<c.length;r++)for(b=c[r],k=8;k;k-=1)n.push(b%2?1:0),b>>=1;n.reverse();return n}function n(c,
n){var r=32-n;return c<<r>>r}function s(c,n){var r=32-n;return c<<r>>>r}function k(c,n,r){var k=(1<<n-1)-1,t,s,d;isNaN(c)?(s=(1<<k)-1,k=Math.pow(2,r-1),t=0):Infinity===c||-Infinity===c?(s=(1<<k)-1,k=0,t=0>c?1:0):0===c?(k=s=0,t=-Infinity===1/c?1:0):(t=0>c,c=Math.abs(c),c>=Math.pow(2,1-k)?(d=Math.min(Math.floor(Math.log(c)/Math.LN2),k),s=d+k,k=Math.round(c*Math.pow(2,r-d)-Math.pow(2,r))):(s=0,k=Math.round(c/Math.pow(2,1-k-r))));for(c=[];r;r-=1)c.push(k%2?1:0),k=Math.floor(k/2);for(r=n;r;r-=1)c.push(s%
2?1:0),s=Math.floor(s/2);c.push(t?1:0);c.reverse();return $(c)}function v(c,r,n){var k=[],t,s,k=aa(c);t=k.join("");c=(1<<r-1)-1;k=parseInt(t.substring(0,1),2)?-1:1;s=parseInt(t.substring(1,1+r),2);t=parseInt(t.substring(1+r),2);return s===(1<<r)-1?0!==t?NaN:Infinity*k:0<s?k*Math.pow(2,s-c)*(1+t/Math.pow(2,n)):0!==t?k*Math.pow(2,-(c-1))*(t/Math.pow(2,n)):0>k?-0:0}function D(c){return v(c,11,52)}function H(c){return k(c,11,52)}function P(c){return v(c,8,23)}function Y(c){return k(c,8,23)}var W={ToInt32:function(c){return c>>
0},ToUint32:function(c){return c>>>0}};Object.prototype.__defineGetter__&&!Object.defineProperty&&(Object.defineProperty=function(c,r,n){n.hasOwnProperty("get")&&c.__defineGetter__(r,n.get);n.hasOwnProperty("set")&&c.__defineSetter__(r,n.set)});var R=window.BIG_ENDIAN_ARRAYBUFFERS?x:K,N=window.BIG_ENDIAN_ARRAYBUFFERS?q:U,I=window.BIG_ENDIAN_ARRAYBUFFERS?l:T,ba=window.BIG_ENDIAN_ARRAYBUFFERS?f:O,ca=window.BIG_ENDIAN_ARRAYBUFFERS?g:J,da=window.BIG_ENDIAN_ARRAYBUFFERS?h:X,ea=window.BIG_ENDIAN_ARRAYBUFFERS?
p:c,fa=window.BIG_ENDIAN_ARRAYBUFFERS?B:t,ga=window.BIG_ENDIAN_ARRAYBUFFERS?u:A,ha=window.BIG_ENDIAN_ARRAYBUFFERS?w:G,L=window.BIG_ENDIAN_ARRAYBUFFERS?C:Q,M=window.BIG_ENDIAN_ARRAYBUFFERS?y:z,$=window.BIG_ENDIAN_ARRAYBUFFERS?F:S,aa=window.BIG_ENDIAN_ARRAYBUFFERS?E:r;ArrayBuffer||function(){function c(r,n,k){var t;t=function(c,r,n){var k,s,A;if(arguments.length&&"number"!==typeof arguments[0])if("object"===typeof arguments[0]&&arguments[0].constructor===t)for(k=arguments[0],this.length=k.length,this.byteLength=
this.length*this.BYTES_PER_ELEMENT,this.buffer=new ArrayBuffer(this.byteLength),s=this.byteOffset=0;s<this.length;s+=1)this._setter(s,k._getter(s));else if("object"!==typeof arguments[0]||arguments[0]instanceof ArrayBuffer)if("object"===typeof arguments[0]&&arguments[0]instanceof ArrayBuffer){this.buffer=c;this.byteOffset=W.ToUint32(r);this.byteOffset>this.buffer.byteLength&&e();if(this.byteOffset%this.BYTES_PER_ELEMENT)throw new RangeError("ArrayBuffer length minus the byteOffset is not a multiple of the element size.");
3>arguments.length?(this.byteLength=this.buffer.byteLength-this.byteOffset,this.byteLength%this.BYTES_PER_ELEMENT&&e(),this.length=this.byteLength/this.BYTES_PER_ELEMENT):(this.length=W.ToUint32(n),this.byteLength=this.length*this.BYTES_PER_ELEMENT);this.byteOffset+this.byteLength>this.buffer.byteLength&&e()}else throw new TypeError("Unexpected argument type(s)");else for(k=arguments[0],this.length=W.ToUint32(k.length),this.byteLength=this.length*this.BYTES_PER_ELEMENT,this.buffer=new ArrayBuffer(this.byteLength),
s=this.byteOffset=0;s<this.length;s+=1)A=k[s],this._setter(s,Number(A));else{this.length=W.ToInt32(arguments[0]);if(0>n)throw new RangeError("ArrayBufferView size is not a small enough positive integer.");this.byteLength=this.length*this.BYTES_PER_ELEMENT;this.buffer=new ArrayBuffer(this.byteLength);this.byteOffset=0}this.constructor=t;a(this);d(this)};t.prototype=new ArrayBufferView;t.prototype.BYTES_PER_ELEMENT=r;t.prototype.emulated=!0;t.prototype._pack=n;t.prototype._unpack=k;t.BYTES_PER_ELEMENT=
r;t.prototype._getter=function(c){if(1>arguments.length)throw new SyntaxError("Not enough arguments");c=W.ToUint32(c);if(!(c>=this.length)){var r=[],n,k;n=0;for(k=this.byteOffset+c*this.BYTES_PER_ELEMENT;n<this.BYTES_PER_ELEMENT;n+=1,k+=1)r.push(this.buffer._bytes[k]);return this._unpack(r)}};t.prototype.get=t.prototype._getter;t.prototype._setter=function(c,r){if(2>arguments.length)throw new SyntaxError("Not enough arguments");c=W.ToUint32(c);if(!(c>=this.length)){var n=this._pack(r),k,t;k=0;for(t=
this.byteOffset+c*this.BYTES_PER_ELEMENT;k<this.BYTES_PER_ELEMENT;k+=1,t+=1)this.buffer._bytes[t]=n[k]}};t.prototype.set=function(c,r){if(1>arguments.length)throw new SyntaxError("Not enough arguments");var n,k,t,s,d,a;if("object"===typeof arguments[0]&&arguments[0].constructor===this.constructor)if(n=arguments[0],k=W.ToUint32(arguments[1]),k+n.length>this.length&&e(),a=this.byteOffset+k*this.BYTES_PER_ELEMENT,k=n.length*this.BYTES_PER_ELEMENT,n.buffer===this.buffer){t=[];s=0;for(d=n.byteOffset;s<
k;s+=1,d+=1)t[s]=n.buffer._bytes[d];for(s=0;s<k;s+=1,a+=1)this.buffer._bytes[a]=t[s]}else for(s=0,d=n.byteOffset;s<k;s+=1,d+=1,a+=1)this.buffer._bytes[a]=n.buffer._bytes[d];else if("object"===typeof arguments[0]&&"undefined"!==typeof arguments[0].length)for(n=arguments[0],t=W.ToUint32(n.length),k=W.ToUint32(arguments[1]),k+t>this.length&&e(),s=0;s<t;s+=1)d=n[s],this._setter(k+s,Number(d));else throw new TypeError("Unexpected argument type(s)");};t.prototype.subarray=function(c,n){c=W.ToInt32(c);n=
W.ToInt32(n);1>arguments.length&&(c=0);2>arguments.length&&(n=this.length);0>c&&(c=this.length+c);0>n&&(n=this.length+n);var r=this.length;c=0>c?0:c>r?r:c;r=this.length;r=(0>n?0:n>r?r:n)-c;0>r&&(r=0);return new this.constructor(this.buffer,c*this.BYTES_PER_ELEMENT,r)};return t}ArrayBuffer=function(c){c=W.ToInt32(c);if(0>c)throw new RangeError("ArrayBuffer size is not a small enough positive integer.");this.byteLength=c;this._bytes=[];this._bytes.length=c;for(c=0;c<this.byteLength;c+=1)this._bytes[c]=
0;a(this)};ArrayBuffer.isNative=!1;ArrayBufferView=function(){};Int8Array=Int8Array||c(1,R,N);Uint8Array=Uint8Array||c(1,I,ba);Int16Array=Int16Array||c(2,ca,da);Uint16Array=Uint16Array||c(2,ea,fa);Int32Array=Int32Array||c(4,ga,ha);Uint32Array=Uint32Array||c(4,L,M);Float32Array=Float32Array||c(4,Y,P);Float64Array=Float64Array||c(8,H,D)}();DataView||function(){function c(n,r){return"function"===typeof n.get?n.get(r):n[r]}function n(r){return function(n,t){n=W.ToUint32(n);n+r.BYTES_PER_ELEMENT>this.byteLength&&
e();n+=this.byteOffset;var s=new Uint8Array(this.buffer,n,r.BYTES_PER_ELEMENT),d=[],a;for(a=0;a<r.BYTES_PER_ELEMENT;a+=1)d.push(c(s,a));Boolean(t)===Boolean(k)&&d.reverse();return c(new r((new Uint8Array(d)).buffer),0)}}function r(n){return function(r,t,s){r=W.ToUint32(r);r+n.BYTES_PER_ELEMENT>this.byteLength&&e();t=new n([t]);t=new Uint8Array(t.buffer);var d=[],a;for(a=0;a<n.BYTES_PER_ELEMENT;a+=1)d.push(c(t,a));Boolean(s)===Boolean(k)&&d.reverse();(new Uint8Array(this.buffer,r,n.BYTES_PER_ELEMENT)).set(d)}}
var k=function(){var n=new Uint16Array([4660]),n=new Uint8Array(n.buffer);return 18===c(n,0)}();DataView=function(c,n,r){if(!("object"===typeof c&&c instanceof ArrayBuffer))throw new TypeError("TypeError");this.buffer=c;this.byteOffset=W.ToUint32(n);this.byteOffset>this.buffer.byteLength&&e();this.byteLength=3>arguments.length?this.buffer.byteLength-this.byteOffset:W.ToUint32(r);this.byteOffset+this.byteLength>this.buffer.byteLength&&e();a(this)};ArrayBufferView&&(DataView.prototype=new ArrayBufferView);
DataView.prototype.getUint8=n(Uint8Array);DataView.prototype.getInt8=n(Int8Array);DataView.prototype.getUint16=n(Uint16Array);DataView.prototype.getInt16=n(Int16Array);DataView.prototype.getUint32=n(Uint32Array);DataView.prototype.getInt32=n(Int32Array);DataView.prototype.getFloat32=n(Float32Array);DataView.prototype.getFloat64=n(Float64Array);DataView.prototype.setUint8=r(Uint8Array);DataView.prototype.setInt8=r(Int8Array);DataView.prototype.setUint16=r(Uint16Array);DataView.prototype.setInt16=r(Int16Array);
DataView.prototype.setUint32=r(Uint32Array);DataView.prototype.setInt32=r(Int32Array);DataView.prototype.setFloat32=r(Float32Array);DataView.prototype.setFloat64=r(Float64Array)}()})();window.ArrayBuffer&&!ArrayBuffer.prototype.slice&&(ArrayBuffer.prototype.slice=function(e,a){var d=new Uint8Array(this);void 0===a&&(a=d.length);for(var x=new ArrayBuffer(a-e),q=new Uint8Array(x),l=0;l<q.length;l++)q[l]=d[l+e];return x});
Array.prototype.remove=function(e,a){var d=this.slice((a||e)+1||this.length);this.length=0>e?this.length+e:e;return this.push.apply(this,d)};window.requestAnimFrame=function(e){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){return window.setTimeout(a,1E3/60)}}();
window.cancelAnimFrame=function(e){return window.cancelAnimationFrame||window.webkitCancelAnimationFrame||window.mozCancelAnimationFrame||window.oCancelAnimationFrame||window.msCanelAnimationFrame||function(a){window.clearTimeout(a)}}();function dashOn(e,a,d){return e.setLineDash?(e.setLineDash([a,d]),!0):void 0!==e.mozDash?(e.mozDash=[a,d],!0):e.webkitLineDash&&0===e.webkitLineDash.length?(e.webkitLineDash=[a,d],!0):!1}
function dashOff(e){e.setLineDash?e.setLineDash([]):e.mozDash?e.mozDash=null:e.webkitLineDash&&(e.webkitLineDash=[])}function getKeyCode(e){e=window.event||e;return e=e.charCode||e.keyCode}function setKeypressHandler(e){window.addEventListener?window.addEventListener("keypress",e,!1):window.attachEvent&&window.attachEvent("onkeypress",e)}Array.isArray||(Array.isArray=function(e){return"[object Array]"===Object.prototype.toString.call(e)});
window.Float64Array||(window.Float64Array=function(){return window.Float64Array||function(e,a,d){if(!(e instanceof ArrayBuffer))throw"Invalid type";var x=new DataView(e),q=[];e=(e.byteLength-a)/8;q.length=void 0===d?e:Math.min(d,e);for(d=0;d<q.length;d++)q[d]=x.getFloat64(8*d+a,!0);q.subarray=function(d,a){return q.slice(d,a)};return q}}());
(function(){var e=function(){};window.console||(window.console={log:e,info:e,warn:e,debug:e,error:e});if((new Int8Array([0,1,0])).subarray(1).subarray(1)[0]){var a=function(d,a){0===arguments.length?(d=0,a=this.length):(0>d&&(d+=this.length),d=Math.max(0,Math.min(this.length,d)),1===arguments.length?a=this.length:(0>a&&(a+=this.length),a=Math.max(d,Math.min(this.length,a))));return new this.constructor(this.buffer,this.byteOffset+d*this.BYTES_PER_ELEMENT,a-d)};[Int8Array,Uint8Array,Int16Array,Uint16Array,
Int32Array,Uint32Array,Float32Array,Float64Array].forEach(function(d){d.prototype.subarray=a})}})();
(function(e,a){function d(a,d,h,p){a[q](x+d,"wheel"===l?h:function(a){!a&&(a=e.event);var d={originalEvent:a,target:a.target||a.srcElement,type:"wheel",deltaMode:"MozMousePixelScroll"===a.type?0:1,deltaX:0,delatZ:0,preventDefault:function(){a.preventDefault?a.preventDefault():a.returnValue=!1}};"mousewheel"===l?(d.deltaY=-0.025*a.wheelDelta,a.wheelDeltaX&&(d.deltaX=-0.025*a.wheelDeltaX)):d.deltaY=a.detail;return h(d)},p||!1)}var x="",q,l;e.addEventListener?q="addEventListener":(q="attachEvent",x=
"on");l="onwheel"in a.createElement("div")?"wheel":void 0!==a.onmousewheel?"mousewheel":"DOMMouseScroll";e.addWheelListener=function(a,e,h){d(a,l,e,h);"DOMMouseScroll"===l&&d(a,"MozMousePixelScroll",e,h)}})(window,document);
(function(e){function a(a){a=new Uint8Array(a);if(B)return String.fromCharCode.apply(null,a);for(var d="",e=0;e<a.length;e++)d+=String.fromCharCode(a[e]);return d}function d(d){this.file_name=this.file=null;this.offset=0;this.buf=d;if(null!=this.buf){d=new DataView(this.buf);this.version=a(this.buf.slice(0,4));this.headrep=a(this.buf.slice(4,8));this.datarep=a(this.buf.slice(8,12));var e="EEEI"===this.headrep,f="EEEI"===this.datarep;this.type=d.getUint32(48,e);this["class"]=this.type/1E3;this.format=
a(this.buf.slice(52,54));this.timecode=d.getFloat64(56,e);1===this["class"]?(this.xstart=d.getFloat64(256,e),this.xdelta=d.getFloat64(264,e),this.xunits=d.getInt32(272,e),this.subsize=1):2===this["class"]&&(this.xstart=d.getFloat64(256,e),this.xdelta=d.getFloat64(264,e),this.xunits=d.getInt32(272,e),this.subsize=d.getInt32(276,e),this.ystart=d.getFloat64(280,e),this.ydelta=d.getFloat64(288,e),this.yunits=d.getInt32(296,e));this.data_start=d.getFloat64(32,e);this.data_size=d.getFloat64(40,e);this.setData(this.buf,
this.data_start,this.data_start+this.data_size,f)}}function x(a){var d=document.createElement("a");d.href=a;for(var e=d.protocol.replace(":",""),f=d.hostname,l=d.port,g=d.search,h={},p=d.search.replace(/^\?/,"").split("&"),J=p.length,q=0,c;q<J;q++)p[q]&&(c=p[q].split("="),h[c[0]]=c[1]);return{source:a,protocol:e,host:f,port:l,query:g,params:h,file:(d.pathname.match(/\/([^\/?#]+)$/i)||[null,""])[1],hash:d.hash.replace("#",""),path:d.pathname.replace(/^([^\/])/,"/$1"),relative:(d.href.match(/tps?:\/\/[^\/]+(.+)/)||
[null,""])[1],segments:d.pathname.replace(/^\//,"").split("/")}}function q(d,a,e){e=e||1024;var f=0,l=new ArrayBuffer(d.length),g=new Uint8Array(l),h=function(){for(var p=f+e;f<p;f++)g[f]=d.charCodeAt(f)&255;f>=d.length?a(l):setTimeout(h,0)};setTimeout(h,0)}function l(d){this.options=d}navigator.userAgent.match(/(iPad|iPhone|iPod)/i);var f=function(){var d=new ArrayBuffer(4),a=new Uint32Array(d),d=new Uint8Array(d);a[0]=3735928559;if(239===d[0])return"LE";if(222===d[0])return"BE";throw Error("unknown endianness");
}(),g={S:1,C:2,V:3,Q:4,M:9,X:10,T:16,U:1,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9},h={P:0.125,A:1,O:1,B:1,I:2,L:4,X:8,F:4,D:8},p={P:null,A:null,O:Uint8Array,B:Int8Array,I:Int16Array,L:Int32Array,X:null,F:Float32Array,D:Float64Array},B=!0;try{var u=new UInt8Array(new ArrayBuffer(4));u[0]=66;u[1]=76;u[2]=85;u[3]=69;"BLUE"!==String.fromCharCode.apply(null,u)&&(B=!1)}catch(w){B=!1}d.prototype={setData:function(d,a,e,l){1===this["class"]?(this.spa=g[this.format[0]],this.bps=h[this.format[1]],this.bpa=this.spa*
this.bps,this.ape=1,this.bpe=this.ape*this.bpa):2===this["class"]&&(this.spa=g[this.format[0]],this.bps=h[this.format[1]],this.bpa=this.spa*this.bps,this.ape=this.subsize,this.bpe=this.ape*this.bpa);void 0===l&&(l="LE"===f);if("LE"===f&&!l)throw"Not supported "+f+" "+l;if("BE"===f&&this.littleEndianData)throw"Not supported "+f+" "+l;d?(this.dview=a&&e?this.createArray(d,a,(e-a)/this.bps):this.createArray(d),this.size=this.dview.length/(this.spa*this.ape)):this.dview=this.createArray(null,null,this.size)},
createArray:function(d,a,e){var f=p[this.format[1]];if(void 0===f)throw"unknown format "+this.format[1];void 0===a&&(a=0);void 0===e&&(e=d.length||d.byteLength/h[this.format[1]]);return d?new f(d,a,e):new f(e)}};l.prototype={readheader:function(a,e){var f=new FileReader,l=a.webkitSlice(0,512);f.onloadend=function(a){return function(l){l.target.error?e(null):(l=new d(f.result),l.file=a,e(l))}}(a);f.readAsArrayBuffer(l)},read:function(a,e){var f=new FileReader;f.onloadend=function(a){return function(l){l.target.error?
e(null):(l=new d(f.result),l.file=a,l.file_name=a.name,e(l))}}(a);f.readAsArrayBuffer(a)},read_http:function(a,e){var f=new XMLHttpRequest;f.open("GET",a,!0);f.responseType="arraybuffer";f.overrideMimeType("text/plain; charset=x-user-defined");f.onload=function(l){if(4!==f.readyState||200!==f.status&&0!==f.status)e(null);else if(l=null,f.response){l=f.response;l=new d(l);x(a);var g=x(a);l.file_name=g.file;e(l)}else f.responseText&&q(f.responseText,function(f){f=new d(f);x(a);var l=x(a);f.file_name=
l.file;e(f)})};f.onerror=function(a){e(null)};f.send(null)}};e.BlueHeader=e.BlueHeader||d;e.BlueFileReader=e.BlueFileReader||l})(this);
(function(e){function a(e,p){e=e?e:"";p=p||{};if("object"==typeof e&&e.hasOwnProperty("_tc_id"))return e;var c=d(e),t=c.r,A=c.g,G=c.b,Q=c.a,z=y(100*Q)/100,S=p.format||c.format;1>t&&(t=y(t));1>A&&(A=y(A));1>G&&(G=y(G));return{ok:c.ok,format:S,_tc_id:w++,alpha:Q,toHsv:function(){var c=l(t,A,G);return{h:360*c.h,s:c.s,v:c.v,a:Q}},toHsvString:function(){var c=l(t,A,G),n=y(360*c.h),a=y(100*c.s),c=y(100*c.v);return 1==Q?"hsv("+n+", "+a+"%, "+c+"%)":"hsva("+n+", "+a+"%, "+c+"%, "+z+")"},toHsl:function(){var c=
x(t,A,G);return{h:360*c.h,s:c.s,l:c.l,a:Q}},toHslString:function(){var c=x(t,A,G),n=y(360*c.h),a=y(100*c.s),c=y(100*c.l);return 1==Q?"hsl("+n+", "+a+"%, "+c+"%)":"hsla("+n+", "+a+"%, "+c+"%, "+z+")"},toHex:function(c){return f(t,A,G,c)},toHexString:function(c){return"#"+f(t,A,G,c)},toRgb:function(){return{r:y(t),g:y(A),b:y(G),a:Q}},toRgbString:function(){return 1==Q?"rgb("+y(t)+", "+y(A)+", "+y(G)+")":"rgba("+y(t)+", "+y(A)+", "+y(G)+", "+z+")"},toPercentageRgb:function(){return{r:y(100*g(t,255))+
"%",g:y(100*g(A,255))+"%",b:y(100*g(G,255))+"%",a:Q}},toPercentageRgbString:function(){return 1==Q?"rgb("+y(100*g(t,255))+"%, "+y(100*g(A,255))+"%, "+y(100*g(G,255))+"%)":"rgba("+y(100*g(t,255))+"%, "+y(100*g(A,255))+"%, "+y(100*g(G,255))+"%, "+z+")"},toName:function(){return 0===Q?"transparent":T[f(t,A,G,!0)]||!1},toFilter:function(c){var n=f(t,A,G),d=n,k=Math.round(255*parseFloat(Q)).toString(16),v=k,e=p&&p.gradientType?"GradientType = 1, ":"";c&&(c=a(c),d=c.toHex(),v=Math.round(255*parseFloat(c.alpha)).toString(16));
return"progid:DXImageTransform.Microsoft.gradient("+e+"startColorstr=#"+h(k)+n+",endColorstr=#"+h(v)+d+")"},toString:function(c){var n=!!c;c=c||this.format;var t=!1,n=!n&&1>Q&&0<Q&&("hex"===c||"hex6"===c||"hex3"===c||"name"===c);"rgb"===c&&(t=this.toRgbString());"prgb"===c&&(t=this.toPercentageRgbString());if("hex"===c||"hex6"===c)t=this.toHexString();"hex3"===c&&(t=this.toHexString(!0));"name"===c&&(t=this.toName());"hsl"===c&&(t=this.toHslString());"hsv"===c&&(t=this.toHsvString());return n?this.toRgbString():
t||this.toHexString()}}}function d(a){var d={r:0,g:0,b:0},c=1,t=!1,A=!1;if("string"==typeof a)a:{a=a.replace(B,"").replace(u,"").toLowerCase();var e=!1;if(U[a])a=U[a],e=!0;else if("transparent"==a){a={r:0,g:0,b:0,a:0,format:"name"};break a}var f;a=(f=O.rgb.exec(a))?{r:f[1],g:f[2],b:f[3]}:(f=O.rgba.exec(a))?{r:f[1],g:f[2],b:f[3],a:f[4]}:(f=O.hsl.exec(a))?{h:f[1],s:f[2],l:f[3]}:(f=O.hsla.exec(a))?{h:f[1],s:f[2],l:f[3],a:f[4]}:(f=O.hsv.exec(a))?{h:f[1],s:f[2],v:f[3]}:(f=O.hex6.exec(a))?{r:parseInt(f[1],
16),g:parseInt(f[2],16),b:parseInt(f[3],16),format:e?"name":"hex"}:(f=O.hex3.exec(a))?{r:parseInt(f[1]+""+f[1],16),g:parseInt(f[2]+""+f[2],16),b:parseInt(f[3]+""+f[3],16),format:e?"name":"hex"}:!1}if("object"==typeof a){if(a.hasOwnProperty("r")&&a.hasOwnProperty("g")&&a.hasOwnProperty("b"))d=a.g,t=a.b,d={r:255*g(a.r,255),g:255*g(d,255),b:255*g(t,255)},t=!0,A="%"===String(a.r).substr(-1)?"prgb":"rgb";else if(a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("v")){a.s=p(a.s);a.v=p(a.v);
var A=a.h,e=a.s,d=a.v,A=6*g(A,360),e=g(e,100),d=g(d,100),t=C.floor(A),l=A-t,A=d*(1-e);f=d*(1-l*e);e=d*(1-(1-l)*e);t%=6;d={r:255*[d,f,A,A,e,d][t],g:255*[e,d,d,f,A,A][t],b:255*[A,A,e,d,d,f][t]};t=!0;A="hsv"}else a.hasOwnProperty("h")&&a.hasOwnProperty("s")&&a.hasOwnProperty("l")&&(a.s=p(a.s),a.l=p(a.l),d=q(a.h,a.s,a.l),t=!0,A="hsl");a.hasOwnProperty("a")&&(c=a.a)}c=parseFloat(c);if(isNaN(c)||0>c||1<c)c=1;return{ok:t,format:a.format||A,r:F(255,E(d.r,0)),g:F(255,E(d.g,0)),b:F(255,E(d.b,0)),a:c}}function x(a,
d,c){a=g(a,255);d=g(d,255);c=g(c,255);var t=E(a,d,c),A=F(a,d,c),e,f=(t+A)/2;if(t==A)e=A=0;else{var l=t-A,A=0.5<f?l/(2-t-A):l/(t+A);switch(t){case a:e=(d-c)/l+(d<c?6:0);break;case d:e=(c-a)/l+2;break;case c:e=(a-d)/l+4}e/=6}return{h:e,s:A,l:f}}function q(a,d,c){function t(c,t,a){0>a&&(a+=1);1<a&&(a-=1);return a<1/6?c+6*(t-c)*a:0.5>a?t:a<2/3?c+(t-c)*(2/3-a)*6:c}a=g(a,360);d=g(d,100);c=g(c,100);if(0===d)c=d=a=c;else{var e=0.5>c?c*(1+d):c+d-c*d,f=2*c-e;c=t(f,e,a+1/3);d=t(f,e,a);a=t(f,e,a-1/3)}return{r:255*
c,g:255*d,b:255*a}}function l(a,d,c){a=g(a,255);d=g(d,255);c=g(c,255);var t=E(a,d,c),e=F(a,d,c),f,l=t-e;if(t==e)f=0;else{switch(t){case a:f=(d-c)/l+(d<c?6:0);break;case d:f=(c-a)/l+2;break;case c:f=(a-d)/l+4}f/=6}return{h:f,s:0===t?0:l/t,v:t}}function f(a,d,c,t){a=[h(y(a).toString(16)),h(y(d).toString(16)),h(y(c).toString(16))];return t&&a[0].charAt(0)==a[0].charAt(1)&&a[1].charAt(0)==a[1].charAt(1)&&a[2].charAt(0)==a[2].charAt(1)?a[0].charAt(0)+a[1].charAt(0)+a[2].charAt(0):a.join("")}function g(a,
d){var c=a;"string"==typeof c&&-1!=c.indexOf(".")&&1===parseFloat(c)&&(a="100%");c="string"===typeof a&&-1!=a.indexOf("%");a=F(d,E(0,parseFloat(a)));c&&(a=parseInt(a*d,10)/100);return 1E-6>C.abs(a-d)?1:a%d/parseFloat(d)}function h(a){return 1==a.length?"0"+a:""+a}function p(a){1>=a&&(a=100*a+"%");return a}var B=/^[\s,#]+/,u=/\s+$/,w=0,C=Math,y=C.round,F=C.min,E=C.max,K=C.random;a.fromRatio=function(d,e){if("object"==typeof d){var c={},t;for(t in d)d.hasOwnProperty(t)&&(c[t]="a"===t?d[t]:p(d[t]));
d=c}return a(d,e)};a.equals=function(d,e){return d&&e?a(d).toRgbString()==a(e).toRgbString():!1};a.random=function(){return a.fromRatio({r:K(),g:K(),b:K()})};a.desaturate=function(d,e){e=0===e?0:e||10;var c=a(d).toHsl();c.s-=e/100;c.s=F(1,E(0,c.s));return a(c)};a.saturate=function(d,e){e=0===e?0:e||10;var c=a(d).toHsl();c.s+=e/100;c.s=F(1,E(0,c.s));return a(c)};a.greyscale=function(d){return a.desaturate(d,100)};a.lighten=function(d,e){e=0===e?0:e||10;var c=a(d).toHsl();c.l+=e/100;c.l=F(1,E(0,c.l));
return a(c)};a.darken=function(d,e){e=0===e?0:e||10;var c=a(d).toHsl();c.l-=e/100;c.l=F(1,E(0,c.l));return a(c)};a.complement=function(d){d=a(d).toHsl();d.h=(d.h+180)%360;return a(d)};a.triad=function(d){var e=a(d).toHsl(),c=e.h;return[a(d),a({h:(c+120)%360,s:e.s,l:e.l}),a({h:(c+240)%360,s:e.s,l:e.l})]};a.tetrad=function(d){var e=a(d).toHsl(),c=e.h;return[a(d),a({h:(c+90)%360,s:e.s,l:e.l}),a({h:(c+180)%360,s:e.s,l:e.l}),a({h:(c+270)%360,s:e.s,l:e.l})]};a.splitcomplement=function(d){var e=a(d).toHsl(),
c=e.h;return[a(d),a({h:(c+72)%360,s:e.s,l:e.l}),a({h:(c+216)%360,s:e.s,l:e.l})]};a.analogous=function(d,e,c){e=e||6;c=c||30;var t=a(d).toHsl();c=360/c;d=[a(d)];for(t.h=(t.h-(c*e>>1)+720)%360;--e;)t.h=(t.h+c)%360,d.push(a(t));return d};a.monochromatic=function(d,e){e=e||6;for(var c=a(d).toHsv(),t=c.h,A=c.s,c=c.v,f=[],l=1/e;e--;)f.push(a({h:t,s:A,v:c})),c=(c+l)%1;return f};a.readability=function(d,e){var c=a(d).toRgb(),t=a(e).toRgb(),A=(299*c.r+587*c.g+114*c.b)/1E3,f=(299*t.r+587*t.g+114*t.b)/1E3,c=
Math.max(c.r,t.r)-Math.min(c.r,t.r)+Math.max(c.g,t.g)-Math.min(c.g,t.g)+Math.max(c.b,t.b)-Math.min(c.b,t.b);return{brightness:Math.abs(A-f),color:c}};a.readable=function(d,e){var c=a.readability(d,e);return 125<c.brightness&&500<c.color};a.mostReadable=function(d,e){for(var c=null,t=0,A=!1,f=0;f<e.length;f++){var l=a.readability(d,e[f]),z=125<l.brightness&&500<l.color,l=l.brightness/125*3+l.color/500;if(z&&!A||z&&A&&l>t||!z&&!A&&l>t)A=z,t=l,c=a(e[f])}return c};var U=a.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",
aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",
darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",
grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",
lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",
palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",
tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},T=a.hexNames=function(a){var d={},c;for(c in a)a.hasOwnProperty(c)&&(d[a[c]]=c);return d}(U),O={rgb:RegExp("rgb[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),rgba:RegExp("rgba[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
hsl:RegExp("hsl[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsla:RegExp("hsla[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),hsv:RegExp("hsv[\\s|\\(]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))[,|\\s]+((?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?))\\s*\\)?"),
hex3:/^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};"undefined"!==typeof module&&module.exports?module.exports=a:"undefined"!==typeof define?define(function(){return a}):e.tinycolor=a})(this);
(function(){var e=[];(window.CanvasInput=function(a){var d=this;a=a?a:{};d._canvas=a.canvas||null;d._ctx=d._canvas?d._canvas.getContext("2d"):null;d._x=a.x||0;d._y=a.y||0;d._extraX=a.extraX||0;d._extraY=a.extraY||0;d._fontSize=a.fontSize||14;d._fontFamily=a.fontFamily||"Arial";d._fontColor=a.fontColor||"#000";d._placeHolderColor=a.placeHolderColor||"#bfbebd";d._fontWeight=a.fontWeight||"normal";d._fontStyle=a.fontStyle||"normal";d._readonly=a.readonly||!1;d._maxlength=a.maxlength||null;d._width=a.width||
150;d._height=a.height||d._fontSize;d._padding=0<=a.padding?a.padding:5;d._borderWidth=0<=a.borderWidth?a.borderWidth:1;d._borderColor=a.borderColor||"#959595";d._borderRadius=0<=a.borderRadius?a.borderRadius:3;d._backgroundImage=a.backgroundImage||"";d._boxShadow=a.boxShadow||"1px 1px 0px rgba(255, 255, 255, 1)";d._innerShadow=a.innerShadow||"0px 0px 4px rgba(0, 0, 0, 0.4)";d._selectionColor=a.selectionColor||"rgba(179, 212, 253, 0.8)";d._placeHolder=a.placeHolder||"";d._value=a.value||d._placeHolder;
d._onsubmit=a.onsubmit||function(){};d._onkeydown=a.onkeydown||function(){};d._onkeyup=a.onkeyup||function(){};d._onfocus=a.onfocus||function(){};d._onblur=a.onblur||function(){};d._cursor=!1;d._cursorPos=0;d._hasFocus=!1;d._selection=[0,0];d._wasOver=!1;d._renderOnReturn=void 0!==a.renderOnReturn?a.renderOnReturn:!0;d._disableBlur=a.disableBlur||!1;d._tabToClear=a.tabToClear||!1;d.boxShadow(d._boxShadow,!0);d._calcWH();d._renderCanvas=document.createElement("canvas");d._renderCanvas.setAttribute("width",
d.outerW);d._renderCanvas.setAttribute("height",d.outerH);d._renderCtx=d._renderCanvas.getContext("2d");d._shadowCanvas=document.createElement("canvas");d._shadowCanvas.setAttribute("width",d._width+2*d._padding);d._shadowCanvas.setAttribute("height",d._height+2*d._padding);d._shadowCtx=d._shadowCanvas.getContext("2d");"undefined"!==typeof a.backgroundGradient?(d._backgroundColor=d._renderCtx.createLinearGradient(0,0,0,d.outerH),d._backgroundColor.addColorStop(0,a.backgroundGradient[0]),d._backgroundColor.addColorStop(1,
a.backgroundGradient[1])):d._backgroundColor=a.backgroundColor||"#fff";d._canvas&&(d.mousemoveCanvasListener=function(a){a=a||window.event;d.mousemove(a,d)},d._canvas.addEventListener("mousemove",d.mousemoveCanvasListener,!1),d.mousedownCanvasListener=function(a){a=a||window.event;d.mousedown(a,d)},d._canvas.addEventListener("mousedown",d.mousedownCanvasListener,!1),d.mouseupCanvasListener=function(a){a=a||window.event;d.mouseup(a,d)},d._canvas.addEventListener("mouseup",d.mouseupCanvasListener,!1));
d.mouseupWindowListener=function(a){d._hasFocus&&!d._mouseDown&&d.blur()};window.addEventListener("mouseup",d.mouseupWindowListener,!0);d.keydownWindowListener=function(a){a=a||window.event;d._hasFocus&&d.keydown(a,d)};window.addEventListener("keydown",d.keydownWindowListener,!1);d.keyupWindowListener=function(a){a=a||window.event;d._hasFocus&&d._onkeyup(a,d)};window.addEventListener("keyup",d.keyupWindowListener,!1);d.pasteWindowListener=function(a){a=a||window.event;if(d._hasFocus){a=a.clipboardData.getData("text/plain");
var e=d._value.substr(0,d._cursorPos),l=d._value.substr(d._cursorPos);d._value=e+a+l;d._cursorPos+=a.length;d.render()}};window.addEventListener("paste",d.pasteWindowListener,!1);e.push(d);d._inputsIndex=e.length-1;d.render()}).prototype={canvas:function(a){return"undefined"!==typeof a?(this._canvas=a,this._ctx=this._canvas.getContext("2d"),this.render()):this._canvas},x:function(a){return"undefined"!==typeof a?(this._x=a,this.render()):this._x},y:function(a){return"undefined"!==typeof a?(this._y=
a,this.render()):this._y},extraX:function(a){return"undefined"!==typeof a?(this._extraX=a,this.render()):this._extraX},extraY:function(a){return"undefined"!==typeof a?(this._extraY=a,this.render()):this._extraY},fontSize:function(a){return"undefined"!==typeof a?(this._fontSize=a,this.render()):this._fontSize},fontFamily:function(a){return"undefined"!==typeof a?(this._fontFamily=a,this.render()):this._fontFamily},fontColor:function(a){return"undefined"!==typeof a?(this._fontColor=a,this.render()):
this._fontColor},placeHolderColor:function(a){return"undefined"!==typeof a?(this._placeHolderColor=a,this.render()):this._placeHolderColor},fontWeight:function(a){return"undefined"!==typeof a?(this._fontWeight=a,this.render()):this._fontWeight},fontStyle:function(a){return"undefined"!==typeof a?(this._fontStyle=a,this.render()):this._fontStyle},width:function(a){return"undefined"!==typeof a?(this._width=a,this._calcWH(),this._updateCanvasWH(),this.render()):this._width},height:function(a){return"undefined"!==
typeof a?(this._height=a,this._calcWH(),this._updateCanvasWH(),this.render()):this._height},padding:function(a){return"undefined"!==typeof a?(this._padding=a,this._calcWH(),this._updateCanvasWH(),this.render()):this._padding},borderWidth:function(a){return"undefined"!==typeof a?(this._borderWidth=a,this._calcWH(),this._updateCanvasWH(),this.render()):this._borderWidth},borderColor:function(a){return"undefined"!==typeof a?(this._borderColor=a,this.render()):this._borderColor},borderRadius:function(a){return"undefined"!==
typeof a?(this._borderRadius=a,this.render()):this._borderRadius},backgroundColor:function(a){return"undefined"!==typeof a?(this._backgroundColor=a,this.render()):this._backgroundColor},backgroundGradient:function(a){return"undefined"!==typeof a?(this._backgroundColor=this._renderCtx.createLinearGradient(0,0,0,this.outerH),this._backgroundColor.addColorStop(0,a[0]),this._backgroundColor.addColorStop(1,a[1]),this.render()):this._backgroundColor},boxShadow:function(a,d){if("undefined"!==typeof a){var e=
a.split("px ");this._boxShadow={x:"none"===this._boxShadow?0:parseInt(e[0],10),y:"none"===this._boxShadow?0:parseInt(e[1],10),blur:"none"===this._boxShadow?0:parseInt(e[2],10),color:"none"===this._boxShadow?"":e[3]};this.shadowL=0>this._boxShadow.x?Math.abs(this._boxShadow.x)+this._boxShadow.blur:Math.abs(this._boxShadow.blur-this._boxShadow.x);this.shadowR=this._boxShadow.blur+this._boxShadow.x;this.shadowT=0>this._boxShadow.y?Math.abs(this._boxShadow.y)+this._boxShadow.blur:Math.abs(this._boxShadow.blur-
this._boxShadow.y);this.shadowB=this._boxShadow.blur+this._boxShadow.y;this.shadowW=this.shadowL+this.shadowR;this.shadowH=this.shadowT+this.shadowB;this._calcWH();if(!d)return this._updateCanvasWH(),this.render()}else return this._boxShadow},innerShadow:function(a){return"undefined"!==typeof a?(this._innerShadow=a,this.render()):this._innerShadow},selectionColor:function(a){return"undefined"!==typeof a?(this._selectionColor=a,this.render()):this._selectionColor},placeHolder:function(a){return"undefined"!==
typeof a?(this._placeHolder=a,this.render()):this._placeHolder},value:function(a){return"undefined"!==typeof a?(this._value=a,this.focus()):this._value},onsubmit:function(a){if("undefined"!==typeof a)return this._onsubmit=a,this;this._onsubmit()},onkeydown:function(a){if("undefined"!==typeof a)return this._onkeydown=a,this;this._onkeydown()},onkeyup:function(a){if("undefined"!==typeof a)return this._onkeyup=a,this;this._onkeyup()},focus:function(a){var d=this,e;if(!d._readonly){d._hasFocus||d._onfocus(d);
d._selectionUpdated?delete d._selectionUpdated:d._selection=[0,0];d._cursorPos="number"===typeof a?a:d._clipText().length;d._placeHolder===d._value&&(d._value="");d._hasFocus=!0;d._cursor=!0;d._cursorInterval&&clearInterval(d._cursorInterval);d._cursorInterval=setInterval(function(){d._cursor=!d._cursor;d.render()},500);a=navigator.userAgent.toLowerCase();a=0<=a.indexOf("chrome")&&0<=a.indexOf("mobile")&&0<=a.indexOf("android");var q="undefined"!==typeof window.orientation;q&&!a&&document&&document.createElement&&
(e=document.createElement("input"))?(e.type="text",e.style.opacity=0,e.style.position="absolute",e.style.left=d._x+d._extraX+(d._canvas?d._canvas.offsetLeft:0)+"px",e.style.top=d._y+d._extraY+(d._canvas?d._canvas.offsetTop:0)+"px",e.style.width=d._width,e.style.height=0,document.body.appendChild(e),e.focus(),e.addEventListener("blur",function(){d.blur(d)},!1)):q&&d.value(prompt(d._placeHolder)||"");return d.render()}},blur:function(a){a=a||this;a._disableBlur||(a._onblur(a),a._cursorInterval&&clearInterval(a._cursorInterval),
a._hasFocus=!1,a._cursor=!1,a._selection=[0,0],""===a._value&&(a._value=a._placeHolder));return a.render()},disableBlur:function(a){(a||this)._disableBlur=!0},enableBlur:function(a){(a||this)._disableBlur=!1},keydown:function(a,d){var x=a.which,q=a.shiftKey,l=null,f;if(d._hasFocus){d._onkeydown(a,d);if(65===x&&(a.ctrlKey||a.metaKey))return d._selection=[0,d._value.length],a.preventDefault(),d.render();if(17===x||a.metaKey||a.ctrlKey)return d;a.preventDefault();if(8===x)!d._clearSelection()&&0<d._cursorPos&&
(q=d._value.substr(0,d._cursorPos-1),f=d._value.substr(d._cursorPos,d._value.length),d._value=q+f,d._cursorPos--);else if(37===x)0<d._cursorPos&&(d._cursorPos--,d._cursor=!0,d._selection=[0,0]);else if(39===x)d._cursorPos<d._value.length&&(d._cursorPos++,d._cursor=!0,d._selection=[0,0]);else if(13===x)d._onsubmit(a,d);else if(9===x)if(d._tabToClear)d._value="",d._cursorPos=0;else{var g=e[d._inputsIndex+1]?d._inputsIndex+1:0;g!==d._inputsIndex&&(d.blur(),setTimeout(function(){e[g].focus()},10))}else if(l=
d._mapCodeToKey(q,x)){d._clearSelection();if(d._maxlength&&d._maxlength<=d._value.length)return;q=d._value?d._value.substr(0,d._cursorPos):"";f=d._value?d._value.substr(d._cursorPos):"";d._value=q+l+f;d._cursorPos++}return 13==x&&d._renderOnReturn||13!==x?d.render():function(){}}},click:function(a,d){var e=d._mousePos(a),q=e.x,e=e.y;if(d._endSelection)delete d._endSelection,delete d._selectionUpdated;else if(d._canvas&&d._overInput(q,e)||!d._canvas){if(d._mouseDown)return d._mouseDown=!1,d.click(a,
d),d.focus(d._clickPos(q,e))}else return d.blur()},mousemove:function(a,d){var e=d._mousePos(a),q=e.x,l=e.y;(e=d._overInput(q,l))&&d._canvas?(d._canvas.style.cursor="text",d._wasOver=!0):d._wasOver&&d._canvas&&(d._canvas.style.cursor="default",d._wasOver=!1);if(d._hasFocus&&0<=d._selectionStart)if(l=d._clickPos(q,l),q=Math.min(d._selectionStart,l),l=Math.max(d._selectionStart,l),!e)d._selectionUpdated=!0,d._endSelection=!0,delete d._selectionStart,d.render();else if(d._selection[0]!==q||d._selection[1]!==
l)d._selection=[q,l],d.render()},mousedown:function(a,d){var e=d._mousePos(a),q=e.x,e=e.y,l=d._overInput(q,e);d._mouseDown=l;d._hasFocus&&l&&(d._selectionStart=d._clickPos(q,e))},mouseup:function(a,d){var e=d._mousePos(a),q=e.x,e=e.y,l=d._clickPos(q,e)!==d._selectionStart;d._hasFocus&&0<=d._selectionStart&&d._overInput(q,e)&&l?(d._selectionUpdated=!0,delete d._selectionStart,d.render()):delete d._selectionStart;d.click(a,d)},renderCanvas:function(){return this._renderCanvas},cleanup:function(){this._canvas.removeEventListener("mouseup",
this.mouseupCanvasListener,!1);this._canvas.removeEventListener("mousedown",this.mousedownCanvasListener,!1);this._canvas.removeEventListener("mousemove",this.mousemoveCanvasListener,!1);window.removeEventListener("keydown",this.keydownWindowListener,!1);window.removeEventListener("keyup",this.keyupWindowListener,!1);window.removeEventListener("mouseup",this.mouseupWindowListener,!0);window.removeEventListener("paste",this.pasteWindowListener,!1);clearInterval(this._cursorInterval);this._canvas.style.cursor=
"default";for(var a=0;a<e.length;a++)e[a]===this&&e.remove(a)},render:function(){var a=this,d=a._renderCtx,e=a.outerW,q=a.outerH,l=a._borderRadius,f=a._borderWidth,g=a.shadowW,h=a.shadowH;d.clearRect(0,0,d.canvas.width,d.canvas.height);d.shadowOffsetX=a._boxShadow.x;d.shadowOffsetY=a._boxShadow.y;d.shadowBlur=a._boxShadow.blur;d.shadowColor=a._boxShadow.color;0<a._borderWidth&&(d.fillStyle=a._borderColor,a._roundedRect(d,a.shadowL,a.shadowT,e-g,q-h,l),d.fill(),d.shadowOffsetX=0,d.shadowOffsetY=0,
d.shadowBlur=0);a._drawTextBox(function(){d.shadowOffsetX=0;d.shadowOffsetY=0;d.shadowBlur=0;var p=a._clipText(),B=a._padding+a._borderWidth+a.shadowT;if(0<a._selection[1]){var u=a._textWidth(p.substring(0,a._selection[0])),w=a._textWidth(p.substring(a._selection[0],a._selection[1]));d.fillStyle=a._selectionColor;d.fillRect(B+u,B,w,a._height)}d.fillStyle=a._placeHolder===a._value&&""!==a._value?a._placeHolderColor:a._fontColor;a._cursor&&(u=a._textWidth(p.substring(0,a._cursorPos)),d.fillRect(B+u,
B,1,a._height));u=a._padding+a._borderWidth+a.shadowL;B=Math.round(B+a._height/2);d.font=a._fontStyle+" "+a._fontWeight+" "+a._fontSize+"px "+a._fontFamily;d.textAlign="left";d.textBaseline="middle";d.fillText(p,u,B);w=a._innerShadow.split("px ");p="none"===a._innerShadow?0:parseInt(w[0],10);B="none"===a._innerShadow?0:parseInt(w[1],10);u="none"===a._innerShadow?0:parseInt(w[2],10);w="none"===a._innerShadow?"":w[3];if(0<u){var C=a._shadowCtx,y=C.canvas.width,F=C.canvas.height;C.clearRect(0,0,y,F);
C.shadowBlur=u;C.shadowColor=w;C.shadowOffsetX=0;C.shadowOffsetY=B;C.fillRect(-1*e,-100,3*e,100);C.shadowOffsetX=p;C.shadowOffsetY=0;C.fillRect(y,-1*q,100,3*q);C.shadowOffsetX=0;C.shadowOffsetY=B;C.fillRect(-1*e,F,3*e,100);C.shadowOffsetX=p;C.shadowOffsetY=0;C.fillRect(-100,-1*q,100,3*q);a._roundedRect(d,f+a.shadowL,f+a.shadowT,e-2*f-g,q-2*f-h,l);d.clip();d.drawImage(a._shadowCanvas,0,0,y,F,f+a.shadowL,f+a.shadowT,y,F)}a._ctx&&(a._ctx.clearRect(a._x,a._y,d.canvas.width,d.canvas.height),a._ctx.drawImage(a._renderCanvas,
a._x,a._y));return a})},_drawTextBox:function(a){var d=this,e=d._renderCtx,q=d.outerW,l=d.outerH,f=d._borderRadius,g=d._borderWidth,h=d.shadowW,p=d.shadowH;if(""===d._backgroundImage)e.fillStyle=d._backgroundColor,d._roundedRect(e,g+d.shadowL,g+d.shadowT,q-2*g-h,l-2*g-p,f),e.fill(),a();else{var B=new Image;B.src=d._backgroundImage;B.onload=function(){e.drawImage(B,0,0,B.width,B.height,g+d.shadowL,g+d.shadowT,q,l);a()}}},_clearSelection:function(){if(0<this._selection[1]){var a=this._selection[0],
d=this._selection[1];this._value=this._value.substr(0,a)+this._value.substr(d);this._cursorPos=a;this._cursorPos=0>this._cursorPos?0:this._cursorPos;this._selection=[0,0];return!0}return!1},_clipText:function(a){a="undefined"===typeof a?this._value:a;var d=this._textWidth(a)/(this._width-this._padding);return(1<d?a.substr(-1*Math.floor(a.length/d)):a)+""},_textWidth:function(a){var d=this._renderCtx;d.font=this._fontStyle+" "+this._fontWeight+" "+this._fontSize+"px "+this._fontFamily;d.textAlign=
"left";return d.measureText(a).width},_calcWH:function(){this.outerW=this._width+2*this._padding+2*this._borderWidth+this.shadowW;this.outerH=this._height+2*this._padding+2*this._borderWidth+this.shadowH},_updateCanvasWH:function(){var a=this._renderCanvas.width,d=this._renderCanvas.height;this._renderCanvas.setAttribute("width",this.outerW);this._renderCanvas.setAttribute("height",this.outerH);this._shadowCanvas.setAttribute("width",this._width+2*this._padding);this._shadowCanvas.setAttribute("height",
this._height+2*this._padding);this._ctx&&this._ctx.clearRect(this._x,this._y,a,d)},_roundedRect:function(a,d,e,q,l,f){q<2*f&&(f=q/2);l<2*f&&(f=l/2);a.beginPath();a.moveTo(d+f,e);a.lineTo(d+q-f,e);a.quadraticCurveTo(d+q,e,d+q,e+f);a.lineTo(d+q,e+l-f);a.quadraticCurveTo(d+q,e+l,d+q-f,e+l);a.lineTo(d+f,e+l);a.quadraticCurveTo(d,e+l,d,e+l-f);a.lineTo(d,e+f);a.quadraticCurveTo(d,e,d+f,e);a.closePath()},_overInput:function(a,d){var e=a<=this._x+this._extraX+this._width+2*this._padding,q=d>=this._y+this._extraY,
l=d<=this._y+this._extraY+this._height+2*this._padding;return a>=this._x+this._extraX&&e&&q&&l},_clickPos:function(a,d){var e=this._value;this._value===this._placeHolder&&(e="");var e=this._clipText(e),q=0,l=e.length;if(a-(this._x+this._extraX)<this._textWidth(e))for(var f=0;f<e.length;f++)if(q+=this._textWidth(e[f]),q>=a-(this._x+this._extraX)){l=f;break}return l},_mousePos:function(a){var d=a.target,e=document.defaultView.getComputedStyle(d,void 0),q=parseInt(e.paddingLeft,10)||0,l=parseInt(e.paddingLeft,
10)||0,f=parseInt(e.borderLeftWidth,10)||0,e=parseInt(e.borderLeftWidth,10)||0,g=document.body.parentNode.offsetTop||0,h=document.body.parentNode.offsetLeft||0,p=0,B=0;if("unefined"!==typeof d.offsetParent){do p+=d.offsetLeft,B+=d.offsetTop;while(d=d.offsetParent)}return{x:a.pageX-(p+(q+f+h)),y:a.pageY-(B+(l+e+g))}},_mapCodeToKey:function(a,d){for(var e=[8,9,13,16,17,18,20,27,91,92],q="",q=0;q<e.length;q++)if(d===e[q])return;if("boolean"===typeof a&&"number"===typeof d)return e={32:" ",48:")",49:"!",
50:"@",51:"#",52:"$",53:"%",54:"^",55:"&",56:"*",57:"(",59:":",107:"+",189:"_",186:":",187:"+",188:"<",190:">",191:"?",192:"~",219:"{",220:"|",221:"}",222:'"'},q=a?65<=d&&90>=d?String.fromCharCode(d):e[d]:65<=d&&90>=d?String.fromCharCode(d).toLowerCase():96===d?"0":97===d?"1":98===d?"2":99===d?"3":100===d?"4":101===d?"5":102===d?"6":103===d?"7":104===d?"8":105===d?"9":188===d?",":190===d?".":191===d?"/":192===d?"`":220===d?"\\":187===d?"=":189===d?"-":222===d?"'":186===d?";":219===d?"[":221===d?"]":
String.fromCharCode(d)}}})();
(function(e,a){"object"==typeof exports?module.exports=a():"function"==typeof define&&define.amd?define(a):e.Spinner=a()})(this,function(){function e(a,d){var e=document.createElement(a||"div"),f;for(f in d)e[f]=d[f];return e}function a(a){for(var d=1,e=arguments.length;d<e;d++)a.appendChild(arguments[d]);return a}function d(a,d,e,f){var l=["opacity",d,~~(100*a),e,f].join("-");e=0.01+e/f*100;f=Math.max(1-(1-a)/d*(100-e),a);var g=w.substring(0,w.indexOf("Animation")).toLowerCase();u[l]||(C.insertRule("@"+
(g&&"-"+g+"-"||"")+"keyframes "+l+"{0%{opacity:"+f+"}"+e+"%{opacity:"+a+"}"+(e+0.01)+"%{opacity:1}"+(e+d)%100+"%{opacity:"+a+"}100%{opacity:"+f+"}}",C.cssRules.length),u[l]=1);return l}function x(a,d){var e=a.style,f,l;d=d.charAt(0).toUpperCase()+d.slice(1);for(l=0;l<B.length;l++)if(f=B[l]+d,void 0!==e[f])return f;if(void 0!==e[d])return d}function q(a,d){for(var e in d)a.style[x(a,e)||e]=d[e];return a}function l(a){for(var d=1;d<arguments.length;d++){var e=arguments[d],f;for(f in e)void 0===a[f]&&
(a[f]=e[f])}return a}function f(a){for(var d={x:a.offsetLeft,y:a.offsetTop};a=a.offsetParent;)d.x+=a.offsetLeft,d.y+=a.offsetTop;return d}function g(a,d){return"string"==typeof a?a:a[d%a.length]}function h(a){if("undefined"==typeof this)return new h(a);this.opts=l(a||{},h.defaults,y)}function p(){function d(a,f){return e("<"+a+' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">',f)}C.addRule(".spin-vml","behavior:url(#default#VML)");h.prototype.lines=function(e,f){function l(){return q(d("group",
{coordsize:B+" "+B,coordorigin:-p+" "+-p}),{width:B,height:B})}function h(c,e,Q){a(t,a(q(l(),{rotation:360/f.lines*c+"deg",left:~~e}),a(q(d("roundrect",{arcsize:f.corners}),{width:p,height:f.width,left:f.radius,top:-f.width>>1,filter:Q}),d("fill",{color:g(f.color,c),opacity:f.opacity}),d("stroke",{opacity:0}))))}var p=f.length+f.width,B=2*p,c=2*-(f.width+f.length)+"px",t=q(l(),{position:"absolute",top:c,left:c});if(f.shadow)for(c=1;c<=f.lines;c++)h(c,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");
for(c=1;c<=f.lines;c++)h(c);return a(e,t)};h.prototype.opacity=function(a,d,e,f){a=a.firstChild;f=f.shadow&&f.lines||0;a&&d+f<a.childNodes.length&&(a=(a=(a=a.childNodes[d+f])&&a.firstChild)&&a.firstChild)&&(a.opacity=e)}}var B=["webkit","Moz","ms","O"],u={},w,C=function(){var d=e("style",{type:"text/css"});a(document.getElementsByTagName("head")[0],d);return d.sheet||d.styleSheet}(),y={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:0.25,fps:20,
zIndex:2E9,className:"spinner",top:"auto",left:"auto",position:"relative"};h.defaults={};l(h.prototype,{spin:function(a){this.stop();var d=this,l=d.opts,g=d.el=q(e(0,{className:l.className}),{position:l.position,width:0,zIndex:l.zIndex}),h=l.radius+l.length+l.width,p,B;a&&(a.insertBefore(g,a.firstChild||null),B=f(a),p=f(g),q(g,{left:("auto"==l.left?B.x-p.x+(a.offsetWidth>>1):parseInt(l.left,10)+h)+"px",top:("auto"==l.top?B.y-p.y+(a.offsetHeight>>1):parseInt(l.top,10)+h)+"px"}));g.setAttribute("role",
"progressbar");d.lines(g,d.opts);if(!w){var c=0,t=(l.lines-1)*(1-l.direction)/2,A,G=l.fps,Q=G/l.speed,z=(1-l.opacity)/(Q*l.trail/100),S=Q/l.lines;(function n(){c++;for(var a=0;a<l.lines;a++)A=Math.max(1-(c+(l.lines-a)*S)%Q*z,l.opacity),d.opacity(g,a*l.direction+t,A,l);d.timeout=d.el&&setTimeout(n,~~(1E3/G))})()}return d},stop:function(){var a=this.el;a&&(clearTimeout(this.timeout),a.parentNode&&a.parentNode.removeChild(a),this.el=void 0);return this},lines:function(f,l){function h(a,c){return q(e(),
{position:"absolute",width:l.length+l.width+"px",height:l.width+"px",background:a,boxShadow:c,transformOrigin:"left",transform:"rotate("+~~(360/l.lines*p+l.rotate)+"deg) translate("+l.radius+"px,0)",borderRadius:(l.corners*l.width>>1)+"px"})}for(var p=0,B=(l.lines-1)*(1-l.direction)/2,C;p<l.lines;p++)C=q(e(),{position:"absolute",top:1+~(l.width/2)+"px",transform:l.hwaccel?"translate3d(0,0,0)":"",opacity:l.opacity,animation:w&&d(l.opacity,l.trail,B+p*l.direction,l.lines)+" "+1/l.speed+"s linear infinite"}),
l.shadow&&a(C,q(h("#000","0 0 4px #000"),{top:"2px"})),a(f,a(C,h(g(l.color,p),"0 0 1px rgba(0,0,0,.1)")));return f},opacity:function(a,d,e){d<a.childNodes.length&&(a.childNodes[d].style.opacity=e)}});var F=q(e("group"),{behavior:"url(#default#VML)"});!x(F,"transform")&&F.adj?p():w=x(F,"animation");return h});window.m=window.m||{};
(function(e,a){var d="undefined";(function(a){e.log=a()})(function(){function e(d,f){var l=d[f];if(l.bind===a){if(Function.prototype.bind===a)return q(l,d);try{return Function.prototype.bind.call(d[f],d)}catch(g){return q(l,d)}}else return d[f].bind(d)}function q(a,d){return function(){Function.prototype.apply.apply(a,[d,arguments])}}function l(a){for(var d=0;d<u.length;d++)p[u[d]]=a(u[d])}function f(){return typeof window!==d&&window.document!==a&&window.document.cookie!==a}function g(){try{return typeof window!==
d&&window.localStorage!==a}catch(e){return!1}}function h(a){var d=!1,e,l;for(l in p.levels)if(p.levels.hasOwnProperty(l)&&p.levels[l]===a){e=l;break}if(g())try{window.localStorage.mloglevel=e}catch(h){d=!0}else d=!0;d&&f()&&(window.document.cookie="mloglevel="+e+";")}var p={},B=function(){},u=["trace","debug","info","warn","error"],w=/mloglevel=([^;]+)/;p.levels={TRACE:0,DEBUG:1,INFO:2,WARN:3,ERROR:4,SILENT:5};p.setLevel=function(f){if("number"===typeof f&&0<=f&&f<=p.levels.SILENT)if(h(f),f===p.levels.SILENT)l(function(){return B});
else{if(typeof console===d)return l(function(a){return function(){typeof console!==d&&(p.setLevel(f),p[a].apply(p,arguments))}}),"No console available for logging";l(function(l){return f<=p.levels[l.toUpperCase()]?typeof console===d?B:console[l]===a?console.log!==a?e(console,"log"):B:e(console,l):B})}else if("string"===typeof f&&p.levels[f.toUpperCase()]!==a)p.setLevel(p.levels[f.toUpperCase()]);else throw"log.setLevel() called with invalid level: "+f;};p.enableAll=function(){p.setLevel(p.levels.TRACE)};
p.disableAll=function(){p.setLevel(p.levels.SILENT)};(function(){var d;g()&&(d=window.localStorage.mloglevel);d===a&&f()&&(d=(w.exec(window.document.cookie)||[])[1]);p.levels[d]===a&&(d="WARN");p.setLevel(p.levels[d])})();return p})})(window.m);window.m=window.m||{};
(function(e,a){function d(a){return(10>a?"0":"")+a}var x={0:["None","U"],1:["Time","sec"],2:["Delay","sec"],3:["Frequency","Hz"],4:["Time code format",""],5:["Distance","m"],6:["Speed","m/s"],7:["Acceleration","m/sec^2"],8:["Jerk","m/sec^3"],9:["Doppler","Hz"],10:["Doppler rate","Hz/sec"],11:["Energy","J"],12:["Power","W"],13:["Mass","g"],14:["Volume","l"],15:["Angular power density","W/ster"],16:["Integrated power density","W/rad"],17:["Spatial power density","W/m^2"],18:["Integrated power density",
"W/m"],19:["Spectral power density","W/MHz"],20:["Amplitude","U"],21:["Real","U"],22:["Imaginary","U"],23:["Phase","rad"],24:["Phase","deg"],25:["Phase","cycles"],26:["10*Log","U"],27:["20*Log","U"],28:["Magnitude","U"],29:["Unknown","U"],30:["Unknown","U"],31:["General dimensionless",""],32:["Counts",""],33:["Angle","rad"],34:["Angle","deg"],35:["Relative power","dB"],36:["Relative power","dBm"],37:["Relative power","dBW"],38:["Solid angle","ster"],40:["Distance","ft"],41:["Distance","nmi"],42:["Speed",
"ft/sec"],43:["Speed","nmi/sec"],44:["Speed","knots=nmi/hr"],45:["Acceleration","ft/sec^2"],46:["Acceleration","nmi/sec^2"],47:["Acceleration","knots/sec"],48:["Acceleration","G"],49:["Jerk","G/sec"],50:["Rotation","rps"],51:["Rotation","rpm"],52:["Angular velocity","rad/sec"],53:["Angular velocity","deg/sec"],54:["Angular acceleration","rad/sec^2"],55:["Angular acceleration","deg/sec^2"],60:["Latitude","deg"],61:["Longitude","deg"],62:["Altitude","ft"],63:["Altitude","m"]};e.Mc={colormap:[[{pos:0,
red:0,green:0,blue:0},{pos:60,red:50,green:50,blue:50},{pos:100,red:100,green:100,blue:100},{pos:100,red:0,green:0,blue:0},{pos:100,red:0,green:0,blue:0},{pos:100,red:0,green:0,blue:0},{pos:100,red:0,green:0,blue:0}],[{pos:0,red:0,green:0,blue:15},{pos:10,red:0,green:0,blue:50},{pos:31,red:0,green:65,blue:75},{pos:50,red:0,green:85,blue:0},{pos:70,red:75,green:80,blue:0},{pos:83,red:100,green:60,blue:0},{pos:100,red:100,green:0,blue:0}],[{pos:0,red:100,green:100,blue:0},{pos:20,red:0,green:80,blue:40},
{pos:30,red:0,green:100,blue:100},{pos:50,red:10,green:10,blue:0},{pos:65,red:100,green:0,blue:0},{pos:88,red:100,green:40,blue:0},{pos:100,red:100,green:100,blue:0}],[{pos:0,red:0,green:75,blue:0},{pos:22,red:0,green:90,blue:90},{pos:37,red:0,green:0,blue:85},{pos:49,red:90,green:0,blue:85},{pos:68,red:90,green:0,blue:0},{pos:80,red:90,green:90,blue:0},{pos:100,red:95,green:95,blue:95}],[{pos:0,red:10,green:0,blue:23},{pos:18,red:34,green:0,blue:60},{pos:36,red:58,green:20,blue:47},{pos:55,red:74,
green:20,blue:28},{pos:72,red:90,green:43,blue:0},{pos:87,red:100,green:72,blue:0},{pos:100,red:100,green:100,blue:76}]]};e.PIPESIZE=1048576;e.initialize=function(a,d){var g=new BlueHeader(null);g.version="BLUE";g.size=0;g.type=1E3;g.format="SF";g.timecode=0;g.xstart=0;g.xdelta=1;g.xunits=0;g.subsize=1;g.ystart=0;g.ydelta=1;g.yunits=0;d||(d={});for(var h in d)g[h]=d[h];g["class"]=g.type/1E3;d.pipe?(g.pipe=!0,g.in_byte=0,g.out_byte=0,g.buf=new ArrayBuffer(d.pipesize||e.PIPESIZE),g.setData(g.buf),g.data_free=
g.dview.length):g.setData(a);return g};e.force1000=function(a){2===a["class"]&&(a.size*=a.subsize,a.bpe/=a.subsize,a.ape=1)};e.grab=function(d,e,g,h){if(!d.dview)return 0;"C"===d.format[0]&&(g*=2);h=Math.min(e.length,d.dview.length-g);if(e.set===a)for(var p=0;p<h;p++)e[p]=d.dview[g+p];else e.set(d.dview.subarray(g,g+h));"C"===d.format[0]&&(h/=2);return h};e.filad=function(a,d,e){if(a.data_free<d.length)throw"Pipe full";var h=a.in_byte/a.dview.BYTES_PER_ELEMENT,p=h+d.length;if(p>a.dview.length){var p=
a.dview.length-h,q=d.length-p;d.subarray?(a.dview.set(d.subarray(0,p),h),a.dview.set(d.subarray(p,d.length),0)):(a.dview.set(d.slice(0,p),h),a.dview.set(d.slice(p,d.length),0));a.in_byte=q*a.dview.BYTES_PER_ELEMENT}else a.dview.set(d,h),a.in_byte=p*a.dview.BYTES_PER_ELEMENT%a.buf.byteLength;a.data_free-=d.length;if(a.onwritelisteners)for(d=0;d<a.onwritelisteners.length;d++)if(e)a.onwritelisteners[d]();else window.setTimeout(a.onwritelisteners[d],0)};e.pavail=function(a){return a.dview.length-a.data_free};
e.grabx=function(d,e,g,h){var p=d.dview.length-d.data_free;h===a&&(h=0);if(!g)g=Math.min(e.length-h,p);else if(g>e.length-h)throw"m.grabx : nget larger then available buffer space";if(0>g)throw"m.grabx : nget cannot be negative";if(g>p)return 0;var p=d.out_byte/d.dview.BYTES_PER_ELEMENT,q=p+g;if(q>=d.dview.length){var u=d.dview.length-p,q=q-d.dview.length;e.set(d.dview.subarray(p,d.dview.length),h);e.set(d.dview.subarray(0,q),h+u)}else e.set(d.dview.subarray(p,q),h);d.out_byte=q*d.dview.BYTES_PER_ELEMENT%
d.buf.byteLength;d.data_free+=g;return g};e.addPipeWriteListener=function(a,d){a.onwritelisteners||(a.onwritelisteners=[]);-1===a.onwritelisteners.indexOf(d)&&a.onwritelisteners.push(d)};e.units_name=function(a){a=x[a];return a[0]+" ("+a[1]+")"};e.trim_name=function(a){var d=a.indexOf("]");-1===d&&(d=a.indexOf("/"));-1===d&&(d=a.indexOf(":"));var e=a.substr(d+1,a.length).indexOf(".");0>e&&(e=a.length-d);return a.substr(d+1,d+e+1)};e.label=function(d,e){var g=x[d];if(g===a)return"";var h="?";1E3===
e?h="K":0.001===e?h="m":1E6===e?h="M":1E-6===e?h="u":1E9===e?h="G":1E-9===e?h="n":1E12===e?h="T":1E-12===e?h="p":1===e&&(h="");return g[0]+" ("+h+g[1]+")"};var q="F";e.vstype=function(a){q=a;"D"===q||"L"===q||"F"===q||"I"===q||"B"===q||alert("Unsupported vector type")};e.vlog10=function(d,e,g){e===a&&(e=1E-20);g===a&&(g=d);for(var h=0;h<d.length&&!(g.length<=h);h++)g[h]=Math.log(Math.max(d[h],e))/Math.log(10)};e.vlogscale=function(d,e,g,h){e===a&&(e=1E-20);g===a&&(g=1);h===a&&(h=d);for(var p=0;p<
d.length&&!(h.length<=p);p++)h[p]=Math.log(Math.abs(Math.max(d[p],e)))/Math.log(10),h[p]*=g};e.cvmag2logscale=function(d,e,g,h){e===a&&(e=1E-20);g===a&&(g=1);h===a&&(h=d);for(var p=0,q=0;q<h.length;q++){p=2*q+1;if(p>=d.length)break;h[q]=d[p-1]*d[p-1]+d[p]*d[p];h[q]=Math.log(Math.abs(Math.max(h[q],e)))/Math.log(10);h[q]*=g}};e.vsmul=function(d,e,g,h){g===a&&(g=d);h===a&&(h=g.length);h=Math.min(g.length,h);h=Math.min(d.length,h);for(var p=0;p<h&&!(g.length<=p);p++)g[p]=d[p]*e};e.vmxmn=function(a,d){var e=
a[0],h=a[0],p=0,q=0;d=Math.min(d,a.length);for(var u=0;u<d;u++)a[u]>e&&(e=a[u],p=u),a[u]<h&&(h=a[u],q=u);return{smax:e,smin:h,imax:p,imin:q}};e.vmov=function(d,e,g,h,p){p===a&&(p=d.length);p=Math.min(d.length,p);for(var q=0;q<p;q++){var u=q*e,x=q*h;if(u>=d.length)break;if(x>=g.length)break;g[x]=d[u]}};e.vfill=function(d,e,g){g===a&&(g=d.length);g=Math.min(d.length,g);for(var h=0;h<g;h++)d[h]=e};e.vabs=function(d,e,g){g===a&&(g=d.length);e===a&&(e=d);for(var h=0;h<g;h++)e[h]=Math.abs(d[h])};e.cvmag=
function(d,e,g){g===a&&(g=e.length);g=Math.min(e.length,g);for(var h=0;h<g;h++){var p=2*h+1;if(p>=d.length)break;e[h]=Math.sqrt(d[p-1]*d[p-1]+d[p]*d[p])}};e.cvmag2=function(d,e,g){g===a&&(g=e.length);g=Math.min(e.length,g);for(var h=0,p=0;p<g;p++){h=2*p+1;if(h>=d.length)break;e[p]=d[h-1]*d[h-1]+d[h]*d[h]}};e.cvpha=function(d,e,g){g===a&&(g=e.length);g=Math.min(e.length,g);for(var h=0,p=0,q=h=0;q<g;q++){h=2*q+1;if(h>=d.length)break;p=d[h-1];h=d[h];0===p&&0===h&&(p=1);e[q]=Math.atan2(h,p)}};e.cvphad=
function(d,e,g){g===a&&(g=e.length);g=Math.min(e.length,g);for(var h=0,p=0,q=h=0;q<g;q++){h=2*q+1;if(h>=d.length)break;p=d[h-1];h=d[h];0===p&&0===h&&(p=1);e[q]=Math.atan2(h,p)*(180/Math.PI)}};e.trunc=function(d){return d-d%1};e.sign=function(d,a){return 0<=a?Math.abs(d):-Math.abs(d)};e.sec2tod=function(a){var e="",g=Date.UTC(1950,0,1);Date.UTC(1949,11,31);var h=new Date,e=new Date(h.getFullYear(),h.getMonth(),h.getDate(),0,0,0,0),p=new Date(h.getFullYear(),h.getMonth(),h.getDate()+1,0,0,0,0),q=new Date(h.getFullYear(),
0,1,0,0,0,0),u=new Date(h.getFullYear()+1,0,1,0,0,0),h=(p-e)/1E3,q=(u-q)/1E3,p=-1*q;0<=a?a<h?(e=e.getTime()+1E3*a,h=new Date(e),e=d(h.getHours())+":"+d(h.getMinutes())+":"+d(h.getSeconds())+":"+d(h.getUTCMilliseconds())):a<q?(g=a/h,g=[0<g?Math.floor(g):Math.ceil(g)],h=new Date(1E3*a+e.getTime()),e=g.toString()+"::"+d(h.getHours())+":"+d(h.getMinutes())+":"+d(h.getSeconds())+":"+d(h.getUTCMilliseconds())):(h=new Date(1E3*a+g),e=h.getUTCFullYear()+":"+d(h.getUTCMonth())+":"+d(h.getUTCDate())+"::"+d(h.getUTCHours())+
":"+d(h.getUTCMinutes())+":"+d(h.getUTCSeconds())+":"+d(h.getUTCMilliseconds())):a>p?(g=a/h,g=[0>=g?Math.ceil(g):Math.floor(g)],h=new Date(Math.abs(1E3*a)+e.getTime()),e=g.toString()+"::"+d(h.getHours())+":"+d(h.getMinutes())+":"+d(h.getSeconds())+":"+d(h.getUTCMilliseconds())):(h=new Date(1E3*a+g),e=h.getUTCFullYear()+":"+d(h.getUTCMonth())+":"+d(h.getUTCDate())+"::"+d(h.getUTCHours())+":"+d(h.getUTCMinutes())+":"+d(h.getUTCSeconds())+":"+d(h.getUTCMilliseconds()));0!==a%1&&(e+="."+(a%1).toPrecision(6).slice(2,
8));return e};e.sec2tod_j1970=function(a){var e="";0<=a&&86400>a?(e=new Date(1E3*a),e=d(e.getHours())+":"+d(e.getMinutes())+":"+d(e.getSeconds())):0>a&&-31536E3<a?(e=new Date(1E3*a),e=(a/86400*-1).toString()+"::"+d(e.getHours())+":"+d(e.getMinutes())+":"+d(e.getSeconds())):(e=new Date(1E3*(a-631152E3)),e=e.getFullYear()+":"+d(e.getMonth())+":"+d(e.getDate())+"::"+d(e.getHours())+":"+d(e.getMinutes())+":"+d(e.getSeconds()));0!==a%1&&(e+="."+(a%1).toPrecision(6).slice(2,8));return e};e.throttle=function(a,
d){var e=(new Date).getTime();return function(){var h=(new Date).getTime();h-e>=a&&(e=h,d.apply(null,arguments))}}})(window.m);window.mx=window.mx||{};
(function(e,a,d){function x(){this.ymax=this.ymin=this.xmax=this.xmin=this.yl=this.xl=this.yo=this.xo=0;this.mode=this.func=d}function q(c){this.root=c;this.parent=document.createElement("div");this.parent.style.position="relative";this.parent.width=c.clientWidth;this.parent.height=c.clientHeight;c.appendChild(this.parent);this.canvas=document.createElement("canvas");this.canvas.style.position="absolute";this.canvas.style.top="0px";this.canvas.style.left="0px";this.canvas.width=c.clientWidth;this.canvas.height=
c.clientHeight;this.parent.appendChild(this.canvas);this.active_canvas=this.canvas;this.wid_canvas=document.createElement("canvas");this.wid_canvas.style.position="absolute";this.wid_canvas.style.top="0px";this.wid_canvas.style.left="0px";this.wid_canvas.style.zIndex=1;this.wid_canvas.width=c.clientWidth;this.wid_canvas.height=c.clientHeight;this.parent.appendChild(this.wid_canvas);this.level=this.text_h=this.text_w=0;this.width=this.parent.width;this.height=this.parent.height;this.ymrk=this.xmrk=
this.ypos=this.xpos=0;this.origin=1;this.stk=[new e.STKSTRUCT];e.setbgfg(this,"black","white");this.warpbox=this.event_cb=d;this.rmode=!1;this.linewidth=1;this.style=d;this.xi=!1;this.l=this.state_mask=this.button_press=this.button_release=0;this.r=this.width;this.t=0;this.b=this.height;this.scrollbar_x=new e.SCROLLBAR;this.scrollbar_y=new e.SCROLLBAR;this.prompt=d;this.pixel=[];this._renderCanvas=document.createElement("canvas")}function l(c,a,d,e,f,z,g){f<=d?g>d&&0<(e-a)*(g-d)-(z-a)*(f-d)&&(c+=
1):g<=d&&0>(e-a)*(g-d)-(z-a)*(f-d)&&(c-=1);return c}function f(c,a){a.animationFrameHandle||(a.animationFrameHandle=requestAnimFrame(e.withWidgetLayer(c,function(){e.erase_window(c);a.animationFrameHandle=d;var A=1.5*c.text_h;a.x=Math.max(a.x,0);a.y=Math.max(a.y,0);a.x=Math.min(a.x,c.width-a.w);a.y=Math.min(a.y,c.height-a.h);var G=a.x+J.GBorder+Math.max(0,J.sidelab),f=a.y+J.GBorder+J.toplab*(A+J.GBorder),z=a.w-2*J.GBorder-Math.abs(J.sidelab);e.widgetbox(c,a.x,a.y,a.w,a.h,G,f,z,a.h-2*J.GBorder-J.toplab*
(A+J.GBorder),a.title);var g=c.wid_canvas.getContext("2d");g.lineWidth=1;g.strokeStyle=c.xwbs;g.beginPath();g.moveTo(G,f-4+0.5);g.lineTo(G+z-1,f-4+0.5);g.stroke();g.strokeStyle=c.xwts;g.beginPath();g.moveTo(G,f-3+0.5);g.lineTo(G+z-1,f-3+0.5);g.stroke();for(var r=0;r<a.items.length;r++){var n=a.items[r],s=f+A*r;"separator"===n.style?(g.fillStyle=c.xwbs,g.fillRect(G,s,z,A),g.beginPath(),g.moveTo(G,s+0.5),g.lineTo(G+z,s+0.5),g.stroke(),g.textBaseline="middle",g.textAlign="left",g.fillStyle=c.xwfg,g.fillText(" "+
n.text+" ",G+2*c.text_w,s+A/2)):(g.fillStyle=c.xwlo,g.fillRect(G,s,z,A),g.beginPath(),g.moveTo(G,s+0.5),g.lineTo(G+z,s+0.5),g.stroke(),n.selected&&e.shadowbox(c,G-1,s,z+2,A,1,2,"",0),g.textBaseline="middle",g.textAlign="left",g.fillStyle=c.xwfg,"checkbox"===n.style?(g.fillText(" "+n.text+" ",G+2*c.text_w,s+A/2),g.strokeStyle=c.xwfg,g.strokeRect(G+1+c.text_w,s+(A-c.text_w)/2,c.text_w,c.text_w),n.checked&&(g.beginPath(),g.moveTo(G+1+c.text_w,s+(A-c.text_w)/2),g.lineTo(G+1+c.text_w+c.text_w,s+(A-c.text_w)/
2+c.text_w),g.stroke(),g.beginPath(),g.moveTo(G+1+c.text_w+c.text_w,s+(A-c.text_w)/2),g.lineTo(G+1+c.text_w,s+(A-c.text_w)/2+c.text_w),g.stroke())):(g.fillText(" "+n.text+" ",G,s+A/2),n.checked&&(g.beginPath(),g.moveTo(G+1,s+c.text_h/4),g.lineTo(G+1+c.text_w-2,s+c.text_h/4+c.text_h/2),g.lineTo(G+1,s+c.text_h/4+c.text_h),g.lineTo(G+1,s+c.text_h/4),g.fill())))}})))}function g(c,a){e.onWidgetLayer(c,function(){e.erase_window(c)});c.menu=d;c.widget=null;for(var A=0;A<a.items.length;A++){var G=a.items[A];
if(G.selected){G.handler?G.handler():G.menu&&(A=G.menu,"function"===typeof G.menu&&(A=G.menu()),A.finalize=a.finalize,e.menu(c,A));break}}!c.menu&&a.finalize&&a.finalize()}function h(c,a){e.onWidgetLayer(c,function(){e.erase_window(c)});c.menu=d;c.widget=null;!c.menu&&a.finalize&&a.finalize()}function p(c,a,d){var e=!0,f;f=a/c;0<c?f>d.tL?e=!1:f>d.tE&&(d.tE=f):0>c?f<d.tE?e=!1:f<d.tL&&(d.tL=f):0<a&&(e=!1);return e}function B(c,a,d,e,f,g,l,r){0>a&&(a=0);0>d&&(d=0);0>e&&(e=0);0>f&&(f=0);r&&(c.lineWidth=
r);l&&(c.strokeStyle=l);1===c.lineWidth%2&&(a===e&&(e=a=Math.floor(a)+0.5),d===f&&(f=d=Math.floor(d)+0.5));if(!g||!g.mode)c.beginPath(),c.moveTo(a,d),c.lineTo(e,f),c.stroke(),c.beginPath();else if("dashed"===g.mode){if(dashOn(c,g.on,g.off))c.beginPath(),c.moveTo(a,d),c.lineTo(e,f),c.stroke(),dashOff(c);else if(c.beginPath(),d===f)for(f=Math.min(a,e),e=Math.max(a,e);f<e;)c.moveTo(f,d),c.lineTo(f+g.on,d),c.stroke(),f+=g.on+g.off;else if(a===e)for(e=Math.min(d,f),f=Math.max(d,f);e<f;)c.moveTo(a,e),c.lineTo(a,
e+g.on),c.stroke(),e+=g.on+g.off;else throw"Only horizontal or vertical dashed lines are supported";c.beginPath()}else if("xor"===g.mode)if("undefined"===typeof Uint8ClampedArray)c.beginPath(),c.moveTo(a,d),c.lineTo(e,f),c.stroke(),c.beginPath();else{l=g=0;if(d===f)g=Math.abs(e-a),l=r,a=Math.min(a,e);else if(a===e)g=r,l=Math.abs(f-d),d=Math.min(d,f);else throw"Only horizontal and vertical lines can be drawn with XOR";if(0!==g&&0!==l){a=Math.floor(a);d=Math.floor(d);e=c.getImageData(a,d,g,l);f=e.data;
g=0;for(r=f.length;g<r;g+=4)f[g]=255-f[g],f[g+1]=255-f[g+1],f[g+2]=255-f[g+2],f[g+3]=255;c.putImageData(e,a,d);c.clearRect(0,0,1,1)}}}function u(c,a,d,e,f){w(c,a,f);d&&(c.strokeStyle=d);e&&(c.fillStyle=e);c.fill();c.closePath()}function w(c,a,d){if(!(1>a.length)){var e=a[0].x,f=a[0].y;c.lineWidth=d?d:1;c.beginPath();c.moveTo(e,f);for(d=0;d<a.length;d++)e=a[d].x,f=a[d].y,c.lineTo(e,f)}}function C(c){return Math.floor(Math.round(c/100*255))}function y(c,a,d){return"rgb("+Math.round(c)+", "+Math.round(a)+
", "+Math.round(d)+")"}function F(c,a){var d,e;if(".000000"===c.substring(5,8))d=4;else for(d=c.length-1;"0"===c[d];)d-=1;for(e=0;" "===c[e]&&(5<d-e+1||a);)e+=1;d=c.substring(e,d+1);-1===d.indexOf(".")&&(d+=".");return d}function E(c){c._animationFrameHandle=d;var a=c.warpbox;c.active_canvas.getContext("2d");if(a&&c.xpos>=a.xmin&&c.xpos<=a.xmax&&c.ypos>=a.ymin&&c.ypos<=a.ymax){a.xl=c.xpos;a.yl=c.ypos;var A=Math.min(a.xo,a.xl),f=Math.min(a.yo,a.yl),g=Math.abs(a.xl-a.xo),z=Math.abs(a.yl-a.yo);0!==g&&
0!==z&&("vertical"===a.mode?(A=c.l,g=c.r-c.l):"horizontal"===a.mode&&(f=c.t,z=c.b-c.t),e.onWidgetLayer(c,function(){e.erase_window(c);e.draw_box(c,"xor",A,f,g,z,a.style.opacity,a.style.fill_color)}))}}function K(c,a,d){return c<a?a:c>d?d:c}function U(c,a,e,f,g,z,l,r,n,s,k,v,D){s===d&&(s=0);k===d&&(k=0);v===d&&(v=e.width-s);D===d&&(D=e.height-k);c._renderCanvas.width=e.width;c._renderCanvas.height=e.height;for(var h=c._renderCanvas.getContext("2d"),p=h.createImageData(c._renderCanvas.width,c._renderCanvas.height),
q=new Uint8Array(e),u=0;u<e.height;++u)for(var R=0;R<e.width;++R){var N=4*(u*e.width+R);p.data[N]=q[N];p.data[N+1]=q[N+1];p.data[N+2]=q[N+2];p.data[N+3]=255}h.putImageData(p,0,0);a.save();a.globalAlpha=f;g||(a.imageSmoothingEnabled=!1,a.mozImageSmoothingEnabled=!1,a.webkitImageSmoothingEnabled=!1);a.drawImage(c._renderCanvas,s,k,v,D,z,l,r,n);a.restore()}function T(c,a,e,f,g,z,l,r,n,s,k,v,D){s===d&&(s=0);k===d&&(k=0);v===d&&(v=e.width-s);D===d&&(D=e.height-k);if(32768>e.width&&32768>e.height){c._renderCanvas.width=
e.width;c._renderCanvas.height=e.height;var h=c._renderCanvas.getContext("2d"),p=h.createImageData(c._renderCanvas.width,c._renderCanvas.height);e=new Uint8ClampedArray(e);p.data.set(e);h.putImageData(p,0,0)}else 32768>v&&32768>D?(c._renderCanvas.width=v,c._renderCanvas.height=D,O(c._renderCanvas,e,s,k,v,D)):(c._renderCanvas.width=Math.min(2*r,e.width),c._renderCanvas.height=Math.min(2*n,e.height),O(c._renderCanvas,e,s,k,v,D),v=c._renderCanvas.width,D=c._renderCanvas.height),k=s=0;a.save();a.globalAlpha=
f;g||(a.imageSmoothingEnabled=!1,a.mozImageSmoothingEnabled=!1,a.webkitImageSmoothingEnabled=!1);a.drawImage(c._renderCanvas,s,k,v,D,z,l,r,n);a.restore()}function O(c,a,d,e,f,g){var l=new Uint32Array(a);f||(f=a.width);g||(g=a.height);d||(d=0);e||(e=0);var r=c.width,n=c.height;c=c.getContext("2d");var s=c.createImageData(r,n),k=new ArrayBuffer(s.data.length),v=new Uint8ClampedArray(k),k=new Uint32Array(k);f/=r;g/=n;for(var D=0,h=0,n=D=0;n<k.length;n++)D=Math.round(Math.floor(n%r)*f)+d,h=Math.round(Math.floor(n/
r)*g)+e,D=Math.floor(h*a.width+D),k[n]=l[D];s.data.set(v);c.putImageData(s,0,0)}e.XW_INIT=-3;e.XW_DRAW=1;e.XW_EVENT=2;e.XW_UPDATE=3;e.XW_COMMAND=5;e.SB_EXPAND=1;e.SB_SHRINK=2;e.SB_FULL=3;e.SB_STEPINC=4;e.SB_STEPDEC=5;e.SB_PAGEINC=6;e.SB_PAGEDEC=7;e.SB_DRAG=8;e.SB_WHEELUP=9;e.SB_WHEELDOWN=10;e.L_ArrowLeft=1001;e.L_ArrowRight=1002;e.L_ArrowUp=1003;e.L_ArrowDown=1004;e.L_dashed=801;e.GBorder=3;e.L_RModeOff=900;e.L_RModeOn=901;e.L_PixelSymbol=1;e.L_CircleSymbol=2;e.L_SquareSymbol=3;e.L_PlusSymbol=4;e.L_XSymbol=
5;e.L_TriangleSymbol=6;e.L_ITriangleSymbol=7;e.L_HLineSymbol=8;e.L_VLineSymbol=9;e.STKSTRUCT=function(){this.y2=this.x2=this.y1=this.x1=this.yscl=this.xscl=this.ymax=this.ymin=this.xmax=this.xmin=0};e.SCROLLBAR=function(){this.repeat_count=this.origin=this.mxevent=this.arrow=this.a2=this.a1=this.soff=this.swmin=this.sw=this.s1=this.h=this.w=this.y=this.x=this.repeat_pause=this.initial_pause=this.dragoutline=this.scale=this.page=this.step=this.trange=this.tmin=this.srange=this.smin=this.action=this.flag=
null};e.open=function(c){c=new q(c);c.wid_canvas.oncontextmenu=function(c){c.preventDefault();return!1};this._ctx=c.active_canvas.getContext("2d");c.onmousemove=function(c){return function(a){var f=a.target.getBoundingClientRect();c.xpos=a.offsetX===d?a.pageX-f.left-window.scrollX:a.offsetX;c.ypos=a.offsetX===d?a.pageY-f.top-window.scrollY:a.offsetY;c.warpbox&&(c.warpbox.style=a.ctrlKey&&c.warpbox.alt_style!==d?c.warpbox.alt_style:c.warpbox.def_style,e.redraw_warpbox(c));e.widget_callback(c,a)}}(c);
c.onmouseup=function(c){return function(a){if(c.warpbox){e.onWidgetLayer(c,function(){e.erase_window(c)});var f=c.warpbox;c.warpbox=d;if(1===a.which&&f.func){var g=f.xo,z=f.yo,l=f.xl,r=f.yl;"vertical"===f.mode?(g=c.l,l=c.r):"horizontal"===f.mode&&(z=c.t,r=c.b);f.func(a,g,z,l,r,f.style.return_value)}}e.widget_callback(c,a)}}(c);c.onmousedown=function(c){return function(a){a.preventDefault();e.widget_callback(c,a);return!1}}(c);c.onkeydown=function(c){return function(a){c.warpbox&&17===getKeyCode(a)&&
c.warpbox.style!==c.warpbox.alt_style&&(c.warpbox.style=c.warpbox.alt_style,e.redraw_warpbox(c));e.widget_callback(c,a)}}(c);c.onkeyup=function(c){return function(a){c.warpbox&&17===getKeyCode(a)&&c.warpbox.style!==c.warpbox.def_style&&(c.warpbox.style=c.warpbox.def_style,e.redraw_warpbox(c))}}(c);c.ontouchend=function(c){return function(a){c.onmouseup({which:1})}}(c);c.ontouchmove=function(c){return function(a){var f=c.canvas,g=0,l=0;if(f.offsetParent!==d){do g+=f.offsetLeft,l+=f.offsetTop;while(f=
f.offsetParent)}c.xpos=a.targetTouches[0].pageX-g;c.ypos=a.targetTouches[0].pageY-l;e.redraw_warpbox(c)}}(c);e.enableListeners(c);return c};e.enableListeners=function(c){e.addEventListener(c,"mousemove",c.onmousemove,!1);window.addEventListener("mouseup",c.onmouseup,!1);e.addEventListener(c,"mousedown",c.onmousedown,!1);window.addEventListener("keydown",c.onkeydown,!1);window.addEventListener("keyup",c.onkeyup,!1)};e.disableListeners=function(c){e.removeEventListener(c,"mousemove",c.onmousemove,!1);
window.removeEventListener("mouseup",c.onmouseup,!1);e.removeEventListener(c,"mousedown",c.onmousedown,!1);window.removeEventListener("keydown",c.onkeydown,!1);window.removeEventListener("keyup",c.onkeyup,!1)};e.addEventListener=function(c,a,d,e){return c.wid_canvas.addEventListener(a,d,e)};e.removeEventListener=function(c,a,d,e){return c.wid_canvas.removeEventListener(a,d,e)};e.dispatchEvent=function(c,a){return c.wid_canvas.dispatchEvent(a)};e.onWidgetLayer=function(c,a){var d=c.active_canvas;c.active_canvas=
c.wid_canvas;try{if(a)return a()}finally{c.active_canvas=d}};e.withWidgetLayer=function(c,a){return function(){e.onWidgetLayer(c,a)}};e.render=function(c,a){if(a){var e=c.active_canvas;e._animationFrameHandle||(e._animationFrameHandle=requestAnimFrame(function(){e._animationFrameHandle=d;a()}))}};e.fullscreen=function(c,a){a===d&&(a=!c.fullscreen);a?(c.fullscreen={position:c.root.style.position,height:c.root.style.height,width:c.root.style.width,left:c.root.style.left,top:c.root.style.top,zIndex:c.root.style.zIndex},
c.root.style.position="fixed",c.root.style.height="100%",c.root.style.width="100%",c.root.style.left="0px",c.root.style.top="0px",c.root.style.zIndex=16777271):(c.root.style.position=c.fullscreen.position,c.root.style.height=c.fullscreen.height,c.root.style.width=c.fullscreen.width,c.root.style.left=c.fullscreen.left,c.root.style.top=c.fullscreen.top,c.root.style.zIndex=c.fullscreen.zIndex,c.fullscreen=d);e.checkresize(c)};e.checkresize=function(c){var a=c.canvas;return a.height!==c.root.clientHeight||
a.width!==c.root.clientWidth?(c.height=c.root.clientHeight,c.width=c.root.clientWidth,c.canvas.height=c.height,c.canvas.width=c.width,c.wid_canvas.height=c.height,c.wid_canvas.width=c.width,!0):!1};e.invertbgfg=function(c){e.setbgfg(c,c.fg,c.bg,!c.xi)};e.mixcolor=function(c,a,d){c=tinycolor(c).toRgb();a=tinycolor(a).toRgb();var e=1-d;a.r=c.r*e+a.r*d;a.g=c.g*e+a.g*d;a.b=c.b*e+a.b*d;return tinycolor(a).toHexString(!0)};e.linear_gradient=function(c,a,d,e,f,g){var l=c.active_canvas.getContext("2d");c=
1/g.length;a=l.createLinearGradient(a,d,e,f);for(d=0;d<g.length-1;d++)a.addColorStop(c*d,g[d]);a.addColorStop(1,g[g.length-1]);return a};e.setbgfg=function(c,a,d,f){c.bg=a;c.fg=d;c.xi=f;tinycolor.equals(c.bg,"black")&&tinycolor.equals(c.fg,"white")?(c.xwfg=c.fg,c.xwbg="rgb(35%,35%,30%)",c.xwts="rgb(60%,60%,55%)",c.xwbs="rgb(25%,25%,20%)",c.xwms=e.mixcolor(c.xwts,c.xwbs,0.5),c.xwlo="rgb(15%,15%,10%)",c.hi=c.xwts):tinycolor.equals(c.bg,"white")&&tinycolor.equals(c.fg,"black")?(c.xwfg=c.fg,c.xwbg="rgb(60%,60%,55%)",
c.xwts="rgb(80%,80%,75%)",c.xwbs="rgb(40%,40%,35%)",c.xwms=e.mixcolor(c.xwts,c.xwbs,0.5),c.xwlo="rgb(70%,70%,65%)",c.hi=c.xwbs):(a=tinycolor(c.bg).toRgb(),127.5<Math.sqrt(0.299*a.r*a.r+0.587*a.g*a.g+0.114*a.b*a.b)?(c.xwfg="black",c.xwbg="rgb(60%,60%,55%)",c.xwts="rgb(80%,80%,75%)",c.xwbs="rgb(40%,40%,35%)",c.xwms=e.mixcolor(c.xwts,c.xwbs,0.5),c.xwlo="rgb(70%,70%,65%)",c.hi=c.xwts):(c.xwfg="white",c.xwbg="rgb(35%,35%,30%)",c.xwts="rgb(60%,60%,55%)",c.xwbs="rgb(25%,25%,20%)",c.xwms=e.mixcolor(c.xwts,
c.xwbs,0.5),c.xwlo="rgb(15%,15%,10%)",c.hi=c.xwbs))};e.settheme=function(c,a){c.bg=a.bg;c.fg=a.fg;c.xi=a.xi;c.xwfg=a.xwfg;c.xwbg=a.xwbg;c.xwts=a.xwts;c.xwbs=a.xwbs;c.xwlo=a.xwlo;c.hi=a.hi};e.close=function(c){var a=c.wid_canvas;a.removeEventListener("mousemove",c.onmousemove,!1);a.removeEventListener("mouseup",c.onmouseup,!1);c.parent&&c.parent.parentNode&&c.parent.parentNode.removeChild(c.parent)};e.scrollbar=function(c,a,f,g,l,z,h,r,n,s,k){var v,D,H,p=0,q=new e.SCROLLBAR;v=a.flag!==d?a.flag:a;D=
Math.abs(v);H=z-l>g-f?3>c.origin?2:4:c.origin&2?3:1;10>D&&(a=q);if(10>D||0===a.action)e.scroll(c,a,e.XW_INIT,d,k),a.flag=v,a.initial_pause=-1,e.scroll_loc(a,f,l,g-f+1,z-l+1,H,k);a.srange=h.pe-h.ps;switch(D){case 0:f=g=l=1;break;case 1:case 11:f=g=0.9*a.srange;l=2;break;case 2:case 12:f=0.1*a.srange;g=9*f;l=2;break;case 3:case 13:f=1;g=a.srange-1;l=1;break;default:return 0}e.scroll_vals(a,h.ps,a.srange,r,n-r,f,g,l,k);0===v?e.scroll(c,a,e.XW_DRAW,d,d):e.scroll(c,a,e.XW_EVENT,s,k)&&(h.ps!==a.smin&&(h.ps=
a.smin,p+=1),h.pe!==a.smin+a.srange&&(h.pe=a.smin+a.srange,p+=2));return p};e.scroll=function(c,a,f,g,l){var z;if(a===d)return!1;switch(f){case e.XW_INIT:e.scroll_loc(a,0,0,c.width,20,1,l);e.scroll_vals(a,0,10,0,100,1,10,1,l);a.flag=0;a.action=0;a.initial_pause=0.25;a.repeat_pause=0.05;a.mxevent=!0;a.repeat_count=0;break;case e.XW_EVENT:z=0;if(a.mxevent)z=c.button_release?-c.button_release:c.button_press;else if("mousedown"===g.type||"mouseup"===g.type){switch(g.which){case 1:z=1;break;case 2:z=2;
break;case 3:z=3;break;case 4:z=4;break;case 5:z=5}"mouseup"===g.type&&(z=-z)}else if("mousewheel"===g.type||"DOM-MouseScroll"===g.type)g.wheelDelta&&0<g.wheelDelta?z=4:g.wheelDelta&&0>g.wheelDelta&&(z=5);if(0===a.action){if(4===z||5===z)c.xpos=a.x;if(1!==z&&2!==z&&4!==z&&5!==z||c.xpos<a.x||c.ypos<a.y||c.xpos>a.x+a.w||c.ypos>a.y+a.h)return!1}else if(0>z){a.action=a.repeat_count=0;break}a.origin&1?(g=c.xpos-a.x,a.origin&2&&(g=a.w-g)):(g=c.ypos-a.y,2>=a.origin&&(g=a.h-g));if(0===a.action){a.repeat_count=
0;var h=e.scroll_real2pix(a);a.s1=l.s1=h.s1;a.sw=l.sw=h.sw;a.soff=l.soff=g-a.s1;if(0===a.trange)a.smin=l.smin=a.tmin,a.srange=l.srange=0;else switch(z){case 1:a.action=g>a.a1&&g<a.a2?0<a.soff?e.SB_PAGEINC:e.SB_PAGEDEC:0<a.soff?e.SB_STEPINC:e.SB_STEPDEC;break;case 4:a.action=e.SB_WHEELUP;break;case 5:a.action=e.SB_WHEELDOWN;break}}else switch(a.action){case e.SB_WHEELUP:case e.SB_WHEELDOWN:case e.SB_EXPAND:case e.SB_SHRINK:case e.SB_FULL:a.action=a.repeat_count=0}case e.XW_COMMAND:z=a.smin;g=a.srange;
switch(a.action){case e.SB_STEPINC:z+=a.step;break;case e.SB_STEPDEC:z-=a.step;break;case e.SB_PAGEINC:z+=a.page;break;case e.SB_PAGEDEC:z-=a.page;break;case e.SB_FULL:z=a.tmin;g=a.trange;break;case e.SB_EXPAND:g*=a.scale;z=0>=z&&0<=z+a.srange?z*a.scale:z-(g-a.srange)/2;break;case e.SB_SHRINK:g/=a.scale;z=0>z&&0<=z+a.srange?z+g/a.scale:0===z&&0<=z+a.srange?g/a.scale:z+(a.srange-g)/2;break;case e.SB_WHEELUP:z-=a.page;break;case e.SB_WHEELDOWN:z+=a.page}0<a.trange?(z=Math.max(a.tmin,Math.min(z,a.tmin+
a.trange-g)),g=Math.min(g,a.trange)):(z=Math.min(a.tmin,Math.max(z,a.tmin+a.trange-g)),g=Math.max(g,a.trange));a.smin===z&&a.srange===g?a.action!==e.SB_DRAG&&(a.action=a.repeat_count=0):(a.smin=l.smin=z,a.srange=l.srange=g,a.repeat_count++);f===e.XW_COMMAND&&(e.scroll(c,a,e.XW_UPDATE,d),a.action=0);break;case e.XW_DRAW:case e.XW_UPDATE:e.redrawScrollbar(a,c,f)}return!0};e.scroll_loc=function(c,f,g,l,h,z,p){c!==d&&(c.x=p.x=f,c.y=p.y=g,c.w=p.w=l,c.h=p.h=h,c.origin=p.origin=Math.max(1,Math.min(4,z)),
c.origin&1?(c.a2=p.a2=c.w,c.arrow=p.arrow=Math.min(a.trunc((c.w-a.trunc(2*e.GBorder))/3),c.h+e.GBorder)):(c.a2=p.a2=c.h,c.arrow=p.arrow=Math.min(a.trunc((c.h-a.trunc(2*e.GBorder))/3),c.w+e.GBorder)),c.a1=p.a1=c.arrow+e.GBorder,c.a2-=c.arrow+e.GBorder,p.a2-=c.arrow+e.GBorder,c.swmin=p.swmin=Math.min(10,c.a2-c.a1),c.s1=p.s1=0,c.sw=p.sw=0,c.action=p.action=0)};e.scroll_vals=function(c,a,e,f,g,l,h,r,n){c!==d&&(c.smin=n.smin=a,c.srange=n.srange=e,c.tmin=n.tmin=f,c.trange=n.trange=g,c.step=n.step=l,c.page=
n.page=h,c.scale=n.scale=Math.max(r,1))};e.draw_symbol=function(c,a,d,f,g,l){var h=new Int32Array(new ArrayBuffer(4)),r=new Int32Array(new ArrayBuffer(4));h[0]=d;r[0]=f;e.draw_symbols(c,a,h,r,1,g,l)};e.draw_symbols=function(c,d,f,g,l,h,p){for(var r=c.active_canvas.getContext("2d"),n=0,s=0,k=0,v=0,D=0,D=!1,H=[],n=0;4>n;n++)H[n]={x:0,y:0};v="";D=0>p;s=Math.abs(p);k=2*s;r.fillStyle=d;r.strokeStyle=d;switch(h){case e.L_CircleSymbol:for(n=0;n<l;n++)H=f[n],c=g[n],r.beginPath(),D?(r.arc(H,c,s,0,360),r.fill()):
(r.arc(H,c,s,0,360),r.stroke());break;case e.L_SquareSymbol:if(D)for(n=0;n<l;n++)r.fillRect(f[n]-s,g[n]-s,k,k);else for(n=0;n<l;n++)r.strokeRect(f[n]-s,g[n]-s,k,k);break;case e.L_PixelSymbol:k=1;for(n=0;n<l;n+=k)r.beginPath(),r.arc(f[n],g[n],1,0,2*Math.PI,!0),r.fill();break;case e.L_ITriangleSymbol:s=-s;case e.L_TriangleSymbol:k=a.trunc(1.5*s);v=a.trunc(0.8*s);H[1].x=-v;H[1].y=k;H[2].x=2*v;H[2].y=0;H[3].x=-v;H[3].y=-k;c=[];for(n=0;4>n;n++)c[n]={x:0,y:0};if(D)for(n=0;n<l;n++)c[0].x=f[n],c[0].y=g[n]-
s,c[1].x=c[0].x+H[1].x,c[1].y=c[0].y+H[1].y,c[2].x=c[1].x+H[2].x,c[2].y=c[1].y+H[2].y,c[3].x=c[2].x+H[3].x,c[3].y=c[2].y+H[3].y,u(r,c);else for(n=0;n<l;n++)c[0].x=f[n],c[0].y=g[n]-s,c[1].x=c[0].x+H[1].x,c[1].y=c[0].y+H[1].y,c[2].x=c[1].x+H[2].x,c[2].y=c[1].y+H[2].y,c[3].x=c[2].x+H[3].x,c[3].y=c[2].y+H[3].y,D=r,w(D,c,void 0),D.stroke(),D.closePath();break;case e.L_PlusSymbol:for(n=0;n<l;n++)v=f[n],D=g[n],B(r,v,D+s,v,D-s),B(r,v+s,D,v-s,D);break;case e.L_HLineSymbol:for(n=0;n<l;n++)v=f[n],D=g[n],B(r,
v+s,D,v-s,D);break;case e.L_VLineSymbol:for(n=0;n<l;n++)v=f[n],D=g[n],B(r,v,D+s,v,D-s);break;case e.L_XSymbol:for(n=0;n<l;n++)v=f[n],D=g[n],B(r,v-s,D-s,v+s,D+s),B(r,v+s,D-s,v-s,D+s);break;default:if(v=h,s=a.trunc(c.text_w/2),D)for(n=0;n<l;n++)r.fillText(v.substring(0,2),f[n]-s,g[n]+s)}};e.trace=function(c,f,g,h,q,z,S,r,n,s){if(g===d||h===d)throw"mx.trace requires xpoint and ypoint";z===d&&(z=1);S===d&&(S=1);r===d&&(r=0);n===d&&(n=0);s===d&&(s={});if(0>=q)a.log.warn("No points to draw");else if(0===
S&&0===r)a.log.warn("No line or symbol to draw");else{var k;s.dashed&&(k={mode:"dashed",on:4,off:4});var v=e.origin(c.origin,4,c.stk[c.level]);if(0!==v.xscl&&0!==v.yscl){var D=v.x1,H=v.y1,P=v.xmin,Y=1/v.xscl,u=v.ymin,R=1/v.yscl;s.noclip||e.clip(c,D,H,v.x2-D+1,v.y2-H+1);var N=Math.abs(v.xmax-v.xmin),I=Math.abs(v.ymax-v.ymin),B=Math.min(v.xmin,v.xmax),v=Math.min(v.ymin,v.ymax),y=B+N,C=v+I,x=4*Math.ceil(1.33*g.length),F=new Int32Array(new ArrayBuffer(x)),x=new Int32Array(new ArrayBuffer(x)),w=0;if(0===
S){for(var E=z-1;E<=q;E+=z){var L=g[E],M=h[E],K=L>=B&&L<=y&&M>=v&&M<=C;K&&(F[w]=Math.round((L-P)*Y)+D,x[w]=Math.round((M-u)*R)+H,w+=1)}0!==r&&1<w&&e.draw_symbols(c,f,F.subarray(0),x.subarray(0),w,r,n)}else if(!0===s.vertsym){for(E=z-1;E<=q;E+=z)L=g[E],M=h[E],L>=B&&L<=y&&(S=Math.round((L-P)*Y)+D,e.draw_line(c,f,S,0,S,c.height),M>=v&&M<=C&&(F[w]=S,x[w]=Math.round((M-u)*R)+H,w+=1));0!==r&&1<w&&e.draw_symbols(c,f,F.subarray(0),x.subarray(0),w,r,n)}else if(!0===s.horzsym){for(E=z-1;E<=q;E+=z)L=g[E],M=
h[E],M>=v&&M<=C&&(S=Math.round((M-u)*R)+H,e.draw_line(c,f,0,S,c.width,S),L>=B&&L<=y&&(F[w]=Math.round((L-P)*Y)+D,x[w]=S,w+=1));0!==r&&1<w&&e.draw_symbols(c,f,F.subarray(0),x.subarray(0),w,r,n)}else{var J;if(s&&s.highlight){J=[];J.push({start:D,color:f});for(E=0;E<s.highlight.length;E++)s.highlight[E].xstart>=y||s.highlight[E].xend<=B||(M=Math.max(s.highlight[E].xstart,B),L=Math.min(s.highlight[E].xend,y),M<L&&(M=Math.round((M-P)*Y)+D,L=Math.round((L-P)*Y)+D,J.push({start:M,end:L,color:s.highlight[E].color})));
J.sort(function(c,a){return c.start-a.start})}else J=f;var O,T=(c.stk[c.level].xmax+c.stk[c.level].xmin)/2,U=(c.stk[c.level].ymax+c.stk[c.level].ymin)/2,L=g[0],M=h[0];O=l(0,T,U,c.stk[c.level].xmin,c.stk[c.level].ymin,L,M);(K=L>=B&&L<=y&&M>=v&&M<=C)?(F[w]=Math.round((L-P)*Y)+D,x[w]=Math.round((M-u)*R)+H,w+=1,0!==r&&e.draw_symbols(c,f,F,x,1,r,n)):w=0;for(var V=0,X=!1,E=z;E<=z*(q-1);E+=z)if(N=L,I=M,L=g[E],M=h[E],O=l(O,T,U,N,I,L,M),X=L>=B&&L<=y&&M>=v&&M<=C,K&&X)F[w]=Math.round((L-P)*Y)+D,x[w]=Math.round((M-
u)*R)+H,w+=1;else if(K=X,N-=L,I-=M,0!==N||0!==I){var Z={tL:1,tE:0};p(N,B-L,Z)&&p(-N,L-y,Z)&&p(I,v-M,Z)&&p(-I,M-C,Z)&&(1>Z.tL&&(F[w]=Math.round((L-P+Z.tL*N)*Y)+D,x[w]=Math.round((M-u+Z.tL*I)*R)+H,w+=1),0<Z.tE?(F[w]=Math.round((L-P+Z.tE*N)*Y)+D,x[w]=Math.round((M-u+Z.tE*I)*R)+H,w+=1,e.draw_lines(c,J,F.subarray(V,w),x.subarray(V,w),w-V,S,k),0!==r&&2<w-V&&e.draw_symbols(c,f,F.subarray(V+1,w),x.subarray(V+1,w),w-V-1,r,n),V=w):(F[w]=Math.round((L-P)*Y)+D,x[w]=Math.round((M-u)*R)+H,w+=1))}O=l(O,T,U,L,M,
c.stk[c.level].xmax,c.stk[c.level].ymin);O=l(O,T,U,c.stk[c.level].xmax,c.stk[c.level].ymin,c.stk[c.level].xmin,c.stk[c.level].ymin);0<w-V&&(e.draw_lines(c,J,F.subarray(V,w),x.subarray(V,w),w-V,S,k),X&&(V+=1),0!==r&&1<w-V&&e.draw_symbols(c,f,F.subarray(V,w),x.subarray(V,w),w-1,r,n));s.fillStyle&&(1<w||0!==O)&&e.fill_trace(c,s.fillStyle,F,x,w)}s.noclip||e.clip(c,0,0,0,0)}}};e.draw_mode=function(c,a,e){c.linewidth=a===d?1:a;c.style=e};e.draw_line=function(c,e,f,g,l,h,p,r){var n=c.active_canvas.getContext("2d");
p===d&&(p=c.linewidth);r===d&&(r=c.style);"number"===typeof e&&(c.pixel&&0!==c.pixel.length?(e=Math.max(0,Math.min(c.pixel.length,e)),e=y(c.pixel[e].red,c.pixel[e].green,c.pixel[e].blue)):(a.log.warn("COLORMAP not initialized, defaulting to foreground"),e=c.fg));B(n,f,g,l,h,r,e,p)};e.rubberline=function(c,a,d,e,f){c=c.active_canvas.getContext("2d");B(c,a,d,e,f,{mode:"xor"},"white",1)};e.fill_trace=function(c,a,d,f,g){var l=c.active_canvas.getContext("2d");Array.isArray(a)?l.fillStyle=e.linear_gradient(c,
0,0,0,c.b-c.t,a):l.fillStyle=a;if(1>g)l.fillRect(c.l,c.t,c.r-c.l,c.b-c.t);else if(a){a=d[0];var h=f[0];l.beginPath();h===c.t?l.lineTo(c.l,c.t):l.lineTo(c.l,c.b);l.lineTo(a,h);for(var r=1;r<g;r++)a=d[r],h=f[r],l.lineTo(a,h);h===c.t&&l.lineTo(c.r,c.t);l.lineTo(c.r,c.b);f[0]===c.t&&l.lineTo(c.l,c.b);l.closePath();l.fill()}};e.draw_lines=function(c,e,f,g,l,h,p){var r=c.active_canvas.getContext("2d");if(!(1>l)){var n=f[0],s=g[0];h===d&&(h=c.linewidth);p===d&&(p=c.style);p&&"dashed"===p.mode&&(dashOn(r,
p.on,p.off)||a.log.warn("WARNING: Dashed lines aren't supported on your browser"));r.lineWidth=h;c=0;"string"===typeof e?e=[{start:0,color:e}]:e instanceof Array||(e.start===d&&(e.start=0),e=[e]);for(h=0;h<e.length;h++)null!=e[h].end&&e[h].end<n?e.remove(h):e[h].start<n&&(c=h);r.strokeStyle=e[c].color;r.beginPath();r.moveTo(n,s);for(h=0;h<l;h++)if(n!==f[h]||s!==g[h]){n=f[h];s=g[h];p=!1;if(0<c&&null!=e[c].end&&e[c].end<n)for(p=!0;null!=e[c].end&&e[c].end<n&&(e.remove(c),c-=1,0!==c););if(c+1<e.length&&
e[c+1].start<=n)for(p=!0;c+1<e.length&&e[c+1].start<=n;)c++;r.lineTo(n,s);p&&(r.stroke(),r.strokeStyle=e[c].color,r.beginPath(),r.lineTo(n,s))}r.stroke();dashOff(r);r.beginPath()}};e.clip=function(c,a,d,e,f){c=c.active_canvas.getContext("2d");0===a&&0===d&&0===e&&0===f?c.restore():(c.save(),c.beginPath(),c.rect(a,d,e,f),c.clip())};e.clear_window=function(c){var a=c.active_canvas.getContext("2d");a.fillStyle=c.bg;a.fillRect(0,0,c.width,c.height)};e.erase_window=function(c){c.active_canvas.getContext("2d").clearRect(0,
0,c.width,c.height)};e.rubberbox=function(c,a,d,f,g){e.warpbox(c,c.xpos,c.ypos,c.xpos,c.ypos,0,c.width,0,c.width,a,d,f,g)};e.warpbox=function(c,a,d,e,f,g,l,r,n,s,k,v,D){v||(v={});c.warpbox=new x;c.warpbox.xo=a;c.warpbox.yo=d;c.warpbox.xl=e;c.warpbox.yl=f;c.warpbox.xmin=g;c.warpbox.xmax=l;c.warpbox.ymin=r;c.warpbox.ymax=n;c.warpbox.func=s;c.warpbox.mode=k;c.warpbox.style=v;c.warpbox.def_style=v;c.warpbox.alt_style=D};e.origin=function(c,a,d){c=Math.max(1,c);a=Math.max(1,a);var f=new e.STKSTRUCT;f.xmin=
d.xmin;f.xmax=d.xmax;f.ymin=d.ymin;f.ymax=d.ymax;f.xscl=d.xscl;f.yscl=d.yscl;f.x1=d.x1;f.y1=d.y1;f.x2=d.x2;f.y2=d.y2;if(c!==a){var g=Math.abs(a-c);c=a+c;if(2===g||5!==c)f.xmin=d.xmax,f.xmax=d.xmin,f.xscl=-d.xscl;if(2===g||5===c)f.ymin=d.ymax,f.ymax=d.ymin,f.yscl=-d.yscl}return f};e.mult=function(c,a){var d=Math.max(Math.abs(c),Math.abs(a));if(0===d)return 1;var e=0.1447648*Math.log(d),e=e|e;1>d&&(e-=1);return 0>e?1/Math.pow(10,-3*e):Math.pow(10,3*e)};e.widget_callback=function(c,a){if(c.prompt&&3===
a.which)c.prompt.input.onsubmit();c.widget&&c.widget.callback(a)};e.prompt=function(c,a,f,g,l,h,p,r,n){if(h!==d&&(l=f(h),!l.valid))throw"Prompt default input value not valid due to '"+l.reason+"'";e.onWidgetLayer(c,function(){var s=c.active_canvas.getContext("2d"),k=s.font.indexOf("px"),v=k+3,k=s.font.substr(0,k),s=s.font.substr(v,s.font.length).toString(),s=new CanvasInput({height:c.text_h,fontFamily:s,fontSize:new Number(k),backgroundColor:c.bg,fontColor:c.fg,borderWidth:0,borderRadius:0,padding:0,
boxShadow:"none",innerShadow:"none",width:30*c.text_w,value:h!==d?h.toString():"",disableBlur:!0,renderOnReturn:!1,tabToClear:!0}),l=function(a,r){return function(){var k=this.value(),s=f(k);s.valid?(c.prompt=d,this.cleanup(),e.onWidgetLayer(c,function(){e.erase_window(c)}),g(k)):(e.message(c,"Value: '"+k+"' isn't valid due to '"+s.reason+"' - RETRY",d,a,r),setTimeout(function(){e.onWidgetLayer(c,function(){e.erase_window(c)});c.widget=null},null!=n?n:4E3))}},v=function(c,a,d){return function(n,r){e.onWidgetLayer(c,
function(){var k=(d.length+2)*c.text_w,s=k+31*c.text_w+6,f=2*c.text_h+6;n||(n=c.xpos);r||(r=c.ypos);var g=Math.max(0,Math.min(n,c.width-s)),v=Math.max(0,Math.min(r,c.height-f)),t=g+3,h=v+3,p=h+1.5*c.text_h,A=t+c.text_w;e.widgetbox(c,g,v,s,f,t,h,0,"");e.text(c,A,p,d);s=p-1.15*c.text_h;a.x(t+c.text_w+k-c.text_w);a.y(s);a.onsubmit(l(g,s-75));a.canvas()?a.render():a.canvas(c.active_canvas)})}}(c,s,a);v(p,r);s.focus();c.prompt={redraw:v,input:s}})};e.floatValidator=function(c,a){return(a!==d&&!1!==a||
""!==c)&&isNaN(parseFloat(c))||!isFinite(c)?{valid:!1,reason:"Failed float validation: not a valid floating point number"}:{valid:!0,reason:""}};e.intValidator=function(c,a){return(a===d||!1===a)&&""===c||parseFloat(c)===parseInt(c,10)&&!isNaN(c)?{valid:!0,reason:""}:{valid:!1,reason:"Failed integer validation: not a valid integer"}};e.message=function(c,a,d,f,g){e.onWidgetLayer(c,function(){var d=a.split(/\r\n|\r|\n/g),l=0,r;if(1===d.length){d=[];l=Math.min((c.width-6)/c.text_w-2,a.length);if(0>=
l)return;for(;40<l&&2.5*c.text_h*a.length<c.height*l;)l-=5;var n=0,s=0,k=0,v=0,D=0,h=0,d=[];for(r=!0;s<a.length;){for(var D=s+l-1,h=D=Math.min(D,a.length-1),p=!1,n=s;n<=D&&!p;n++)switch(a[n]){case ",":case ";":case " ":case ":":h=n;break;case "-":case "/":h!==n-1&&(h=n);break;case "@":case "\n":case "\r":r=!1,p=!0,h=n}n===a.length&&(h=D);p?d.push(a.substring(s,h)):(n=a.substring(s,h+1).replace(/^\s+/,""),d.push(n));s=h+1;v=Math.max(v,d[k].length)}}else for(k=0;k<d.length;k++)l=Math.min((c.width-6)/
c.text_w-2,Math.max(l,d[k].length));v=d.length;6<v&&(r=!1);n=0;k=Math.max(1,c.height/c.text_h);h=Math.min(v,n+k-1);l=(l+2)*c.text_w+6;v=(h-n+1)*c.text_h+6;f||(f=c.xpos);g||(g=c.ypos);s=Math.max(0,Math.min(f,c.width-l));D=Math.max(0,Math.min(g,c.height-v));k=s+3;p=D+3;e.widgetbox(c,s,D,l,v,k,p,0,"");v=p+c.text_h/3;for(k+=c.text_w;n<h;)v+=c.text_h,r&&(k=s+l/2-d[n].length*c.text_w/2),e.text(c,k,v,d[n]),n++;c.widget={type:"ONESHOT",callback:function(a){if("mousedown"===a.type||"keydown"===a.type)c.widget=
null,e.onWidgetLayer(c,function(){e.erase_window(c)})}}})};e.draw_box=function(c,a,e,f,g,l,h,r){var n=c.active_canvas.getContext("2d");if("xor"!==a)n.lineWidth=1,n.strokeStyle=a,n.strokeRect(e,f,g,l);else if("undefined"===typeof Uint8ClampedArray)n.lineWidth=1,n.strokeStyle=c.fg,n.strokeRect(e,f,g,l);else{e=Math.floor(e);f=Math.floor(f);g=Math.floor(g);l=Math.floor(l);c=c.canvas.getContext("2d");for(var s=c.getImageData(e,f,g,1),k=s.data,v=0;v<s.data.length;v++)k[4*v]=255-k[4*v],k[4*v+1]=255-k[4*
v+1],k[4*v+2]=255-k[4*v+2],k[4*v+3]=255;n.putImageData(s,e,f);s=c.getImageData(e,f+l,g,1);k=s.data;for(v=0;v<s.data.length;v++)k[4*v]=255-k[4*v],k[4*v+1]=255-k[4*v+1],k[4*v+2]=255-k[4*v+2],k[4*v+3]=255;n.putImageData(s,e,f+l);s=c.getImageData(e,f,1,l);k=s.data;for(v=0;v<l;v++)k[4*v]=255-k[4*v],k[4*v+1]=255-k[4*v+1],k[4*v+2]=255-k[4*v+2],k[4*v+3]=255;n.putImageData(s,e,f);s=c.getImageData(e+g,f,1,l);k=s.data;for(v=0;v<l;v++)k[4*v]=255-k[4*v],k[4*v+1]=255-k[4*v+1],k[4*v+2]=255-k[4*v+2],k[4*v+3]=255;
n.putImageData(s,e+g,f)}h!==d&&0<h&&(c=n.globalAlpha,n.globalAlpha=h,n.fillStyle=r?r:a,n.fillRect(e+1,f+1,g-1,l-1),n.globalAlpha=c)};e.set_font=function(c,a){var d=c.canvas.getContext("2d"),e=c.wid_canvas.getContext("2d");if(c.font&&c.font.width===a)d.font=c.text_h+"px "+c.font.font,e.font=c.text_h+"px "+c.font.font;else{var f=1;do{f+=1;d.font=f+"px Courier New, monospace";e.font=f+"px Courier New, monospace";var g=d.measureText("M");c.text_w=g.width;c.text_h=f}while(c.text_w<a);c.font={font:"Courier New, monospace",
width:a}}};e.textline=function(c,a,d,e,f,g){var l=c.active_canvas.getContext("2d");g||(g={});g.color||(g.color=c.fg);g.width||(g.width=1);B(l,a,d,e,f,g,g.color,g.width)};e.tics=function(c,a,d){var e=1,f=c;if(a===c)return{dtic:1,dtic1:c};e=Math.abs(a-c)/d;d=Math.max(e,1E-36);d=Math.log(d)/Math.log(10);0>d?(d=Math.ceil(d),d-=1):d=Math.floor(d);e*=Math.pow(10,-d);d=Math.pow(10,d);e=1.75>e?d:2.25>e?2*d:3.5>e?2.5*d:7>e?5*d:10*d;0===e&&(e=1);a>=c?(d=Math.floor(0<=c?c/e+0.995:c/e-0.005),f=d*e):(d=Math.floor(0<=
c?c/e+0.005:c/e-0.995),f=d*e,e*=-1);f+e===f&&(e=a-c);return{dtic:e,dtic1:f}};e.drawaxis=function(c,f,g,l,h,p){var q=e.origin(c.origin,1,c.stk[c.level]),r=0,n=0,s=0,k=0,v=0,D=0;l=l===d?30:l;h=h===d?30:h;p.exactbox?(r=Math.floor(q.x1),n=Math.floor(q.y1),s=Math.floor(q.x2),k=Math.floor(q.y2),v=s-r,D=k-n):(r=Math.max(Math.floor(q.x1)-2,0),n=Math.max(Math.floor(q.y1)-2,0),s=Math.min(Math.floor(q.x2)+2,c.width),k=Math.min(Math.floor(q.y2)+2,c.height),v=s-r-4,D=k-n-4);var H=c.active_canvas.getContext("2d");
p.fillStyle?Array.isArray(p.fillStyle)?H.fillStyle=e.linear_gradient(c,0,0,0,k-n,p.fillStyle):H.fillStyle=p.fillStyle:H.fillStyle=c.bg;H.fillRect(r,n,s-r,k-n);p.noaxisbox||(e.textline(c,r,n,s,n),e.textline(c,s,n,s,k),e.textline(c,s,k,r,k),e.textline(c,r,k,r,n));var P;P=1===l?!0:!1;var u={dtic:0,dtic1:0},H={dtic:0,dtic1:0};0>f?(u.dtic1=q.xmin,u.dtic=(q.xmin-q.xmax)/f):u=e.tics(q.xmin,q.xmax,f);var B=1;P||(B=e.mult(q.xmin,q.xmax));0>g?(H.dtic1=q.ymin,H.dtic=(q.ymin-q.ymax)/g):H=e.tics(q.ymin,q.ymax,
g);f=1;f=e.mult(q.ymin,q.ymax);P=!p.noxtlab;g=!p.noytlab;var R=Math.max(0,r-4*c.text_w),N=0,N=p.ontop?Math.min(c.height,Math.floor(k+1.5*c.text_h)):Math.max(c.text_h,Math.floor(n-0.5*c.text_h)),I,w;0<N&&(p.noyplab||(w=a.label(h,f)),p.noxplab||(I=a.label(l,B)));I&&w?e.text(c,R,N,w+" vs "+I):I?e.text(c,R,N,I):w&&e.text(c,R,N,w);l=5.5*c.text_w;h=0;h=p.ontop?p.inside?n+1*c.text_h:n-0.2*c.text_h:p.inside?k-0.5*c.text_h:k+1*c.text_h+2;var v=q.xmin!==q.xmax?v/(q.xmax-q.xmin):v/1,B=0!==B?1/B:1,y;P&&(y=1E-6<
Math.abs(u.dtic)/Math.max(Math.abs(u.dtic1),Math.abs(u.dtic)));0===u.dtic&&(u.dtic=q.xmax-u.dtic1+1);w="";for(R=u.dtic1;R<=q.xmax;R+=u.dtic)I=r+Math.round(v*(R-q.xmin))+2,I<r||(p.grid&&"y"!==p.grid?(p.gridStyle||(p.gridStyle={mode:"dashed",on:1,off:3}),e.textline(c,I,k,I,n,p.gridStyle)):(e.textline(c,I,k-2,I,k+2),e.textline(c,I,n-2,I,n+2)),P&&(y?(w="",w=e.format_f(R*B,12,6),w=F(w,!0),N=Math.round(w.length/2)*c.text_w,p.inside&&(I=Math.max(r+N,I),I=Math.min(s-N,I)),e.text(c,I-N,h,w)):R===u.dtic1&&
(w=(u.dtic1*B).toString(),p.inside&&(I=Math.floor(Math.max(r+l,I))),e.text(c,I-l,h,w))));l=p.yonright?p.inside?Math.min(s-6*c.text_w,c.width-5*c.text_w):Math.min(s+c.text_w,c.width-5*c.text_w):p.inside?Math.max(0,r+c.text_w):Math.max(0,Math.floor(r-5.5*c.text_w));h=0.4*c.text_h;v=q.ymin!==q.ymax?-D/(q.ymax-q.ymin):-D/1;B=0!==f?1/f:1;D=q.ymax>=q.ymin?function(c){return c<=q.ymax}:function(c){return c>=q.ymax};for(y=H.dtic1;D(y);y+=H.dtic)I=k+Math.round(v*(y-q.ymin))-2,I>k||(p.grid&&"x"!==p.grid?(p.gridStyle||
(p.gridStyle={mode:"dashed",on:1,off:3}),e.textline(c,r,I,s,I,p.gridStyle)):(e.textline(c,r-2,I,r+2,I),e.textline(c,s-2,I,s+2,I)),!g||p.inside&&(I<n+c.text_h||I>k-2*c.text_h)||(u=e.format_f(y*B,12,6),u=F(u,p.inside),e.text(c,l,Math.min(k,I+h),u)))};e.inrect=function(c,a,d,e,f,g){return c>=d&&c<=d+f&&a>=e&&a<=e+g};var J={GBorder:3,sidelab:0,toplab:1};e.menu=function(c,a){var l=1.5*c.text_h;if(a){if(!c.widget){a.x=c.xpos;a.y=c.ypos;a.val=0;a.h=2*J.GBorder+l*a.items.length+J.toplab*(l+J.GBorder)-1;a.y=
a.y-((J.toplab+Math.max(1,a.val)-0.5)*l+(1+J.toplab)*J.GBorder)+1;for(var p=a.title.length,q=0,z=0;z<a.items.length;z++){var u=a.items[z],p=Math.max(p,u.text.length);"checkbox"===u.style&&(p+=2);"separator"===u.style&&(p+=2);u.checked&&"checkbox"!==u.style&&(q=l*z)}a.y-=q;p=(p+2)*c.text_w;a.w=2*J.GBorder+Math.abs(J.sidelab)+p-1;a.x-=a.w/2;c.menu=a;c.widget={type:"MENU",callback:function(r){var n=a;if(r===d)f(c,n);else if("mousemove"===r.type){n.drag_x!==d&&n.drag_y!==d&&2<Math.abs(c.xpos-n.drag_x)&&
2<Math.abs(c.ypos-n.drag_y)&&(n.x+=c.xpos-n.drag_x,n.y+=c.ypos-n.drag_y,n.drag_x=c.xpos,n.drag_y=c.ypos);var s=n.x+J.GBorder+Math.max(0,J.sidelab),k=n.w-2*J.GBorder-Math.abs(J.sidelab),v=1.5*c.text_h,l=n.y+J.GBorder+J.toplab*(v+J.GBorder);for(r=0;r<n.items.length;r++){var p=l+v*r,q=n.items[r];q.selected=!1;e.inrect(c.xpos,c.ypos,s,p,k,v)&&(q.selected=!0)}f(c,n)}else if("mouseup"===r.type)n.drag_x=d,n.drag_y=d;else if("mousedown"===r.type)r.preventDefault(),1===r.which?c.xpos>n.x&&c.xpos<n.x+n.w&&
c.ypos>n.y&&c.ypos<n.y+1.5*c.text_h?(n.drag_x=c.xpos,n.drag_y=c.ypos):g(c,n):h(c,n);else if("keydown"===r.type&&c.menu)if(n=c.menu,r.preventDefault(),r=getKeyCode(r),13===r)g(c,n);else if(38===r){for(r=0;r<n.items.length;r++)if(q=n.items[r],q.selected){q.selected=!1;n.items[r-1]!==d&&(n.items[r-1].selected=!0);break}else r===n.items.length-1&&(q.selected=!0);f(c,n)}else if(40===r){for(r=0;r<n.items.length;r++)if(q=n.items[r],q.selected){q.selected=!1;n.items[r+1]!==d&&(n.items[r+1].selected=!0);break}else r===
n.items.length-1&&(n.items[0].selected=!0);f(c,n)}else if(48<=r&&57>=r||65<=r&&90>=r){r=String.fromCharCode(r).toUpperCase();n.keypresses=n.keypresses===d?r:n.keypresses+r;for(r=s=0;r<n.items.length;r++)q=n.items[r],q.selected=!1,q.text&&0===q.text.toUpperCase().indexOf(n.keypresses)&&(0===s&&(q.selected=!0),s++);0===s?(n.keypresses=d,f(c,n)):1===s?g(c,n):f(c,n)}}}}f(c,a)}};e.widgetbox=function(c,a,d,f,g,l,h,r,n,s){e.shadowbox(c,a,d,f,g,1,2,"",0);s&&(g=s.length,g=Math.min(g,f/c.text_w),g=Math.max(g,
1),a+=(f-g*c.text_w)/2,d+=3,e.text(c,a,d+(h-d+0.7*c.text_h)/2,s,c.xwfg));0<r&&0<n&&(d=c.active_canvas.getContext("2d"),d.fillStyle=c.bg,d.fillRect(l,h,r,n))};e.text=function(c,a,e,f,g){var l=c.active_canvas.getContext("2d");a=Math.max(0,a);e=Math.max(0,e);if(0>a||0>e)throw"On No!";l.textBaseline="bottom";l.textAlign="left";l.fillStyle=g===d?c.fg:g;l.fillText(f,a,e)};e.getcolor=function(c,a,d){for(c=0;6>c&&0===a[c+1].pos;c++);for(;d>a[c].pos&&6>c;)c++;if(0===c||d>=a[c].pos)return y(C(a[c].red),C(a[c].green),
C(a[c].blue));d=C((d-a[c-1].pos)/(a[c].pos-a[c-1].pos)*100);var e=255-d;return y(a[c].red/100*d+a[c-1].red/100*e,a[c].green/100*d+a[c-1].green/100*e,a[c].blue/100*d+a[c-1].blue/100*e)};e.redraw_warpbox=function(c){c.warpbox&&(c._animationFrameHandle&&cancelAnimFrame(c._animationFrameHandle),c._animationFrameHandle=requestAnimFrame(function(){E(c)}))};e.format_g=function(c,a,d,f){a=Math.abs(c).toString();var g=a.indexOf(".");-1===g&&(a+=".",g=a.length);f=0;var l=a.indexOf("e");-1!==l&&(f=parseInt(a.slice(l+
1,a.length),10),a=a.slice(0,l));for(var l=Math.min(d-(a.length-g)+1,d),h=0;h<l;h++)a+="0";if(0!==c)if(1>Math.abs(c))if("0."===a.slice(0,2))for(h=2;h<a.length;h++)if("0"===a[h])f-=1;else{a="0."+a.slice(h,h+d);break}else a=a.slice(0,d+2);else g>d?(f=Math.max(0,a.length-d-2),a=a[0]+"."+a.slice(1,9)):a=a.slice(0,d+2);0===f?a+="    ":(d=e.pad(Math.abs(f).toString(),2,"0"),a=0>f?a+"E-"+d:a+"E+"+d);return 0>c?"-"+a:" "+a};e.format_f=function(a,d,f){a=a.toFixed(f).toString();return a=e.pad(a,d+f," ")};e.pad=
function(a,d,e){for(;a.length<d;)a=e+a;return a};e.shadowbox=function(c,d,f,g,l,h,p,r){for(var n=r.length,s=0,k=0,s=0,k=[],v=0;11>v;v++)k[v]={x:0,y:0};v=!(1===p||-1===p);0!==p&&0<e.GBorder&&(s=a.trunc(Math.min(g,l)/3),s=Math.max(1,Math.min(s,e.GBorder)));if(0<s){k[0].x=k[1].x=d;k[8].x=k[9].x=d+g;k[1].y=k[8].y=f;k[0].y=k[9].y=f+l;switch(h){case e.L_ArrowLeft:k[0].y=k[1].y=f+a.trunc(l/2);d+=2;--g;break;case e.L_ArrowRight:k[8].y=k[9].y=f+a.trunc(l/2);--d;--g;break;case e.L_ArrowUp:k[1].x=k[8].x=d+a.trunc(g/
2);f+=2;--l;break;case e.L_ArrowDown:k[0].x=k[9].x=d+a.trunc(g/2),--f,--l}k[2]=k[8];k[10]=k[0];d+=s;f+=s;g-=2*s;l-=2*s}k[4].x=k[5].x=d;k[3].x=k[6].x=d+g;k[3].y=k[4].y=f;k[5].y=k[6].y=f+l;switch(h){case e.L_ArrowLeft:k[4].y=k[5].y=f+a.trunc(l/2);break;case e.L_ArrowRight:k[3].y=k[6].y=f+a.trunc(l/2);break;case e.L_ArrowUp:k[3].x=k[4].x=d+a.trunc(g/2);break;case e.L_ArrowDown:k[5].x=k[6].x=d+a.trunc(g/2)}k[7]=k[3];h=c.active_canvas.getContext("2d");0<s&&(h.fillStyle=0<p?c.xwts:c.xwbs,u(h,k.slice(0,
7)),h.fillStyle=0>p?c.xwts:c.xwbs,u(h,k.slice(5,11)));v&&(h.fillStyle=c.xwbg,u(h,k.slice(3,8)));h.fillStyle=c.xwfg;h.textBaseline="alphabetic";v&&0<n&&(n=Math.min(n,a.trunc(g/c.text_w)),n=Math.max(n,1),s=d+a.trunc((g-n*c.text_w)/2),k=f+a.trunc((l+0.7*c.text_h)/2),h.fillText(r,s,k))};e.ifevent=function(a,e){a.button_press=0;a.button_release=0;a.state_mask=0;var f=e.target.getBoundingClientRect(),g=e.offsetX===d?e.pageX-f.left-window.scrollX:e.offsetX,f=e.offsetX===d?e.pageY-f.top-window.scrollY:e.offsetY;
switch(e.type){case "mousedown":a.xpos=K(g,0,a.width);a.ypos=K(f,0,a.height);switch(e.which){case 1:a.button_press=1;break;case 2:a.button_press=2;break;case 3:a.button_press=3;break;case 4:a.button_press=4;break;case 5:a.button_press=5}break;case "mouseup":switch(a.xpos=K(g,0,a.width),a.ypos=K(f,0,a.height),e.which){case 1:a.button_release=1;break;case 2:a.button_release=2;break;case 3:a.button_release=3;break;case 4:a.button_release=4;break;case 5:a.button_release=5}}};e.scroll_real2pix=function(a){if(0===
a.range)return{s1:a.a1,sw:a.a2-a.a1};var d,e;d=(a.a2-a.a1)/a.trange;e=a.a1+Math.floor(0.5+(a.smin-a.tmin)*d);d=e+Math.floor(0.5+a.srange*d);e=e>a.a2-a.swmin?a.a2-a.swmin:Math.max(e,a.a1);d=d<a.a1+a.swmin?a.a1+a.swmin:Math.min(d,a.a2);return{s1:e,sw:Math.max(d-e,a.swmin)}};e.redrawScrollbar=function(c,d,f){var g,l,h,p,r,n,s,k,v=d.active_canvas.getContext("2d");l=e.scroll_real2pix(c);s=l.s1;k=l.sw;n=s;l=c.x;h=c.y;p=c.w;r=c.h;c.origin&1?(g=h+r/2,c.origin&2&&(n=p-n-k),f===e.XW_DRAW&&(f=c.arrow,e.shadowbox(d,
l,h,f,r-1,e.L_ArrowLeft,2,"",0),e.shadowbox(d,l+p-f,h,f-1,r,e.L_ArrowRight,2,"",0)),d.legacyRender?e.draw_line(d,d.fg,l+c.a1,g,l+c.a2,g):(v=v.createLinearGradient(l+c.a1,0,l+c.a2,0),v.addColorStop(0,d.xwbs),v.addColorStop(0.5,d.xwts),v.addColorStop(1,d.xwbs),e.draw_line(d,v,l+c.a1,g,l+c.a2,g,1)),e.shadowbox(d,l+n,h,k+1,r,1,2,"",0)):(g=l+a.trunc(p/2),2>=c.origin&&(n=r-n-k),f===e.XW_DRAW&&(f=c.arrow,e.shadowbox(d,l,h,p-1,f,e.L_ArrowUp,2,"",0),e.shadowbox(d,l,h+r-f,p-1,f,e.L_ArrowDown,2,"",0)),d.legacyRender?
e.draw_line(d,d.fg,g,h+c.a1,g,h+c.a2):(v=v.createLinearGradient(0,h+c.a1,0,h+c.a2),v.addColorStop(0,d.xwbs),v.addColorStop(0.5,d.xwts),v.addColorStop(1,d.xwbs),e.draw_line(d,v,g,h+c.a1,g,h+c.a2)),e.shadowbox(d,l,h+n,p,k+1,1,2,"",0));c.s1=s;c.sw=k};e.real_to_pixel=function(a,d,f,g){a=e.origin(a.origin,4,a.stk[a.level]);if(0===a.xscl||0===a.yscl)return{x:0,y:0};var l=a.x1,h=a.y1,p=a.xmin,r=1/a.xscl,n=a.ymin,s=1/a.yscl,k=d>a.xmax||d<a.xmin||f>a.ymin||f<a.ymax;g&&(d=Math.min(d,a.xmax),f=Math.max(d,a.xmin),
f=Math.min(f,a.ymin),f=Math.max(f,a.ymax));d=Math.round((d-p)*r)+l;f=Math.round((f-n)*s)+h;return{x:d,y:f,clipped:k}};e.pixel_to_real=function(a,d,e){d=Math.min(a.r,Math.max(a.l,d));e=Math.min(a.b,Math.max(a.t,e));var f=a.level;return{x:2!==a.origin&&3!==a.origin?a.stk[f].xmin+(d-a.stk[f].x1)*a.stk[f].xscl:a.stk[f].xmin+(a.stk[f].x2-d)*a.stk[f].xscl,y:2<a.origin?a.stk[f].ymin+(e-a.stk[f].y1)*a.stk[f].yscl:a.stk[f].ymin+(a.stk[f].y2-e)*a.stk[f].yscl}};e.colormap=function(a,d,e){a.pixel=Array(e);for(var f=
Array(e),g=100/(Math.max(2,e)-1),l=0;l<e;l++)f[l]=g*l+0.5;for(g=0;6>g&&0===d[g+1].pos;g++);for(l=0;l<e;l++){a.pixel[l]=0;for(var h=f[l];6>g&&Math.floor(h)>d[g].pos;)g++;if(0===g||h>=d[g].pos)a.pixel[l]={red:C(d[g].red),green:C(d[g].green),blue:C(d[g].blue)};else{var h=C((h-d[g-1].pos)/(d[g].pos-d[g-1].pos)*100),r=255-h;a.pixel[l]={red:d[g].red/100*h+d[g-1].red/100*r,green:d[g].green/100*h+d[g-1].green/100*r,blue:d[g].blue/100*h+d[g-1].blue/100*r}}}};e.colorbar=function(a,d,f,g,l){for(var h=1;h<l;h++)e.draw_line(a,
Math.floor(a.pixel.length*(h-1)/l),d,f+l-h,d+g,f+l-h);e.draw_box(a,a.fg,d+0.5,f,g,l)};var X="undefined"===typeof Uint8ClampedArray?U:T;e.shift_image_rows=function(a,d,e){a=new Uint32Array(d);0<e?(e*=d.width,a.set(a.subarray(0,a.length-e),e)):0>e&&(e=Math.abs(e)*d.width,a.set(a.subarray(e)));return d};e.update_image_row=function(a,d,e,f,g,l){f=new Uint32Array(d,f*d.width*4,d.width);var h=1;l!==g&&(h=a.pixel.length/Math.abs(l-g));for(l=0;l<e.length;l++){var r=Math.floor((e[l]-g)*h),r=Math.max(0,Math.min(a.pixel.length-
1,r));(r=a.pixel[r])&&(f[l]=-16777216|r.blue<<16|r.green<<8|r.red)}return d};e.create_image=function(c,d,f,g,l,h){c.active_canvas.getContext("2d");c.pixel&&0!==c.pixel.length||(a.log.warn("COLORMAP not initialized, defaulting to foreground"),e.colormap(c,a.Mc.colormap[1],16));var p=1;h!==l&&(p=c.pixel.length/Math.abs(h-l));f=Math.ceil(f);g=Math.ceil(g);h=new ArrayBuffer(f*g*4);h.width=f;h.height=g;for(var r=new Uint32Array(h),n=0;n<r.length;n++){var s=Math.floor((d[(3===c.origin||4===c.origin?Math.floor(n/
f):g-Math.floor(n/f)-1)*f+(1===c.origin||4===c.origin?Math.floor(n%f):f-Math.floor(n%f)-1)]-l)*p),s=Math.max(0,Math.min(c.pixel.length-1,s));(s=c.pixel[s])&&(r[n]=-16777216|s.blue<<16|s.green<<8|s.red)}return h};e.put_image=function(c,d,f,g,l,h,p,r,n,s,k){n=c.active_canvas.getContext("2d");c.pixel&&0!==c.pixel.length||(a.log.warn("COLORMAP not initialized, defaulting to foreground"),e.colormap(c,a.Mc.colormap[1],16));f=Math.floor(0<l?f*l:-l);g=Math.floor(g*h);h=new ArrayBuffer(f*g*4);h.width=f;h.height=
g;l=new Uint32Array(h);for(var v=0;v<l.length;v++){var D=Math.max(0,d[v]),D=Math.min(c.pixel.length-1,D);(D=c.pixel[D])&&(l[v]=-16777216|D.blue<<16|D.green<<8|D.red)}X(c,n,h,s,k,p,r,f,g);return h};e.draw_image=function(a,d,f,g,l,h,p,r){var n=Math.max(f,a.stk[a.level].xmin),s=Math.min(l,a.stk[a.level].xmax),k=Math.max(g,a.stk[a.level].ymin),v=Math.min(h,a.stk[a.level].ymax);if(!(1>=d.width||0===Math.abs(l-f)||1>=d.height||0===Math.abs(h-g))){var D=(d.width-1)/(l-f);f=Math.max(0,Math.floor((n-f)*D));
l=Math.min(d.width,d.width-Math.floor((l-s)*D)-f);D=(d.height-1)/(h-g);g=Math.max(0,Math.floor((k-g)*D));h=Math.min(d.height,d.height-Math.floor((h-v)*D)-g);var q,P;1===a.origin?(q=e.real_to_pixel(a,n,v),P=e.real_to_pixel(a,s,k)):2===a.origin?(q=e.real_to_pixel(a,s,v),P=e.real_to_pixel(a,n,k)):3===a.origin?(q=e.real_to_pixel(a,s,k),P=e.real_to_pixel(a,n,v)):4===a.origin&&(q=e.real_to_pixel(a,n,k),P=e.real_to_pixel(a,s,v));n=P.x-q.x;P=P.y-q.y;s=a.active_canvas.getContext("2d");X(a,s,d,p,r,q.x,q.y,
n,P,f,g,l,h)}}})(window.mx,window.m);
(function(e,a,d,x){e.Layer1D=function(a){this.plot=a;this.ybuf=this.xbuf=x;this.xmax=this.xmin=this.imin=this.xdelta=this.xstart=this.offset=0;this.name="";this.cx=!1;this.hcb=x;this.size=0;this.display=!0;this.color=0;this.line=3;this.thick=1;this.symbol=0;this.radius=3;this.ysub=this.xsub=this.skip=0;this.modified=this.xdata=!1;this.preferred_origin=this.opacity=1;this.options={}};e.Layer1D.prototype={init:function(a,f){this.hcb=a;this.hcb.buf_type="D";this.ybufn=this.xbufn=this.size=this.offset=
0;this.hcb.pipe?this.size=f.framesize:2===a["class"]?(d.force1000(a),this.size=a.subsize):this.size=a.size;2>=a["class"]&&(this.xsub=-1,this.ysub=1,this.cx="C"===a.format[0]);this.skip=1;this.cx&&(this.skip=2);this.xstart=a.xstart;this.xdelta=a.xdelta;var g=a.xstart+a.xdelta*(this.size-1);this.xmin=Math.min(a.xstart,g);this.xmax=Math.max(a.xstart,g);this.xlab=a.xunits;this.ylab=a.yunits;if(this.hcb.pipe){this.drawmode="scrolling";this.position=0;this.tle=f.tl;this.ybufn=this.size*Math.max(this.skip*
e.PointArray.BYTES_PER_ELEMENT,e.PointArray.BYTES_PER_ELEMENT);this.ybuf=new ArrayBuffer(this.ybufn);var h=this;d.addPipeWriteListener(this.hcb,function(){h._onpipewrite()})}},_onpipewrite:function(){var a=new e.PointArray(this.ybuf),f=this.tle;if(f===x)f=Math.floor(d.pavail(this.hcb))/this.hcb.spa;else if(d.pavail(this.hcb)<f*this.hcb.spa)return;var g=f*this.hcb.spa;if("lefttoright"===this.drawmode)this.position=0,a.set(a.subarray(0,this.size-g),g);else if("righttoleft"===this.drawmode)this.position=
this.size-f,a.set(a.subarray(g),0);else if("scrolling"!==this.drawmode)throw"Invalid draw mode";f=Math.min(f,this.size-this.position);0!==d.grabx(this.hcb,a,f*this.hcb.spa,this.position*this.hcb.spa)&&(this.position=(this.position+f)%this.size)},get_data:function(a,f){var g=this.plot._Gx,h=this.hcb,p=this.skip,q;q=2===h["class"]?h.subsize:h.size;var u=0,p=0;g.index?(u=Math.floor(a),p=Math.floor(f+0.5)):0<=h.xdelta?(u=Math.floor((a-h.xstart)/h.xdelta)-1,p=Math.floor((f-h.xstart)/h.xdelta+0.5)):(u=
Math.floor((f-h.xstart)/h.xdelta)-1,p=Math.floor((a-h.xstart)/h.xdelta+0.5));u=Math.max(0,u);p=Math.min(q,p);g=Math.max(0,Math.min(p-u+1,g.bufmax));0>h.xdelta&&(u=p-g+1);if(!(u>=this.imin&&u+g<=this.imin+this.size&&this.ybuf!==x||this.modified)&&2>=h["class"]){q=this.offset+u;p=this.skip;this.ybufn=g*Math.max(p*e.PointArray.BYTES_PER_ELEMENT,e.PointArray.BYTES_PER_ELEMENT);if(this.ybuf===x||this.ybuf.byteLength<this.ybufn)this.ybuf=new ArrayBuffer(this.ybufn);p=new e.PointArray(this.ybuf);g=d.grab(h,
p,q,g);this.imin=u;this.xstart=h.xstart+u*this.xdelta;this.size=g}},change_settings:function(a){if(a.index!==x)if(a.index)this.xmin=this.xdelta=this.xstart=1,this.xmax=this.size;else{this.xstart=this.hcb.xstart+this.imin*this.xdelta;this.xdelta=this.hcb.xdelta;var d=this.hcb.xstart+this.hcb.xdelta*(this.size-1);this.xmin=Math.min(this.hcb.xstart,d);this.xmax=Math.max(this.hcb.xstart,d)}a.drawmode!==x&&(this.drawmode=a.drawmode,this.position=0,this.ybufn=this.size*Math.max(this.skip*e.PointArray.BYTES_PER_ELEMENT,
e.PointArray.BYTES_PER_ELEMENT),this.ybuf=new ArrayBuffer(this.ybufn))},reload:function(a,d){var e=this.hcb.dview.length!==a.length||d;if(d)for(var h in d)this.hcb[h]=d[h];this.hcb.setData(a);this.imin=0;this.xstart=x;this.size=0;h=this.xmin;var p=this.xmax;e&&(e=this.hcb.xstart+this.hcb.xdelta*(this.hcb.size-1),this.xmin=Math.min(this.hcb.xstart,e),this.xmax=Math.max(this.hcb.xstart,e),this.xdelta=this.hcb.xdelta,this.xstart=this.hcb.xstart,p=h=x);return{xmin:h,xmax:p}},push:function(a,e,g){if(e){for(var h in e)this.hcb[h]=
e[h];h=this.hcb.xstart+this.hcb.xdelta*(this.hcb.size-1);this.xmin=Math.min(this.hcb.xstart,h);this.xmax=Math.max(this.hcb.xstart,h);this.xdelta=this.hcb.xdelta;this.xstart=this.hcb.xstart}d.filad(this.hcb,a,g);return e?!0:!1},prep:function(a,f){var g=this.plot._Gx,h=this.plot._Mx,p=Math.ceil(this.size),q=this.skip;if(0!==p){p*e.PointArray.BYTES_PER_ELEMENT>g.pointbufsize&&(g.pointbufsize=p*e.PointArray.BYTES_PER_ELEMENT,g.xptr=new ArrayBuffer(g.pointbufsize),g.yptr=new ArrayBuffer(g.pointbufsize));
var u=new e.PointArray(this.ybuf),w=new e.PointArray(g.xptr),C=this.xmin,y=this.xmax,x,E;if(5===g.cmode||0<this.xsub)0>=p?(C=g.panxmin,y=g.panxmax):5!==g.cmode?w=new e.PointArray(this.xbuf):this.cx?d.vmov(u,q,w,1,p):0!==this.line?(E=d.vmxmn(u,p),w[0]=E.smax,w[1]=E.smin,p=2):w=u,0<p&&(E=d.vmxmn(w,p),y=E.smax,C=E.smin);else if(0<p){E=this.xstart;var K=this.xdelta,u=p;g.index?(x=0,p-=1):0<=K?(x=Math.max(1,Math.min(u,Math.round((a-E)/K)))-1,p=Math.max(1,Math.min(u,Math.round((f-E)/K)+2))-1):(x=Math.max(1,
Math.min(u,Math.round((f-E)/K)-1))-1,p=Math.max(1,Math.min(u,Math.round((a-E)/K)+2))-1);p=p-x+1;0>p&&(d.log.debug("Nothing to plot"),p=0);u=(new e.PointArray(this.ybuf)).subarray(x*q);E+=K*x;for(x=0;x<p;x++)w[x]=g.index?this.imin+x+1:E+x*K}g.panxmin>g.panxmax?(g.panxmin=C,g.panxmax=y):(g.panxmin=Math.min(g.panxmin,C),g.panxmax=Math.max(g.panxmax,y));if(0>=p)d.log.debug("Nothing to plot");else{C=new e.PointArray(g.yptr);if(this.cx)1===g.cmode?d.cvmag(u,C,p):2===g.cmode?25===g.plab?(d.cvpha(u,C,p),
d.vsmul(C,1/(2*Math.PI),C,p)):24!==g.plab?d.cvpha(u,C,p):d.cvphad(u,C,p):3===g.cmode?d.vmov(u,q,C,1,p):6<=g.cmode?d.cvmag2(u,C,p):4<=g.cmode&&d.vmov(u.subarray(1),q,C,1,p);else if(5===g.cmode)d.vfill(C,0,p);else if(1===g.cmode||6<=g.cmode)for(x=0;x<p;x++)C[x]=Math.abs(u[x]);else for(x=0;x<p;x++)C[x]=u[x];6<=g.cmode&&(d.vlog10(C,g.dbmin,C),q=10,7===g.cmode&&(q=20),0<g.lyr.length&&g.lyr[0].cx&&(q/=2),d.vsmul(C,q,C));E=d.vmxmn(C,p);y=E.smax;C=E.smin;q=y-C;0>q&&(y=C,C=y+q,q=-q);1E-20>=q?(C-=1,y+=1):(C-=
0.02*q,y+=0.02*q);0===h.level&&(g.panymin>g.panymax?(g.panymin=C,g.panymax=y):(g.panymin=Math.min(g.panymin,C),g.panymax=Math.max(g.panymax,y)),1<g.autol&&(q=1/Math.max(g.autol,1),g.panymin=g.panymin*q+h.stk[0].ymin*(1-q),g.panymax=g.panymax*q+h.stk[0].ymax*(1-q)));return p}}},draw:function(){var d=this.plot._Mx,f=this.plot._Gx,g=this.color,h=this.symbol,p=this.radius,q=0,u={};u.fillStyle=f.fillStyle;this.options&&(u.highlight=this.options.highlight,u.noclip=this.options.noclip);0===this.line?q=0:
(q=1,0<this.thick?q=this.thick:0>this.thick&&(q=Math.abs(this.thick),u.dashed=!0),1===this.line&&(u.vertsym=!0),2===this.line&&(u.horzsym=!0));var w=f.segment&&5!==f.cmode&&0<this.xsub&&!0,x=this.xdelta,y,F;this.xdata?(y=this.xmin,F=this.xmax):(y=Math.max(this.xmin,d.stk[d.level].xmin),F=Math.min(this.xmax,d.stk[d.level].xmax),y>=F&&(f.panxmin=Math.min(f.panxmin,this.xmin),f.panxmax=Math.max(f.panxmax,this.xmax)));if(!f.all){var E=(f.bufmax-1)*x;-0<=E?F=Math.min(F,y+E):y=Math.max(y,F+E)}if(0!==q||
0!==h){for(;y<F;)this.hcb.pipe||this.get_data(y,F),E=this.prep(y,F),0<E&&!w&&a.trace(d,g,new e.PointArray(f.xptr),new e.PointArray(f.yptr),E,1,q,h,p,u),f.all?0===this.size?y=F:f.index?y+=E:0<=x?y+=this.size*x:F+=this.size*x:y=F;this.position&&"scrolling"===this.drawmode&&(f=a.real_to_pixel(d,this.position*this.xdelta,0),f.x>d.l&&f.x<d.r&&a.draw_line(d,"white",f.x,d.t,f.x,d.b))}},add_highlight:function(a){this.options.highlight||(this.options.highlight=[]);a instanceof Array?this.options.highlight.push.apply(this.options.highlight,
a):this.options.highlight.push(a);this.plot.refresh()},remove_highlight:function(a){if(this.options.highlight){for(var d=this.options.highlight.length;d--;)a!==this.options.highlight[d]&&a!==this.options.highlight[d].id||this.options.highlight.splice(d,1);this.plot.refresh()}},get_highlights:function(){return this.options.highlight?this.options.highlight.slice(0):[]},clear_highlights:function(){this.options.highlight&&(this.options.highlight=x,this.plot.refresh())}};var q=[0,53,27,80,13,40,67,93,
7,60,33,87,20,47,73,100];e.Layer1D.overlay=function(l,f,g){var h=l._Gx,p=l._Mx;2===f["class"]&&d.force1000(f);f.buf_type="D";var B=1;2===f["class"]&&(B=Math.min(f.size/f.subsize,16-h.lyr.length));for(var u=0;u<B;u++){var w=new e.Layer1D(l);w.init(f,g);w.color=a.getcolor(p,d.Mc.colormap[3],q[h.lyr.length%q.length]);2===f["class"]?(w.name=f.file_name?d.trim_name(f.file_name):"layer_"+h.lyr.length,w.name=w.name+"."+a.pad((u+1).toString(),3,"0"),w.offset=u*f.subsize):(w.name=f.file_name?d.trim_name(f.file_name):
"layer_"+h.lyr.length,w.offset=0);for(var C in g)w[C]!==x&&(w[C]=g[C]);l.add_layer(w)}}})(window.sigplot=window.sigplot||{},mx,m);
(function(e,a,d,x){e.Layer2D=function(a){this.plot=a;this.xmax=this.xmin=this.imin=this.ydelta=this.ystart=this.xdelta=this.xstart=this.offset=0;this.name="";this.cx=!1;this.hcb=x;this.display=!0;this.color=0;this.line=3;this.thick=1;this.symbol=0;this.radius=3;this.ysub=this.xsub=this.skip=0;this.modified=this.xdata=!1;this.preferred_origin=4;this.opacity=1;this.lpb=x;this.yc=1;this.options={}};e.Layer2D.prototype={init:function(a){var l=this.plot._Gx,f=this.plot._Mx;this.hcb=a;this.hcb.buf_type=
"D";if(this.hcb.pipe){var g=this;this.frame=this.position=0;this.lps=Math.ceil(Math.max(1,f.b-f.t));d.addPipeWriteListener(this.hcb,function(){g._onpipewrite()});this.buf=this.hcb.createArray(null,0,this.lps*this.hcb.subsize*this.hcb.spa);this.zbuf=new e.PointArray(this.lps*this.hcb.subsize)}else this.lps=Math.ceil(a.size);this.ybufn=this.xbufn=this.offset=0;this.drawmode="scrolling";2>=a["class"]&&(this.xsub=-1,this.ysub=1,this.cx="C"===a.format[0]);this.skip=1;this.cx&&(this.skip=2);l.index?(this.xmin=
this.xdelta=this.xstart=1,this.xmax=a.subsize,this.ymin=this.ydelta=this.ystart=1,this.ymax=this.size):(this.xstart=a.xstart,this.xdelta=a.xdelta,l=a.xstart+a.xdelta*(a.subsize-1),this.xmin=Math.min(a.xstart,l),this.xmax=Math.max(a.xstart,l),this.ystart=a.ystart,this.ydelta=a.ydelta,l=a.ystart+a.ydelta*(this.lps-1),this.ymin=Math.min(a.ystart,l),this.ymax=Math.max(a.ystart,l));this.xframe=this.hcb.subsize;this.yframe=this.lps*this.hcb.subsize/this.xframe;0===this.lpb&&(this.lpb=this.yframe);if(!this.lpb||
0>=this.lpb)this.lpb=16;this.lpb=Math.max(1,this.lpb/this.yc)*this.yc;this.xlab=a.xunits;this.ylab=a.yunits},_onpipewrite:function(){var q=this.plot._Gx,l=this.plot._Mx;if(!(d.pavail(this.hcb)<this.hcb.subsize*this.hcb.spa)){if("falling"===this.drawmode)this.position=0,this.buf.set(this.buf.subarray(0,(this.lps-1)*this.hcb.subsize*this.hcb.spa),this.hcb.subsize*this.hcb.spa),this.img&&a.shift_image_rows(l,this.img,1);else if("rising"===this.drawmode)this.position=this.lps-1,this.buf.set(this.buf.subarray(this.hcb.subsize*
this.hcb.spa),0),this.img&&a.shift_image_rows(l,this.img,-1);else if("scrolling"===this.drawmode)this.position>=this.lps&&(this.position=0);else throw"Invalid draw mode";if(0===d.grabx(this.hcb,this.buf,this.hcb.subsize*this.hcb.spa,this.position*this.hcb.subsize*this.hcb.spa))d.log.error("Internal error");else{var f=this.buf.subarray(this.position*this.hcb.subsize*this.hcb.spa,(this.position+1)*this.hcb.subsize*this.hcb.spa),g=new e.PointArray(this.hcb.subsize);this.cx?1===q.cmode?d.cvmag(f,g,g.length):
2===q.cmode?25===q.plab?(d.cvpha(f,g,g.length),d.vsmul(g,1/(2*Math.PI),g,g.length)):24!==q.plab?d.cvpha(f,g,g.length):d.cvphad(f,g,g.length):3===q.cmode?d.vmov(f,this.skip,g,1,g.length):4===q.cmode?d.vmov(f.subarray(1),this.skip,g,1,g.length):5===q.cmode?d.vfill(g,0,g.length):6===q.cmode?d.cvmag2logscale(f,q.dbmin,10,g):7===q.cmode&&d.cvmag2logscale(f,q.dbmin,20,g):1===q.cmode?d.vabs(f,g):2===q.cmode?d.vfill(g,0,g.length):3===q.cmode?d.vmov(f,this.skip,g,1,g.length):4===q.cmode?d.vfill(g,0,g.length):
5===q.cmode?d.vfill(g,0,g.length):6===q.cmode?d.vlogscale(f,q.dbmin,10,g):7===q.cmode&&d.vlogscale(f,q.dbmin,20,g);for(var f=g[0],h=g[0],p=0;p<g.length;p++)g[p]<f&&(f=g[p]),g[p]>h&&(h=g[p]);1===q.autol?(q.zmin=f,q.zmax=h):1<q.autol&&(p=1/Math.max(q.autol,1),q.zmin=q.zmin*p+f*(1-p),q.zmax=q.zmax*p+h*(1-p));this.img&&a.update_image_row(l,this.img,g,this.position,q.zmin,q.zmax);this.frame+=1;"scrolling"===this.drawmode&&(this.position=(this.position+1)%this.lps)}}},get_data:function(){var a=this.hcb;
this.buf||(this.buf=this.hcb.createArray(null,0,this.lps*this.hcb.subsize*this.hcb.spa),this.zbuf=new e.PointArray(this.lps*this.hcb.subsize));this.hcb.pipe||d.grab(a,this.buf,0,a.subsize)},get_z:function(a,d){return this.zbuf[Math.floor(d/this.hcb.ydelta)*this.hcb.subsize+Math.floor(a/this.hcb.xdelta)]},change_settings:function(a){var d=this.plot._Gx;a.cmode!==x&&(this.img=x,d.zmin=x,d.zmax=x);a.cmap!==x&&(this.img=x);a.drawmode!==x&&(this.drawmode=a.drawmode,this.frame=this.position=0,this.buf=
this.hcb.createArray(null,0,this.lps*this.hcb.subsize*this.hcb.spa),this.zbuf=new e.PointArray(this.lps*this.hcb.subsize),this.img=x)},push:function(a,e,f){if(e){for(var g in e)this.hcb[g]=e[g];g=this.hcb.xstart+this.hcb.xdelta*(this.hcb.subsize-1);this.xmin=Math.min(this.hcb.xstart,g);this.xmax=Math.max(this.hcb.xstart,g);this.xdelta=this.hcb.xdelta;this.xstart=this.hcb.xstart;this.ystart=this.hcb.ystart;this.ydelta=this.hcb.ydelta;g=this.hcb.ystart+this.hcb.ydelta*(this.lps-1);this.ymin=Math.min(this.hcb.ystart,
g);this.ymax=Math.max(this.hcb.ystart,g)}d.filad(this.hcb,a,f);return e?!0:!1},prep:function(e,l){var f=this.plot._Gx,g=this.plot._Mx,h=this.lps,p=this.xmin,B=this.xmax,u;this.get_data(e,l);if(!(5===f.cmode||0<this.xsub)&&0<h){var w=this.xstart,C=this.xdelta,y=h;f.index?(u=0,h-=1):0<=C?(u=Math.max(1,Math.min(y,Math.round((e-w)/C)))-1,h=Math.max(1,Math.min(y,Math.round((l-w)/C)+2))-1):(u=Math.max(1,Math.min(y,Math.round((l-w)/C)-1))-1,h=Math.max(1,Math.min(y,Math.round((e-w)/C)+2))-1);h=h-u+1;0>h&&
(d.log.debug("Nothing to plot"),h=0)}f.panxmin>f.panxmax?(f.panxmin=p,f.panxmax=B):(f.panxmin=Math.min(f.panxmin,p),f.panxmax=Math.max(f.panxmax,B));if(0>=h)d.log.debug("Nothing to plot");else{!(5===f.cmode||0<this.ysub)&&0<h&&(p=this.ystart,B=this.ydelta,y=h,f.index?(u=0,h-=1):0<=B?(u=Math.max(1,Math.min(y,Math.round((e-p)/B)))-1,h=Math.max(1,Math.min(y,Math.round((l-p)/B)+2))-1):(u=Math.max(1,Math.min(y,Math.round((l-p)/B)-1))-1,h=Math.max(1,Math.min(y,Math.round((e-p)/B)+2))-1),h=h-u+1,0>h&&(d.log.debug("Nothing to plot"),
h=0));f.panymin>f.panxmax?(f.panymin=this.ymin,f.panymax=this.ymax):(f.panymin=Math.min(f.panymin,this.ymin),f.panymax=Math.max(f.panymax,this.ymax));this.cx?1===f.cmode?d.cvmag(this.buf,this.zbuf,this.zbuf.length):2===f.cmode?25===f.plab?(d.cvpha(this.buf,this.zbuf,this.zbuf.length),d.vsmul(this.zbuf,1/(2*Math.PI),this.zbuf,this.zbuf.length)):24!==f.plab?d.cvpha(this.buf,this.zbuf,this.zbuf.length):d.cvphad(this.buf,this.zbuf,this.zbuf.length):3===f.cmode?d.vmov(this.buf,this.skip,this.zbuf,1,this.zbuf.length):
4===f.cmode?d.vmov(this.buf.subarray(1),this.skip,this.zbuf,1,this.zbuf.length):5===f.cmode?d.vfill(this.zbuf,0,this.zbuf.length):6===f.cmode?d.cvmag2logscale(this.buf,f.dbmin,10,this.zbuf):7===f.cmode&&d.cvmag2logscale(this.buf,f.dbmin,20,this.zbuf):1===f.cmode?d.vabs(this.buf,this.zbuf):2===f.cmode?d.vfill(this.zbuf,0,this.zbuf.length):3===f.cmode?d.vmov(this.buf,this.skip,this.zbuf,1,this.zbuf.length):4===f.cmode?d.vfill(this.zbuf,0,this.zbuf.length):5===f.cmode?d.vfill(this.zbuf,0,this.zbuf.length):
6===f.cmode?d.vlogscale(this.buf,f.dbmin,10,this.zbuf):7===f.cmode&&d.vlogscale(this.buf,f.dbmin,20,this.zbuf);y=this.zbuf;this.hcb.pipe&&this.frame<this.lps&&(y="rising"===this.drawmode?this.zbuf.subarray(this.zbuf.length-this.frame*this.hcb.subsize):this.zbuf.subarray(0,this.frame*this.hcb.subsize));B=p=0;if(0<y.length)for(p=y[0],B=y[0],u=0;u<y.length&&!(u/this.xframe>=this.lpb);u++)y[u]<p&&(p=y[u]),y[u]>B&&(B=y[u]);f.zmin=f.zmin!==x?Math.min(f.zmin,p):p;f.zmax=f.zmax!==x?Math.min(f.zmax,B):B;this.img=
a.create_image(g,this.zbuf,this.hcb.subsize,this.lps,f.zmin,f.zmax);this.img.cmode=f.cmode;this.img.cmap=f.cmap;this.img.origin=g.origin;if(this.hcb.pipe&&this.frame<this.lps)if(f=new Uint32Array(this.img),"rising"===this.drawmode)for(u=0;u<f.length-this.frame*this.hcb.subsize;u++)f[u]=0;else for(u=this.frame*this.hcb.subsize;u<f.length;u++)f[u]=0;return h}},draw:function(){var d=this.plot._Mx,l=this.plot._Gx,f=this.hcb;if(this.hcb.pipe){var g=Math.ceil(Math.max(1,d.b-d.t));if(g!==this.lps&&this.buf){var h=
this.hcb.createArray(null,0,g*this.hcb.subsize*this.hcb.spa),p=new e.PointArray(g*this.hcb.subsize);h.set(this.buf.subarray(0,h.length));p.set(this.zbuf.subarray(0,p.length));this.buf=h;this.zbuf=p;this.lps=g;this.position>=this.lps&&(this.position=0);g=f.ystart+f.ydelta*(this.lps-1);this.ymin=Math.min(f.ystart,g);this.ymax=Math.max(f.ystart,g);this.plot.rescale()}}g=Math.max(this.xmin,d.stk[d.level].xmin);h=Math.min(this.xmax,d.stk[d.level].xmax);if(g>=h)l.panxmin=Math.min(l.panxmin,this.xmin),l.panxmax=
Math.max(l.panxmax,this.xmax);else{var x=Math.max(this.ymin,d.stk[d.level].ymin),u=Math.min(this.ymax,d.stk[d.level].ymax),p=Math.abs(h-g)+1,w=Math.abs(u-x)+1,p=Math.floor(p/f.xdelta),w=Math.floor(w/f.ydelta),p=Math.min(p,f.subsize),w=Math.min(w,f.size),f=a.real_to_pixel(d,g,x),u=a.real_to_pixel(d,h,u),w=(u.y-f.y)/w;l.xe=Math.max(1,Math.round((u.x-f.x)/p));l.ye=Math.max(1,Math.round(w));this.img?l.cmode===this.img.cmode&&l.cmap===this.img.cmap&&d.origin===this.img.origin||this.prep(g,h):this.prep(g,
h);this.img&&a.draw_image(d,this.img,this.xmin,this.ymin,this.xmax,this.ymax,this.opacity,l.rasterSmoothing);this.position&&(l=a.real_to_pixel(d,0,this.position*this.ydelta),l.y>d.t&&l.y<d.b&&a.draw_line(d,"white",d.l,l.y,d.r,l.y))}}};e.Layer2D.overlay=function(a,l,f){var g=a._Gx;l.buf_type="D";var h=new e.Layer2D(a);h.init(l);h.name=l.file_name?d.trim_name(l.file_name):"layer_"+g.lyr.length;for(var p in f)h[p]!==x&&(h[p]=f[p]);a.add_layer(h)}})(window.sigplot=window.sigplot||{},mx,m);
window.sigplot=window.sigplot||{};
(function(e,a,d){function x(){this.yptr=this.xptr=void 0;this.ymax=this.ymin=this.xmax=this.xmin=this.panymax=this.panymin=this.panxmax=this.panxmin=this.xdelta=this.xstart=this.arety=this.aretx=this.ymrk=this.xmrk=this.rety=this.retx=0;this.zmax=this.zmin=void 0;this.pmt=this.pyscl=this.pxscl=this.dbmin=0;this.format=this.note="";this.modsource=this.modlayer=this.pthk=this.pyl=this.py2=this.py1=this.px2=this.px1=this.pb=this.pt=this.pr=this.pl=0;this.modified=!1;this.ydiv=this.xdiv=this.modmode=
0;this.cross=this.expand=this.all=!1;this.grid=!0;this.gridBackground=void 0;this.index=!1;this.legend=this.specs=this.pan=!0;this.xdata=!1;this.show_readout=this.show_y_axis=this.show_x_axis=!0;this.autohide_panbars=this.autohide_readout=this.hide_note=!1;this.panning=void 0;this.panmode=0;this.hold=!1;this.isec=this.nsec=this.iysec=this.sections=0;this.ylab=this.xlab=void 0;this.default_rubberbox_action="zoom";this.default_rubberbox_mode="box";this.wheelscroll_mode_natural=!0;this.scroll_time_interval=
10;this.stillPanning=this.repeatPanning=void 0;this.autol=-1;this.wheelZoom=this.rasterSmoothing=this.lineSmoothing=!1;this.wheelZoomPercent=0.2;this.inContinuousZoom=!1;this.lyr=[];this.HCB=[];this.plugins=[];this.plotData=document.createElement("canvas");this.plotData.valid=!1}function q(d,c){var e=d._Mx;a.removeEventListener(e,"mousedown",d.onmousedown,!1);a.menu(e,{title:"SCROLLBAR",refresh:function(){d.refresh()},finalize:function(){a.addEventListener(e,"mousedown",d.onmousedown,!1);d.refresh()},
items:[{text:"Expand Range",handler:function(){t(d,a.SB_EXPAND,c)}},{text:"Shrink Range",handler:function(){t(d,a.SB_SHRINK,c)}},{text:"Expand Full",handler:function(){t(d,a.SB_FULL,c)}}]})}function l(c){var e=c._Gx,f=c._Mx;a.removeEventListener(f,"mousedown",c.onmousedown,!1);var k={text:"Cntrls...",menu:{title:"CONTROLS OPTIONS",items:[{text:"Continuous (Disabled)",checked:-2===e.cntrls,handler:function(){c.change_settings({xcnt:-2})}},{text:"LM Click (Disabled)",checked:-1===e.cntrls,handler:function(){c.change_settings({xcnt:-1})}},
{text:"Off",checked:0===e.cntrls,handler:function(){c.change_settings({xcnt:0})}},{text:"LM Click",checked:1===e.cntrls,handler:function(){c.change_settings({xcnt:1})}},{text:"Continuous",checked:2===e.cntrls,handler:function(){c.change_settings({xcnt:2})}}]}},g={text:"CX Mode...",menu:{title:"COMPLEX MODE",items:[{text:"Magnitude",checked:1===e.cmode,handler:function(){c.change_settings({cmode:1})}},{text:"Phase",checked:2===e.cmode,handler:function(){c.change_settings({cmode:2})}},{text:"Real",
checked:3===e.cmode,handler:function(){c.change_settings({cmode:3})}},{text:"Imaginary",checked:4===e.cmode,handler:function(){c.change_settings({cmode:4})}},{text:"IR: Imag/Real",checked:5===e.cmode,handler:function(){c.change_settings({cmode:5})}},{text:"10*Log10",checked:6===e.cmode,handler:function(){c.change_settings({cmode:6})}},{text:"20*Log10",checked:7===e.cmode,handler:function(){c.change_settings({cmode:7})}}]}},h={text:"Scaling...",menu:{title:"SCALING",items:[{text:"Y Axis",style:"separator"},
{text:"Parameters...",checked:0===e.autoy,handler:function(){e.autoy=0;K(c,"Y Axis Min:",a.floatValidator,function(a){parseFloat(a)!==f.stk[f.level].ymin?(""===a&&(a=0),A(c,parseFloat(a),f.stk[f.level].ymax,"Y")):c.refresh()},f.stk[f.level].ymin,void 0,void 0,function(){K(c,"Y Axis Max:",a.floatValidator,function(a){parseFloat(a)!==f.stk[f.level].ymax?(""===a&&(a=0),A(c,f.stk[f.level].ymin,parseFloat(a),"Y")):c.refresh()},f.stk[f.level].ymax,void 0,void 0,void 0)})}},{text:"Min Auto",checked:1===
e.autoy,handler:function(){e.autoy=1}},{text:"Max Auto",checked:2===e.autoy,handler:function(){e.autoy=2}},{text:"Full Auto",checked:3===e.autoy,handler:function(){e.autoy=3}},{text:"X Axis",style:"separator"},{text:"Parameters...",checked:0===e.autox,handler:function(){e.autox=0;K(c,"X Axis Min:",a.floatValidator,function(a){parseFloat(a)!==f.stk[f.level].xmin?(""===a&&(a=0),A(c,parseFloat(a),f.stk[f.level].xmax,"X")):c.refresh()},f.stk[f.level].xmin,void 0,void 0,function(){K(c,"X Axis Max:",a.floatValidator,
function(a){parseFloat(a)!==f.stk[f.level].xmax?(""===a&&(a=0),A(c,f.stk[f.level].xmin,parseFloat(a),"X")):c.refresh()},f.stk[f.level].xmax,void 0,void 0,void 0)})}},{text:"Min Auto",checked:1===e.autox,handler:function(){e.autox=1}},{text:"Max Auto",checked:2===e.autox,handler:function(){e.autox=2}},{text:"Full Auto",checked:3===e.autox,handler:function(){e.autox=3}}]}},l={text:"Settings...",menu:{title:"SETTINGS",items:[{text:"ALL Mode",checked:e.all,style:"checkbox",handler:function(){c.change_settings({all:!e.all})}},
{text:"Controls...",menu:{title:"CONTROLS OPTIONS",items:[{text:"Continuous (Disabled)",checked:-2===e.cntrls,handler:function(){c.change_settings({xcnt:-2})}},{text:"LM Click (Disabled)",checked:-1===e.cntrls,handler:function(){c.change_settings({xcnt:-1})}},{text:"Off",checked:0===e.cntrls,handler:function(){c.change_settings({xcnt:0})}},{text:"LM Click",checked:1===e.cntrls,handler:function(){c.change_settings({xcnt:1})}},{text:"Continuous",checked:2===e.cntrls,handler:function(){c.change_settings({xcnt:2})}}]}},
{text:"Mouse...",menu:{title:"MOUSE OPTIONS",items:[{text:"LM Drag (Zoom)",checked:"zoom"===e.default_rubberbox_action,handler:function(){e.default_rubberbox_action="zoom"}},{text:"LM Drag (Select)",checked:"select"===e.default_rubberbox_action,handler:function(){e.default_rubberbox_action="select"}},{text:"LM Drag (Disabled)",checked:void 0===e.default_rubberbox_action,handler:function(){e.default_rubberbox_action=void 0}},{text:"Mode...",menu:{title:"MOUSE Mode",items:[{text:"Box",checked:"box"===
e.default_rubberbox_mode,handler:function(){e.default_rubberbox_mode="box"}},{text:"Horizontal",checked:"horizontal"===e.default_rubberbox_mode,handler:function(){e.default_rubberbox_mode="horizontal"}},{text:"Vertical",checked:"vertical"===e.default_rubberbox_mode,handler:function(){e.default_rubberbox_mode="vertical"}}]}},{text:"CROSShairs...",menu:{title:"Crosshairs Mode",items:[{text:"Off",checked:!e.cross,handler:function(){e.cross=!1}},{text:"On",checked:!0===e.cross,handler:function(){e.cross=
!0}},{text:"Horizontal",checked:"horizontal"===e.cross,handler:function(){e.cross="horizontal"}},{text:"Vertical",checked:"vertical"===e.cross,handler:function(){e.cross="vertical"}}]}},{text:"Mousewheel Natural Mode",checked:e.wheelscroll_mode_natural,style:"checkbox",handler:function(){c.change_settings({wheelscroll_mode_natural:!e.wheelscroll_mode_natural})}}]}},{text:"CROSShairs",checked:e.cross,style:"checkbox",handler:function(){c.change_settings({cross:!e.cross})}},{text:"GRID",checked:e.grid,
style:"checkbox",handler:function(){c.change_settings({grid:!e.grid})}},{text:"INDEX Mode",checked:e.index,style:"checkbox",handler:function(){c.change_settings({index:!e.index})}},{text:"LEGEND",checked:e.legend,style:"checkbox",handler:function(){c.change_settings({legend:!e.legend})}},{text:"PAN Scrollbars",checked:e.pan,style:"checkbox",handler:function(){c.change_settings({pan:!e.pan})}},{text:"PHase UNITS...",menu:{title:"PHASE UNITS",items:[{text:"Radians",checked:23===e.plab,handler:function(){c.change_settings({phunits:"R"})}},
{text:"Degrees",checked:24===e.plab,handler:function(){c.change_settings({phunits:"D"})}},{text:"Cycles",checked:25===e.plab,handler:function(){c.change_settings({phunits:"C"})}}]}},{text:"SPECS",checked:e.specs,style:"checkbox",handler:function(){c.change_settings({specs:!e.specs})}},{text:"XDIVisions...",handler:function(){K(c,"X Divisions:",function(c){var e=a.intValidator(c),n=d.trunc(f.width/2);return e.valid&&c>n?{valid:!1,reason:"Exceeds maximum number of divisions ("+n+")."}:e},function(a){parseFloat(a)!==
e.xdiv&&(""===a&&(a=1),e.xdiv=parseFloat(a));c.refresh()},e.xdiv,void 0,void 0,void 0)}},{text:"XLABel...",handler:function(){K(c,"X Units:",function(c){console.log("The value is "+c);return a.intValidator(c)},function(a){parseFloat(a)!==e.xlab&&(0>a&&(a=0),e.xlab=parseFloat(a));c.refresh()},e.xlab,void 0,void 0,void 0)}},{text:"YDIVisions...",handler:function(){K(c,"Y Divisions:",function(c){var e=a.intValidator(c),n=d.trunc(f.height/2);return e.valid&&c>n?{valid:!1,reason:"Exceeds maximum number of divisions ("+
n+")."}:e},function(a){parseFloat(a)!==e.ydiv&&(""===a&&(a=1),e.ydiv=parseFloat(a));c.refresh()},e.ydiv,void 0,void 0,void 0)}},{text:"YINVersion",checked:4===f.origin,style:"checkbox",handler:function(){c.change_settings({yinv:4!==f.origin})}},{text:"YLABel...",handler:function(){K(c,"Y Units:",function(c){return a.intValidator(c)},function(a){parseFloat(a)!==e.ylab&&(0>a&&(a=0),e.ylab=parseFloat(a));c.refresh()},e.ylab,void 0,void 0,void 0)}},{text:"X-axis",checked:e.show_x_axis,style:"checkbox",
handler:function(){c.change_settings({show_x_axis:!e.show_x_axis})}},{text:"Y-axis",checked:e.show_y_axis,style:"checkbox",handler:function(){c.change_settings({show_y_axis:!e.show_y_axis})}},{text:"Readout",checked:e.show_readout,style:"checkbox",handler:function(){c.change_settings({show_readout:!e.show_readout})}},{text:"Invert Colors",checked:f.xi,style:"checkbox",handler:function(){a.invertbgfg(f)}}]}},p={text:"Colormap...",menu:{title:"COLORMAP",items:[{text:"Greyscale",checked:0===e.cmap,handler:function(){c.change_settings({cmap:0})}},
{text:"Ramp Colormap",checked:1===e.cmap,handler:function(){c.change_settings({cmap:1})}},{text:"Color Wheel",checked:2===e.cmap,handler:function(){c.change_settings({cmap:2})}},{text:"Spectrum",checked:3===e.cmap,handler:function(){c.change_settings({cmap:3})}},{text:"Sunset",checked:4===e.cmap,handler:function(){c.change_settings({cmap:4})}}]}},q=function(d){return{title:"TRACE OPTIONS",items:[{text:"Dashed...",handler:function(){var k=1;if(void 0!==d)k=Math.abs(c._Gx.lyr[d].thick);else{if(0===
e.lyr.length)return;for(var k=Math.abs(c._Gx.lyr[0].thick),f=0;f<e.lyr.length;f++)if(k!==Math.abs(c._Gx.lyr[f].thick)){k=1;break}}K(c,"Line thickness:",a.intValidator,function(a){if(void 0!==d)c._Gx.lyr[d].line=3,c._Gx.lyr[d].thick=-1*a,c._Gx.lyr[d].symbol=0;else for(var d=0;d<e.lyr.length;d++)c._Gx.lyr[d].line=3,c._Gx.lyr[d].thick=-1*a,c._Gx.lyr[d].symbol=0},k)}},{text:"Dots...",handler:function(){var k=3;if(void 0!==d)k=Math.abs(c._Gx.lyr[d].radius);else{if(0===e.lyr.length)return;for(var f=0;f<
e.lyr.length;f++)if(k!==Math.abs(c._Gx.lyr[f].radius)){k=3;break}}K(c,"Radius/Shape:",a.intValidator,function(a){var k;0>a?(k=3,a=Math.abs(a)):0<a?k=2:(k=1,a=0);if(void 0!==d)c._Gx.lyr[d].line=0,c._Gx.lyr[d].radius=a,c._Gx.lyr[d].symbol=k;else for(var f=0;f<e.lyr.length;f++)c._Gx.lyr[f].line=0,c._Gx.lyr[f].radius=a,c._Gx.lyr[f].symbol=k},k)}},{text:"Solid...",handler:function(){var k=1;if(void 0!==d)k=Math.abs(c._Gx.lyr[d].thick);else{if(0===e.lyr.length)return;for(var k=Math.abs(c._Gx.lyr[0].thick),
f=0;f<e.lyr.length;f++)if(k!==Math.abs(c._Gx.lyr[f].thick)){k=1;break}}K(c,"Line thickness:",a.intValidator,function(a){if(void 0!==d)c._Gx.lyr[d].line=3,c._Gx.lyr[d].thick=a,c._Gx.lyr[d].symbol=0;else for(var k=0;k<e.lyr.length;k++)c._Gx.lyr[k].line=3,c._Gx.lyr[k].thick=a,c._Gx.lyr[k].symbol=0},k)}},{text:"Toggle",style:void 0!==d?"checkbox":void 0,checked:void 0!==d?c._Gx.lyr[d].display:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].display=!c._Gx.lyr[d].display;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].display=
!c._Gx.lyr[a].display}},{text:"Symbols...",menu:{title:"SYMBOLS",items:[{text:"Retain Current"},{text:"None",checked:void 0!==d?0===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].radius=0,c._Gx.lyr[d].symbol=0;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=0,c._Gx.lyr[a].symbol=0}},{text:"Pixels",checked:void 0!==d?1===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].radius=1,c._Gx.lyr[d].symbol=1;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=
1,c._Gx.lyr[a].symbol=1}},{text:"Circles",checked:void 0!==d?2===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].radius=4,c._Gx.lyr[d].symbol=2;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=4,c._Gx.lyr[a].symbol=2}},{text:"Squares",checked:void 0!==d?3===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].radius=4,c._Gx.lyr[d].symbol=3;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=4,c._Gx.lyr[a].symbol=3}},{text:"Plusses",checked:void 0!==
d?4===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].radius=4,c._Gx.lyr[d].symbol=4;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=4,c._Gx.lyr[a].symbol=4}},{text:"X's",checked:void 0!==d?5===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].radius=4,c._Gx.lyr[d].symbol=5;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=4,c._Gx.lyr[a].symbol=5}},{text:"Triangles",checked:void 0!==d?6===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==
d)c._Gx.lyr[d].radius=6,c._Gx.lyr[d].symbol=6;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=6,c._Gx.lyr[a].symbol=6}},{text:"Downward Triangles",checked:void 0!==d?7===c._Gx.lyr[d].symbol:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].radius=6,c._Gx.lyr[d].symbol=7;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].radius=6,c._Gx.lyr[a].symbol=7}}]}},{text:"Line Type...",menu:{title:"LINE TYPE",items:[{text:"Retain Current"},{text:"None",checked:void 0!==d?0===c._Gx.lyr[d].line:void 0,
handler:function(){if(void 0!==d)c._Gx.lyr[d].line=0;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].line=0}},{text:"Verticals",checked:void 0!==d?1===c._Gx.lyr[d].line:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].line=1;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].line=1}},{text:"Horizontals",checked:void 0!==d?2===c._Gx.lyr[d].line:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].line=2;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].line=2}},{text:"Connecting",checked:void 0!==
d?3===c._Gx.lyr[d].line:void 0,handler:function(){if(void 0!==d)c._Gx.lyr[d].line=3;else for(var a=0;a<e.lyr.length;a++)c._Gx.lyr[a].line=3}}]}},{text:"Thickness...",handler:function(){var k=1;void 0!==d&&(k=c._Gx.lyr[d].thick);K(c,"Thickness",a.intValidator,function(a){""===a&&(a=1);a=Math.max(0,a);if(void 0!==d)c._Gx.lyr[d].thick=a;else for(var k=0;k<e.lyr.length;k++)c._Gx.lyr[k].thick=a},k,void 0,void 0,void 0)}},{text:"Opacity...",handler:function(){var k=1;void 0!==d&&(k=c._Gx.lyr[d].opacity);
K(c,"Opacity:",a.floatValidator,function(a){""===a&&(a=1);a=Math.max(0,a);a=Math.min(1,a);if(void 0!==d)c._Gx.lyr[d].opacity=a;else for(var k=0;k<e.lyr.length;k++)c._Gx.lyr[k].opacity=a},k,void 0,void 0,void 0)}}]}},u={text:"Plugins...",menu:{title:"PLUGINS",items:function(){for(var a=[],c=0;c<e.plugins.length;c++){var d=e.plugins[c];d.impl.menu&&("function"===typeof d.impl.menu?a.push(d.impl.menu()):a.push(d.impl.menu))}return a}()}};a.menu(f,{title:"SIG-PLOT",finalize:function(){f.prompt||a.addEventListener(f,
"mousedown",c.onmousedown,!1);c.refresh()},items:[{text:"Refresh"},k,g,h,{text:"Grid",handler:function(){c.change_settings({grid:!e.grid})}},l,p,{text:"Traces...",menu:function(){var a=c._Gx,d={title:"TRACE",items:[]};d.items.push({text:"All",menu:q()});for(var e=0;e<a.lyr.length;e++)d.items.push({text:a.lyr[e].name,menu:q(e)});return d}},{text:"Files...",menu:{title:"FILES OPTIONS",items:[{text:"Deoverlay File...",menu:function(){var a=c._Gx,d={title:"DEOVERLAY",items:[]};d.items.push({text:"Deoverlay All",
handler:function(){c.deoverlay()}});for(var e=0;e<a.lyr.length;e++){var n=function(a){return function(){c.deoverlay(a)}}(e);d.items.push({text:a.lyr[e].name,handler:n})}return d}}]}},u,{text:"Keypress Info",handler:function(){a.message(f,G)}},{text:"Exit",handler:function(){var c=document.createEvent("Event");c.initEvent("sigplotexit",!0,!0);a.dispatchEvent(f,c)}}]})}function f(c){return function(e,f,k,g,h,l){var p,q=c._Gx,u=c._Mx,t=Math.min(f,g);p=Math.min(k,h);var w=Math.abs(g-f),x=Math.abs(h-k);
void 0===l||"zoom"===l?1===e.which&&(2>w&&2>x?(t=!1,p=c._Mx,w=p.xpos,x=p.ypos,f=p.text_h,k=p.text_w,g=" ",w<p.l-k&&x<=p.b&&x>=p.t?(g="YCENTER",t=!0):x>p.b+d.trunc(0.5*k)&&x<=p.b+d.trunc(d.trunc(3*f)/2)&&w>=p.l&&w<=p.r&&(g="XCENTER",t=!0),p=g,t?" "!==p&&E(c,p,0,e):1===q.cntrls&&(e=document.createEvent("Event"),e.initEvent("mtag",!0,!0),e.x=q.xmrk,e.y=q.ymrk,e.w=void 0,e.h=void 0,a.dispatchEvent(u,e))):(c.pixel_zoom(f,k,g,h),c.refresh())):"select"===l&&(e=document.createEvent("Event"),e.initEvent("mtag",
!0,!0),q=O(c,t,p),t=O(c,t+w,p+x),e.x=q.x,e.y=q.y,e.w=Math.abs(t.x-q.x),e.h=Math.abs(t.y-q.y),a.dispatchEvent(u,e))}}function g(c,e){var f=c._Mx,k=c._Gx;k.xmin=void 0===e.xmin?0:e.xmin;k.xmax=void 0===e.xmax?0:e.xmax;var g=void 0!==e.xmin,l=void 0!==e.xmax,p=void 0===e.cmode?"":e.cmode.toUpperCase();k.ylab=e.ylab;k.ymin=void 0===e.ymin?0:e.ymin;k.ymax=void 0===e.ymax?0:e.ymax;var q=void 0!==e.ymin,t=void 0!==e.ymax;void 0!==e.colors&&a.setbgfg(f,e.colors.bg,e.colors.fg,f.xi);void 0!==e.xi&&a.invertbgfg(f);
k.forcelab=void 0===e.forcelab?!0:e.forcelab;k.all=void 0===e.all?!1:e.all;k.expand=void 0===e.expand?!1:e.expand;k.xlab=e.xlab;k.segment=void 0===e.segment?!1:e.segment;k.plab=24;var u=void 0===e.phunits?"D":e.phunits;"R"===u[0]?k.plab=23:"C"===u[0]&&(k.plab=25);k.xdiv=void 0===e.xdiv?5:e.xdiv;k.ydiv=void 0===e.ydiv?5:e.ydiv;f.origin=1;e.yinv&&(f.origin=4);k.pmt=void 0===e.pmt?1:e.pmt;k.bufmax=void 0===e.bufmax?32768:e.bufmax;k.sections=void 0===e.nsec?0:e.nsec;k.anno_type=void 0===e.anno_type?0:
e.anno_type;k.xfmt=void 0===e.xfmt?"":e.xfmt;k.yfmt=void 0===e.yfmt?"":e.yfmt;k.index=void 0===e.index?!1:e.index;if(u=k.index||"IN"===p.slice(0,2))g&&1===k.xmin&&(g=!1),l&&1===k.xmin&&(l=!1);k.yptr=void 0;k.xptr=void 0;k.pointbufsize=0;k.xdata=!1;k.note="";k.hold=0;d.vstype("D");e.inputs||h(c,!1);var w=p.slice(0,2);if("IN"===w||"AB"===w||"__"===w)w=p.slice(2,4);k.cmode=0<k.lyr.length&&k.lyr[0].cx?1:3;"MA"===w&&(k.cmode=1);"PH"===w&&(k.cmode=2);"RE"===w&&(k.cmode=3);"IM"===w&&(k.cmode=4);if("LO"===
w||"D1"===w)k.cmode=6;if("L2"===w||"D2"===w)k.cmode=7;if("RI"===w||"IR"===w)k.index?alert("Imag/Real mode not permitted in INDEX mode"):k.cmode=5;k.basemode=k.cmode;c.change_settings({cmode:k.cmode});k.dbmin=1E-20;6<=k.cmode&&(p=10,7===k.cmode&&(p=20),"L"===w[0]?0<k.lyr.length&&k.lyr[0].cx?(k.ymin=Math.max(k.ymin,1E-10),k.ymax=Math.max(k.ymax,1E-10)):(k.ymin=Math.max(k.ymin,1E-20),k.ymax=Math.max(k.ymax,1E-20)):0<k.lyr.length&&k.lyr[0].cx?(k.ymin=Math.max(-18*p,k.ymin),k.ymax=Math.max(-18*p,k.ymax),
k.dbmin=1E-37):Math.min(k.ymin,k.ymax)<-20*p&&(k.ymin=Math.max(-37*p,k.ymin),k.ymax=Math.max(-37*p,k.ymax),k.dbmin=Math.pow(10,Math.min(k.ymin,k.ymax)/p)));f.level=0;u&&!k.index&&(g&&(k.xmin=k.xstart+k.xdelta*(k.xmin-1)),g&&(k.xmax=k.xstart+k.xdelta*(k.xmax-1)));k.autox=void 0===e.autox?-1:e.autox;0>k.autox&&(k.autox=0,g||(k.autox+=1),l||(k.autox+=2));k.autoy=void 0===e.autoy?-1:e.autoy;0>k.autoy&&(k.autoy=0,q||(k.autoy+=1),t||(k.autoy+=2));k.autol=void 0===e.autol?-1:e.autol;g||(k.xmin=void 0);l||
(k.xmax=void 0);T(c,{get_data:!0},k.xmin,k.xmax,k.xlab,k.ylab);g||(k.xmin=f.stk[0].xmin);l||(k.xmax=f.stk[0].xmax);q||(k.ymin=f.stk[0].ymin);t||(k.ymax=f.stk[0].ymax);k.xmin>k.xmax&&(f.stk[0].xmin=k.xmax,k.xmax=k.xmin,k.xmin=f.stk[0].xmin);k.ymin>k.ymax&&(f.stk[0].ymin=k.ymax,k.ymax=k.ymin,k.ymin=f.stk[0].ymin);f.stk[0].xmin=k.xmin;f.stk[0].xmax=k.xmax;f.stk[0].ymin=k.ymin;f.stk[0].ymax=k.ymax;k.panxmin=Math.min(k.panxmin,k.xmin);k.panxmax=Math.max(k.panxmax,k.xmax);k.panymin=Math.min(k.panymin,k.ymin);
k.panymax=Math.max(k.panymax,k.ymax);k.xmin=f.stk[0].xmin;k.ymin=f.stk[0].ymin;a.set_font(f,Math.min(7,f.width/64));k.ncolors=void 0===e.ncolors?16:e.ncolors;k.cmap=void 0===e.xc?-1:e.xc;0>k.ncolors&&(k.ncolors*=-1,k.cmap=Math.max(1,k.cmap));if(1>k.cmap||5<k.cmap)k.cmap=2===k.cmode?2:1;a.colormap(f,d.Mc.colormap[k.cmap],k.ncolors);k.cntrls="leftmouse"===e.xcnt?1:"continuous"===e.xcnt?2:void 0===e.xcnt?1:e.xcnt;k.default_rubberbox_mode=void 0===e.rubberbox_mode?"box":e.rubberbox_mode;k.default_rubberbox_action=
void 0===e.rubberbox_action?"zoom":e.rubberbox_action;k.cross=void 0===e.cross?!1:e.cross;k.grid=void 0===e.nogrid?!0:!e.nogrid;k.gridBackground=e.gridBackground;k.gridStyle=e.gridStyle;k.wheelZoom=e.wheelZoom;k.wheelZoomPercent=e.wheelZoomPercent;k.legend=void 0===e.legend?!1:e.legend;k.legendBtnLocation={x:0,y:0,width:0,height:0};k.pan=void 0===e.nopan?!0:!e.nopan;k.nomenu=void 0===e.nomenu?!1:e.nomenu;k.modmode=0;k.modlayer=-1;k.modsource=0;k.modified=e.mod&&0<k.lyr.length;k.nmark=0;k.iabsc=0;
k.index&&(k.iabsc=1);k.specs=!e.nospecs;k.scroll_time_interval=void 0===e.scroll_time_interval?k.scroll_time_interval:e.scroll_time_interval;k.autohide_readout=e.autohide_readout;k.autohide_panbars=e.autohide_panbars;k.specs?(k.show_x_axis=!e.noxaxis,k.show_y_axis=!e.noyaxis,k.show_readout=!e.noreadout,k.specs=k.show_x_axis||k.show_y_axis||k.show_readout?!0:!1):(k.show_x_axis=!1,k.show_y_axis=!1,k.show_readout=!1);k.hide_note=e.hide_note||!1;k.xmrk=0;k.ymrk=0;e.nodragdrop||(a.addEventListener(f,"dragover",
function(a){a.preventDefault()},!1),a.addEventListener(f,"drop",function(a){return function(c){var d=c.dataTransfer.files;0<d.length&&(c.preventDefault(),a.load_files(d))}}(c),!1))}function h(a,c){var d=a._Gx,e=a._Mx;if(c){var f=d.HCB[0];d.xstart=f.xstart;d.xdelta=f.xdelta}else d.xstart=0,d.xdelta=1,d.autol=-1,d.zmin=void 0,d.zmax=void 0;e.origin=1}function p(c,e){var f=c._Mx,k=c._Gx;if(0<e&&(4<=e&&k.show_readout&&!k.hide_note&&a.text(f,f.width-k.lbtn-(k.note.length+1)*f.text_w,f.text_h,k.note),4<=
e&&F(c),1<=e&&k.legend)){for(var f=c._Mx,k=c._Gx,g=f.canvas.getContext("2d"),h=0,l=0,p=0,q=0,t=0,u=0,w=0,x=h=0,y=0,q=f.text_w,w=23*q,h=(k.lyr.length+1)*f.text_h,t=f.r-w,u=f.t,l=t+2,p=u+2,x=w-5,y=h-5,z=0,h=w=0;h<k.lyr.length;h++){var A=g.measureText(k.lyr[h].name).width;A>z&&(z=A)}98<z&&(w=z-98,x+=w,l-=w);g.strokeStyle=f.fg;g.fillStyle=f.bg;g.fillRect(l,p,x,y);g.strokeRect(l,p,x,y);for(h=0;h<k.lyr.length;h++)l=t+4*q,p=u+h*f.text_h+f.text_h,h===k.modlayer&&a.text(f,t+q-w,p+Math.floor(f.text_w/2),"**"),
k.lyr[h].display&&(y=k.lyr[h].color,0<k.lyr[h].line&&(x=d.sign(Math.min(q,Math.abs(k.lyr[h].thick)),k.lyr[h].thick),0>x||x===a.L_dashed?a.draw_line(f,y,l-w,p-3,l+2*q-w,p-3,Math.abs(x),{mode:"dashed",on:4,off:4}):a.draw_line(f,y,l-w,p-3,l+2*q-w,p-3,Math.abs(x))),0<k.lyr[h].symbol&&(x=0>k.lyr[h].radius?-d.trunc(0.6*q):Math.min(k.lyr[h].radius,d.trunc(0.6*q)),a.draw_symbol(f,y,l+q-w,p-3,k.lyr[h].symbol,x))),l+=3*q,p+=0.3*f.text_h,a.text(f,l-w,p,k.lyr[h].name)}}function B(a){var c=a._Gx;a=a._Mx.canvas.getContext("2d");
for(var d,e=0;e<c.plugins.length;)c.plugins[e].impl.refresh&&(d=c.plugins[e].canvas,d.getContext("2d").clearRect(0,0,d.width,d.height),c.plugins[e].impl.refresh(d),a.drawImage(d,0,0)),e+=1}function u(a){a=a._Gx;if(0===a.HCB.length)a.note="";else if(void 0===a.HCB[0].plotnote){for(var c=[],d=0;d<a.HCB.length;d++)a.HCB[d].file_name&&c.push(a.HCB[d].file_name);a.note=c.join("|").toUpperCase()}}function w(a,c){var d=a._Gx;c>=d.lyr.length||!d.lyr[c].display||0!==d.hold||d.lyr[c].draw()}function C(c){var d=
c._Gx;c=c._Mx;d.cross&&(("vertical"===d.cross||!0===d.cross)&&c.xpos>=c.l&&c.xpos<=c.r&&d.cross_xpos!==c.xpos&&(void 0!==d.cross_xpos&&a.rubberline(c,d.cross_xpos,c.t,d.cross_xpos,c.b),a.rubberline(c,c.xpos,c.t,c.xpos,c.b),d.cross_xpos=c.xpos),("horizontal"===d.cross||!0===d.cross)&&c.ypos>=c.t&&c.ypos<=c.b&&d.cross_ypos!==c.ypos&&(void 0!==d.cross_ypos&&a.rubberline(c,c.l,d.cross_ypos,c.r,d.cross_ypos),a.rubberline(c,c.l,c.ypos,c.r,c.ypos),d.cross_ypos=c.ypos))}function y(a,c){var d=a._Mx,e=a._Gx;
e.xdata=!1;for(var f=0;f<e.lyr.length;f++)e.lyr[f].xdata=5===c?!0:!1,e.lyr[f].xdata&&(e.xdata=!0);if(c!==e.cmode)if(5===c&&e.index)alert("Imag/Real mode not permitted in INDEX mode");else if(0>=e.lyr.length)e.cmode=c,U(a);else if(0<c){f=e.cmode;e.cmode=c;var g=e.autox,h=e.autoy;e.autox=3;e.autoy=3;if(5===c||5===f)e.panxmin=1,e.panxmax=-1,e.panymin=1,e.panymax=-1,d.level=0,c===e.basemode?(d.stk[0].xmin=e.xmin,d.stk[0].xmax=e.xmax,d.stk[0].ymin=e.ymin,d.stk[0].ymax=e.ymax):5===c||5===e.basemode?T(a,
{get_data:!0}):(d.stk[0].xmin=e.xmin,d.stk[0].xmax=e.xmax,T(a,{get_data:!0},e.xmin,e.xmax));else for(c===e.basemode?(e.panymin=1,e.panymax=-1,d.stk[0].ymin=e.ymin,d.stk[0].ymax=e.ymax):T(a,{},d.stk[d.level].xmin,d.stk[d.level].xmax),f=1;f<=d.level;f++)d.stk[f].ymin=d.stk[0].ymin,d.stk[f].ymax=d.stk[0].ymax;e.autox=g;e.autoy=h;a.refresh()}}function F(c){var d,e=c._Mx,k=c._Gx;if(k.pan&&!e.widget){d=e.level;var f={ps:e.stk[d].ymin,pe:e.stk[d].ymax},g=f.ps!==k.panymin||f.pe!==k.panymax,g=g&&0<e.level;
!k.autohide_panbars||g&&c.mouseOnCanvas||k.panning?(a.scrollbar(e,0,k.pyl,k.pyl+k.pthk,e.t,e.b,f,k.panymin,k.panymax,void 0,e.scrollbar_y),e.stk[d].ymin=f.ps,e.stk[d].ymax=f.pe):(f=e.canvas.getContext("2d"),f.fillStyle=e.bg,f.fillRect(k.pyl,e.t,k.pyl+k.pthk,e.b-e.t));k.pl<e.width&&(f={ps:e.stk[d].xmin,pe:e.stk[d].xmax},g=(g=f.ps!==k.panxmin||f.pe!==k.panxmax)&&(!k.all||0<e.level),!k.autohide_panbars||g&&c.mouseOnCanvas||k.panning?(a.scrollbar(e,0,k.pl,k.pr,k.pt,k.pt+k.pthk,f,k.panxmin,k.panxmax,void 0,
e.scrollbar_x),e.stk[d].xmin=f.ps,e.stk[d].xmax=f.pe):(f=e.canvas.getContext("2d"),f.fillStyle=e.bg,f.fillRect(k.pl,k.pt-1,k.pr-k.pl,k.pthk+4)))}}function E(c,d,e,k){var f=c._Mx,g=c._Gx,h,l,p,q;q=new a.SCROLLBAR;l=new a.SCROLLBAR;var t=!1;h=f.level;0<g.panmode?(q.flag=11,l.flag=11):(q.flag=-12,l.flag=-12);0===e&&(q.action=0,l.action=0);if("Y"===d.substring(0,1)){if(q=f.stk[h].ymin,e=f.stk[h].ymax,p=e-q,"YPAN"===d?(d=f.scrollbar_y,e={ps:q,pe:e},a.scrollbar(f,l,g.pyl,g.pyl+g.pthk,f.t,f.b,e,g.panymin,
g.panymax,k,d),q=e.ps,e=e.pe,0!==l.action&&a.scroll(f,l,a.XW_UPDATE,void 0,d)):"YCENTER"===d&&(q-=p*(f.ypos-(f.t+f.b)/2)/(f.b-f.t),e=q+p),q!==f.stk[h].ymin||e!==f.stk[h].ymax)f.stk[h].ymin=q,f.stk[h].ymax=e,g.cmode===g.basemode&&1===f.level&&(g.ymin=Math.min(g.ymin,q),g.ymax=Math.max(g.ymax,e)),c.refresh(),t=!0}else if(l=f.stk[h].xmin,e=f.stk[h].xmax,p=e-l,"XPAN"===d?(d=f.scrollbar_x,e={ps:l,pe:e},a.scrollbar(f,q,g.pl,g.pr,g.pt,g.pt+g.pthk,e,g.panxmin,g.panxmax,k,d),l=e.ps,e=e.pe,0!==q.action&&a.scroll(f,
q,a.XW_UPDATE,void 0,d)):"XCENTER"===d&&(l+=p*(f.xpos-(f.l+f.r)/2)/(f.r-f.l),l!==f.stk[h].xmin&&(e=l+p)),f.stk[h].xmin!==l||f.stk[h].xmax!==e)f.stk[h].xmin=l,f.stk[h].xmax=e,g.xdata||1!==f.level||(g.xmin=f.stk[1].xmin,g.xmax=f.stk[1].xmax),c.refresh(),t=!0;return t}function K(c,d,e,f,g,h,l,p){var q=c._Mx;if(q.prompt)throw"Prompt already exists! Can only have one prompt at a time!";a.disableListeners(q);c.disable_listeners();var t=function(c,d){return function(e){d(e);a.enableListeners(q);c.enable_listeners();
c.refresh();void 0!==p&&p()}},u=function(){c.refresh()};try{a.prompt(q,d,e,t(c,f),u,g,h,l,5E3)}catch(w){console.log("ERROR: Failed to set up prompt due to: "+w)}}function U(c){var d=c._Mx,e=c._Gx,f=d.canvas.getContext("2d");0===e.sections&&(e.isec=0);e.aretx=e.retx;e.arety=e.rety;e.dretx=e.retx-e.xmrk;e.drety=e.rety-e.ymrk;5===e.cmode&&1===e.iabsc&&(e.iabsc=2);1===e.iabsc?(e.aretx=Math.round((e.aretx-e.xstart)/e.xdelta),e.index||(e.aretx+=1),e.dretx=Math.round(e.dretx/e.xdelta)):2===e.iabsc&&(0!==
e.aretx&&(e.aretx=1/e.aretx),0!==e.arety&&(e.arety=1/e.arety),0!==e.dretx&&(e.dretx=1/e.dretx),0!==e.drety&&(e.drety=1/e.drety));if(e.show_readout&&!d.widget){f.fillStyle=d.bg;var g=Math.floor(d.height-2.5*d.text_h);f.fillRect(d.text_w,g,49*d.text_w,g+1.5*d.text_h);var g=Math.floor(d.height-0.5*d.text_h),h=Math.max(e.pr+d.text_w,d.width-2*d.text_w);f.fillStyle=d.bg;f.fillRect(h,g-d.text_h,d.text_w,d.text_h);if(!e.autohide_readout||c.mouseOnCanvas||e.panning)c="y: "+a.format_g(e.arety,16,9,!0)+" dy: "+
a.format_g(e.drety,16,9)+" L="+d.level+" "+z[e.cmode-1],f="x: "+a.format_g(e.aretx,16,9,!0)+" dx: "+a.format_g(e.dretx,16,9)+" "+S[e.iabsc],3===e.iabsc&&(c=0===e.dretx?c.substr(0,20)+"sl: Inf             "+c.substr(40,c.length):c.substr(0,20)+"sl: "+a.format_g(e.drety/e.dretx,16,9)+c.substr(40,c.length)),g=Math.floor(d.height-1.5*d.text_h),a.text(d,d.text_w,g,c),g=Math.floor(d.height-0.5*d.text_h),a.text(d,d.text_w,g,f),h<d.width&&(0<e.cntrls?a.text(d,h,g,"C"):a.text(d,h,g," ")),a.colorbar(d,49*d.text_w-
1,d.height-2.5*d.text_h,d.text_w,2*d.text_h)}}function T(a,c,d,e,f,g){var h=a._Mx;a=a._Gx;c=!0===c.get_data;a.panxmin=1;a.panxmax=-1;a.panymin=1;a.panymax=-1;var l=void 0===d,p=void 0===e;if(0===a.lyr.length)a.panxmin=-1,a.panxmax=1,a.panymin=-1,a.panymax=1;else for(void 0===f&&(a.xlab=a.lyr[0].xlab),void 0===g&&(a.ylab=a.lyr[0].ylab),f=0;f<a.lyr.length;f++)if(l&&(d=a.lyr[f].xmin),p&&(e=a.lyr[f].xmax),a.xlab!==a.lyr[f].xlab&&(a.xlab=0),a.ylab!==a.lyr[f].ylab&&(a.ylab=0),c&&a.lyr[f].get_data(d,e),
0<a.autox||0<a.autoy)for(;d<e;)a.lyr[f].get_data(d,e),g=a.lyr[f].prep(d,e),a.all&&a.expand?0===a.lyr[f].size?d=e:a.index?d+=g:0<=a.lyr[f].xdelta?d+=a.lyr[f].size*a.lyr[f].xdelta:e+=a.lyr[f].size*a.lyr[f].xdelta:d=e;else a.lyr[f].prep(1,-1);f=a.panxmax-a.panxmin;0>f&&(a.panxmax=a.panxmin,a.panxmin=a.panxmax+f,f=-f);1E-20>=f&&(a.panxmin-=1,a.panxmax+=1);0!==(a.autox&1)&&l&&(h.stk[0].xmin=a.panxmin);if(0!==(a.autox&2)&&p&&(h.stk[0].xmax=a.panxmax,!a.all&&!a.xdata))for(f=0;f<a.lyr.length;f++)e=Math.min(a.lyr[f].xmax,
h.stk[0].xmax),g=Math.abs((e-a.lyr[f].xmin)/a.lyr[f].xdelta)-a.bufmax+1,0<g&&(h.stk[0].xmax=e-g*Math.abs(a.lyr[f].xdelta));0!==(a.autoy&1)&&(h.stk[0].ymin=a.panymin);0!==(a.autoy&2)&&(h.stk[0].ymax=a.panymax)}function O(c,d,e){var f=c._Gx;c=a.pixel_to_real(c._Mx,d,e);f.index&&(c.x*=f.xdelta);return c}function J(a,c,d,e,f,g){return a>=d&&a<=d+f&&c>=e&&c<=e+g}function X(a){var c=!1,e=a._Gx,f=a._Mx,g=f.xpos,h=f.ypos,l=" ";if(!a.mouseOnCanvas)return!1;e.pan&&g>f.r&&h>=f.t&&h<=f.b?(l="YPAN",f.xpos=e.pyl+
d.trunc(e.pthk/2),c=!0):e.pan&&g>=e.pl&&g<=e.pr&&(e.show_readout&&h>e.pt-2||!e.show_readout&&h<=e.pt+e.pthk+2)&&(l="XPAN",f.ypos=e.pt+d.trunc(e.pthk/2),c=!0);return{inPanRegion:c,command:l}}function c(c,d){var e,f,g;d.origin&1?(g=c.x-d.x,d.origin&2&&(g=d.w-g)):(g=c.y-d.y,2>=d.origin&&(g=d.h-g));f=a.scroll_real2pix(d);e=f.s1;f=f.sw;return g>=e&&g<=e+f?!0:!1}function t(c,d,e){var f=c._Mx,g;"XPAN"===e?g=f.scrollbar_x:"YPAN"===e&&(g=f.scrollbar_y);g.action=d;g.step=0.1*g.srange;g.page=9*g.step;g.scale=
2;a.scroll(f,g,a.XW_COMMAND,void 0,g);A(c,g.smin,g.smin+g.srange,e.slice(0,1))}function A(a,c,d,e){var f=a._Mx,g=a._Gx,h=f.level;if("X"===e){if(f.stk[h].xmin!==c||f.stk[h].xmax!==d)f.stk[h].xmin=c,f.stk[h].xmax=d,g.xdata||1!==f.level||(g.xmin=f.stk[1].xmin,g.xmax=f.stk[1].xmax),a.refresh()}else"Y"!==e||c===f.stk[h].ymin&&d===f.stk[h].ymax||(f.stk[h].ymin=c,f.stk[h].ymax=d,g.cmode===g.basemode&&1===f.level&&(g.ymin=Math.min(g.ymin,c),g.ymax=Math.max(g.ymax,d)),a.refresh())}var G="Keypress Table:\n--------------\n?    - Main help box.\nA    - Toggle display x,y readouts:\n       (absc) -> (index) -> (1/absc) -> (time).\nB    - Toggle LM Drag Mode:\n       (box) -> (horizontal) -> (vertical).\nC    - Toggle controls.\nL    - Toggle legend.\nM    - Pops up main menu\nR    - Toggle display specs (x/y readout)\nS    - Toggle display specs and axes.\nT    - Popup box with timecode value at mouse.\nX    - Popup box with X value at mouse.\nY    - Popup box with Y value at mouse.\nF    - Toggle fullscreen.\n";
e.browserIsCompatible=function(){var a=document.createElement("canvas").getContext?!0:!1,c="ArrayBuffer"in window;return a&&c};navigator.userAgent.match(/(iPad|iPhone|iPod)/i)||"undefined"===typeof Float64Array||Float64Array.emulated||!Float64Array.BYTES_PER_ELEMENT?e.PointArray=Float32Array:e.PointArray=Float64Array;e.Plot=function(r,n){if(!e.browserIsCompatible())throw"Browser is not compatible";var h=this._Mx=a.open(r);this._Gx=new x;this._Gx.parent=r;this.mouseOnCanvas=!1;n||(n={});g(this,n);
this._refresh();this.onmousemove=function(c){return function(d){var e=c._Mx,f=c._Gx,g=d.target.getBoundingClientRect(),n=void 0===d.offsetX?d.pageX-g.left-window.scrollX:d.offsetX;d=void 0===d.offsetX?d.pageY-g.top-window.scrollY:d.offsetY;g=O(c,n,d);f.retx=g.x;f.rety=g.y;e.widget||(U(c),g=document.createEvent("Event"),g.initEvent("mmove",!0,!0),g.xpos=n,g.ypos=d,g.x=f.retx,g.y=f.rety,a.dispatchEvent(e,g)&&(f.cross&&(e.warpbox?(void 0!==f.cross_xpos&&a.rubberline(e,f.cross_xpos,e.t,f.cross_xpos,e.b),
void 0!==f.cross_ypos&&a.rubberline(e,e.l,f.cross_ypos,e.r,f.cross_ypos),f.cross_xpos=void 0,f.cross_ypos=void 0):C(c)),2===f.cntrls&&(g=document.createEvent("Event"),g.initEvent("mtag",!0,!0),g.x=f.retx,g.y=f.rety,a.dispatchEvent(e,g))))}}(this);this.ontouchmove=function(a){return function(c){c.preventDefault();a.onmousemove(c)}}(this);this.throttledOnMouseMove=d.throttle(this._Gx.scroll_time_interval,this.onmousemove);a.addEventListener(h,"mousemove",this.throttledOnMouseMove,!1);this.onmouseout=
function(a){return function(c){c=a._Gx;var d=a._Mx;a.mouseOnCanvas&&(a.mouseOnCanvas=!1,c.autohide_readout&&U(a),c.autohide_panbars&&F(a),d.prompt&&d.prompt.input.enableBlur())}}(this);a.addEventListener(h,"mouseout",this.onmouseout,!1);this.onmouseover=function(a){return function(c){c=a._Gx;var d=a._Mx;a.mouseOnCanvas=!0;c.autohide_panbars&&F(a);d.prompt&&d.prompt.input.disableBlur()}}(this);a.addEventListener(h,"mouseover",this.onmouseover,!1);this.onmousedown=function(d){return function(e){e.preventDefault();
var g=d._Mx,n=d._Gx;g.widget&&"ONESHOT"===g.widget.type&&(g.widget=null,d.refresh());a.ifevent(g,e);var r=document.createEvent("Event");r.initEvent("mdown",!0,!0);r.xpos=g.xpos;r.ypos=g.ypos;r.x=n.retx;r.y=n.rety;r.which=e.which;if(!a.dispatchEvent(g,r))return!1;var h=X(d);if(h.inPanRegion){if(e.preventDefault()," "!==h.command){var p=null,r=null;"XPAN"===h.command?p=g.scrollbar_x:"YPAN"===h.command&&(p=g.scrollbar_y);if(2===e.which)r={x:g.xpos,y:g.ypos},void 0!==p&&c(r,p)&&q(d,h.command);else if(" "!==
h.command&&(r={x:g.xpos,y:g.ypos},!c(r,p)&&1===e.which)){E(d,h.command,0,e);var s=function(){c({x:g.xpos,y:g.ypos},p)?n.stillPanning&&(window.clearInterval(n.stillPanning),n.repeatPanning=void 0):E(d,h.command,0,e)};n.stillPanning=window.setTimeout(function(){n.repeatPanning=window.setInterval(s,50)},250)}}}else if(1===e.which)if(J(g.xpos,g.ypos,n.legendBtnLocation.x,n.legendBtnLocation.y,n.legendBtnLocation.width,n.legendBtnLocation.height))d.change_settings({legend:!n.legend});else{n.xmrk=n.retx;
n.ymrk=n.rety;U(d);var r={opacity:0,return_value:"zoom"},t={opacity:0.4,fill_color:g.hi,return_value:"select"};"zoom"===n.default_rubberbox_action?a.rubberbox(g,f(d),n.default_rubberbox_mode,r,t):"select"===n.default_rubberbox_action&&a.rubberbox(g,f(d),n.default_rubberbox_mode,t,r)}else 2===e.which&&(n.nomenu||l(d));return!1}}(this);this.ontouchstart=function(a){return function(c){c.preventDefault();a.onmousedown({which:1})}}(this);a.addEventListener(h,"mousedown",this.onmousedown,!1);this.docMouseUp=
function(a){return function(c){var d=a._Gx;1===c.which&&(d.panning=void 0,a._Mx.scrollbar_x.action=0,a._Mx.scrollbar_y.action=0);d.stillPanning&&(window.clearTimeout(d.stillPanning),d.stillPanning=void 0);d.repeatPanning&&(window.clearInterval(d.repeatPanning),d.repeatPanning=void 0);return!1}}(this);document.addEventListener("mouseup",this.docMouseUp,!1);this.mouseup=function(c){return function(d){d.preventDefault();var e=c._Gx,f=c._Mx;a.ifevent(c._Mx,d);var g=document.createEvent("Event");g.initEvent("mup",
!0,!0);g.xpos=f.xpos;g.ypos=f.ypos;g.x=e.retx;g.y=e.rety;g.which=d.which;if(a.dispatchEvent(f,g))if(3===d.which)d.preventDefault(),c.unzoom(1),c.refresh();else if(2===d.which&&e.nomenu&&(g=document.createEvent("Event"),g.initEvent("showmenu",!0,!0),g.x=d.x||d.clientX,g.y=d.y||d.clientY,a.dispatchEvent(f,g))){d.stopPropagation&&d.stopPropagation();d.cancelBubble=!0;a.removeEventListener(f,"mousedown",c.onmousedown,!1);var n=function(){try{var d=document.createEvent("Event");d.initEvent("hidemenu",
!0,!0);a.dispatchEvent(f,d)&&a.addEventListener(f,"mousedown",c.onmousedown,!1)}finally{document.removeEventListener("mouseup",n,!1)}};document.addEventListener("mouseup",n,!1)}}}(this);this.ontouchend=function(a){return function(a){a.preventDefault()}}(this);a.addEventListener(h,"mouseup",this.mouseup,!1);this.mouseclick=function(c){return function(d){d.preventDefault();var e=c._Gx,f=c._Mx;a.ifevent(c._Mx,d);var g=document.createEvent("Event");g.initEvent("mclick",!0,!0);g.xpos=f.xpos;g.ypos=f.ypos;
g.x=e.retx;g.y=e.rety;g.which=d.which;a.dispatchEvent(f,g);return!1}}(this);a.addEventListener(h,"click",this.mouseclick,!1);this.mousedblclick=function(c){return function(d){d.preventDefault();var e=c._Gx,f=c._Mx;a.ifevent(c._Mx,d);var g=document.createEvent("Event");g.initEvent("mdblclick",!0,!0);g.xpos=f.xpos;g.ypos=f.ypos;g.x=e.retx;g.y=e.rety;g.which=d.which;a.dispatchEvent(f,g);return!1}}(this);a.addEventListener(h,"dblclick",this.mousedblclick,!1);this.dragMouseDownHandler=function(a){return function(d){var e=
a._Mx,f=a._Gx,g=X(a);if(g.inPanRegion&&(d.preventDefault()," "!==g.command)){var n;"XPAN"===g.command?n=e.scrollbar_x:"YPAN"===g.command&&(n=e.scrollbar_y);var r={x:e.xpos,y:e.ypos};void 0!==n&&c(r,n)&&1===d.which&&(f.panning={axis:g.command,xpos:d.screenX,ypos:d.screenY,xmin:e.stk[e.level].xmin,xmax:e.stk[e.level].xmax,ymin:e.stk[e.level].ymin,ymax:e.stk[e.level].ymax})}}}(this);window.addEventListener("mousedown",this.dragMouseDownHandler,!1);this.dragMouseMoveHandler=function(c){return function(d){var e=
c._Gx;if(void 0!==e.panning)try{var f=e.panning.axis,g=c._Mx,n=c._Gx,r,h,l;if("XPAN"===f)l=c._Mx.scrollbar_x;else if("YPAN"===f)l=c._Mx.scrollbar_y;else throw"Unable to drag scrollbar - scrollAction is not 'XPAN' or 'YPAN'!!";l.flag=-12;var p=g.level;"XPAN"===f?(r=g.stk[p].xmin,h=g.stk[p].xmax):"YPAN"===f?(r=g.stk[p].ymin,h=g.stk[p].ymax):h=r=void 0;var e=r,p=h,s=l;s.action=a.SB_DRAG;if("YPAN"===f){var q=g.scrollbar_y.trange/g.scrollbar_y.h;4===s.origin&&(q*=-1);var t=d.screenY-n.panning.ypos,u=t*
q;n.panning.ymin-u<n.panymin?(p=n.panymin+(p-e),e=n.panymin):n.panning.ymax-u>n.panymax?(e=n.panymax-(p-e),p=n.panymax):(e=n.panning.ymin-u,p=n.panning.ymax-u)}else"XPAN"===f&&(q=g.scrollbar_x.trange/g.scrollbar_x.w,3===s.origin&&(q*=-1),t=d.screenX-n.panning.xpos,u=t*q,n.panning.xmin+u<n.panxmin?(p=n.panxmin+(p-e),e=n.panxmin):n.panning.xmax+u>n.panxmax?(e=n.panxmax-(p-e),p=n.panxmax):(e=n.panning.xmin+u,p=n.panning.xmax+u));r=e;h=p;l.smin=r;l.srange=h-r;a.redrawScrollbar(l,g,void 0);A(c,l.smin,
l.smin+l.srange,f.slice(0,1));l.action=0;c.refresh()}catch(w){console.log("Error: "+w)}}}(this);this.throttledDragOnMouseMove=d.throttle(this._Gx.scroll_time_interval,this.dragMouseMoveHandler);window.addEventListener("mousemove",this.throttledDragOnMouseMove,!1);this.dragMouseUpHandler=function(a){return function(c){var d=a._Gx;1===c.which&&(d.panning=void 0)}}(this);window.addEventListener("mouseup",this.dragMouseUpHandler,!1);this.onresize=function(c){return function(d){a.checkresize(c._Mx)&&c.refresh()}}(this);
this.wheelHandler=function(c){var e=c._Mx,f=c._Gx,g=d.throttle(100,function(d){var g;"XPAN"===d.command?g=e.scrollbar_x:"YPAN"===d.command&&(g=e.scrollbar_y);g.action=f.wheelscroll_mode_natural?0>event.deltaY?a.SB_WHEELDOWN:a.SB_WHEELUP:0>event.deltaY?a.SB_WHEELUP:a.SB_WHEELDOWN;g.step=0.1*g.srange;g.page=9*g.step;a.scroll(e,g,a.XW_COMMAND,void 0,g);A(c,g.smin,g.smin+g.srange,d.command.slice(0,1))}),n=d.throttle(100,function(){var a=f.wheelZoomPercent||0.2;f.wheelscroll_mode_natural?0<event.deltaY&&
(a*=-1):0>event.deltaY&&(a*=-1);"x"===f.wheelZoom?c.percent_zoom(a,1,!0):"y"===f.wheelZoom?c.percent_zoom(1,a,!0):c.percent_zoom(a,a,!0)});return function(d){a.ifevent(e,d);var r=X(c);c.mouseOnCanvas&&(d.preventDefault(),r.inPanRegion?g(r):f.wheelZoom&&n())}}(this);window.addWheelListener(window,this.wheelHandler,!1);window.addEventListener("resize",this.onresize,!1);n.nokeypress||(this.onkeypress=function(c){return function(e){var f=c._Mx,g=c._Gx;if(c.mouseOnCanvas&&(!f.widget||"MENU"!==f.widget.type))if(f.widget&&
"ONESHOT"===f.widget.type)f.widget=null,c.refresh();else{var n=getKeyCode(e);97===n?(g.iabsc=(g.iabsc+1)%4,U(c)):108===n?c.change_settings({legend:!g.legend}):103===n?c.change_settings({grid:!g.grid}):98===n||2===n?f.warpbox&&(f.warpbox.mode="box"===f.warpbox.mode?"horizontal":"horizontal"===f.warpbox.mode?"vertical":"box",a.redraw_warpbox(f)):99===n?c.change_settings({xcnt:-1*g.cntrls}):114===n?c.change_settings({show_readout:!g.show_readout}):115===n?c.change_settings({specs:!g.specs}):120===n?
(e=c._Gx,f=c._Mx,g=e.aretx.toString(),1===e.iabsc?a.message(f,"INDEX = "+g):2===e.iabsc?a.message(f,"1/X = "+g):a.message(f,"X = "+g)):121===n?(e=c._Gx,f=c._Mx,g=e.arety.toString(),2===e.iabsc?a.message(f,"1/Y = "+g):a.message(f,"Y = "+g)):122===n?(e=c._Gx,f=c._Mx,e.zmin&&e.zmax&&(g="",g=1===e.lyr.length?"Z = "+e.lyr[0].get_z(e.retx,e.rety).toString():"TODO",a.message(f,g))):116===n?(e=c._Gx,f=c._Mx,0<e.lyr.length&&(g=e.lyr[0].hcb,1===g.xunits?a.message(f,"Time = "+d.sec2tod(g.timecode+e.retx)):a.message(f,
"Time = UNK"))):109===n?l(c):63===n?a.message(f,"To zoom, press and drag the left mouse (LM) over the region of interest and release. To unzoom, press right mouse (RM).  Press the middle mouse (MM) button or press the key 'M' to bring up the menu.  Information about keypresses and what they do can be foundby selecting 'Keypress Info' from the main menu."):102===n?(a.fullscreen(f),c.refresh()):9===n&&e.ctrlKey&&c.change_settings({invert:null})}}}(this),setKeypressHandler(this.onkeypress));return this};
e.Plot.prototype={add_plugin:function(a,c){void 0===c&&(c=Number.MAX_VALUE);if(0>=c)throw"Invalid plugin zorder";a.init(this);var d=document.createElement("canvas");d.width=this._Mx.canvas.width;d.height=this._Mx.canvas.height;this._Gx.plugins.push({impl:a,zorder:c,canvas:d});this._Gx.plugins.sort(function(a,c){return a.zorder-c.zorder});this.refresh()},remove_plugin:function(a){for(var c=0;c<this._Gx.plugins.length;c++)this._Gx.plugins[c].impl===a&&(a.dispose&&a.dispose(),this._Gx.plugins[c].canvas.parentNode&&
this._Gx.plugins[c].canvas.parentNode.removeElement(this._Gx.plugins[c].canvas));this._Gx.plugins.sort(function(a,c){return a.zorder-c.zorder});this.refresh()},addListener:function(c,d){a.addEventListener(this._Mx,c,d,!1)},removeListener:function(c,d){a.removeEventListener(this._Mx,c,d,!1)},change_settings:function(c){for(var e=this._Gx,f=this._Mx,g=0;g<e.lyr.length;g++)e.lyr[g].change_settings(c);void 0!==c.grid&&(e.grid=null===c.grid?!e.grid:c.grid);void 0!==c.gridBackground&&(e.gridBackground=
c.gridBackground);void 0!==c.gridStyle&&(e.gridStyle=c.gridStyle);void 0!==c.wheelZoom&&(e.wheelZoom=c.wheelZoom);void 0!==c.wheelZoomPercent&&(e.wheelZoomPercent=c.wheelZoomPercent);void 0!==c.autol&&(e.autol=c.autol);void 0!==c.index&&c.index!==e.index&&(e.index=null===c.index?!e.index:c.index,e.index&&1!==e.iabsc?e.iabsc=1:e.index||1!==e.iabsc||(e.iabsc=0),T(this,{get_data:!1},void 0,void 0),this.unzoom());void 0!==c.all&&(e.all=null===c.all?!e.all:c.all);void 0!==c.show_x_axis&&(e.show_x_axis=
null===c.show_x_axis?!e.show_x_axis:c.show_x_axis,e.specs=e.show_x_axis||e.show_y_axis||e.show_readout);void 0!==c.show_y_axis&&(e.show_y_axis=null===c.show_y_axis?!e.show_y_axis:c.show_y_axis,e.specs=e.show_x_axis||e.show_y_axis||e.show_readout);void 0!==c.show_readout&&(e.show_readout=null===c.show_readout?!e.show_readout:c.show_readout,e.specs=e.show_x_axis||e.show_y_axis||e.show_readout);void 0!==c.specs&&(e.specs=null===c.specs?!e.specs:c.specs,e.specs?(e.show_x_axis=!0,e.show_y_axis=!0,e.show_readout=
!0):(e.show_x_axis=!1,e.show_y_axis=!1,e.show_readout=!1));void 0!==c.xcnt&&(e.cntrls="leftmouse"===c.xcnt?1:"continuous"===c.xcnt?2:"disable"===c.xcnt&&0<e.cntrls?-1*e.cntrls:"enable"===c.xcnt&&0>e.cntrls?-1*e.cntrls:c.xcnt);void 0!==c.legend&&(e.legend=null===c.legend?!e.legend:c.legend,p(this,-1),g=e.lbtn-2,e.show_readout?(e.legendBtnLocation={x:this._Mx.width-e.lbtn,y:2,width:g,height:g},a.shadowbox(this._Mx,this._Mx.width-e.lbtn,2,g,g,1,-1,"L")):(e.legendBtnLocation={x:this._Mx.width-e.lbtn,
y:2,width:g,height:g},a.shadowbox(this._Mx,this._Mx.width-e.lbtn,2,g,g,1,1,"L")),p(this,1));void 0!==c.pan&&(e.pan=null===c.pan?!e.pan:c.pan);void 0!==c.cross&&(e.cross=null===c.cross?!e.cross:c.cross,e.cross?(e.cross_xpos=void 0,e.cross_ypos=void 0,C(this)):(void 0!==e.cross_xpos&&a.rubberline(f,e.cross_xpos,f.t,e.cross_xpos,f.b),void 0!==e.cross_ypos&&a.rubberline(f,f.l,e.cross_ypos,f.r,e.cross_ypos),e.cross_xpos=void 0,e.cross_ypos=void 0));void 0!==c.cmode&&y(this,c.cmode);if(void 0!==c.phunits){var h=
c.phunits,g=this._Gx,l=this._Mx,q=g.plab;"R"===h?q=23:"D"===h&&(q=24);"C"===h&&(q=25);if(q!==g.plab&&(h=[Math.PI,180,0.5],h=h[q-23]/h[g.plab-23],g.plab=q,2===g.cmode)){for(q=0;q<=l.level;q++)l.stk[q].ymin*=h,l.stk[q].ymax*=h,l.stk[q].yscl*=h;g.panymin*=h;g.panymax*=h;this.refresh()}}void 0!==c.rubberbox_action&&(e.default_rubberbox_action=c.rubberbox_action);void 0!==c.rubberbox_mode&&(e.default_rubberbox_mode=c.rubberbox_mode);void 0!==c.wheelscroll_mode_natural&&(e.wheelscroll_mode_natural=c.wheelscroll_mode_natural);
void 0!==c.colors&&(c.colors.fg||(c.colors.fg=f.fg),c.colors.bg||(c.colors.bg=f.bg),a.setbgfg(f,c.colors.bg,c.colors.fg,f.xi));void 0!==c.cmap&&(e.cmap=null===c.cmap?2===e.cmode?2:1:c.cmap,a.colormap(f,d.Mc.colormap[e.cmap],e.ncolors));void 0!==c.yinv&&(f.origin=c.yinv?4:1);void 0!==c.rasterSmoothing&&(e.rasterSmoothing=null===c.rasterSmoothing?!e.rasterSmoothing:c.rasterSmoothing);void 0!==c.fillStyle&&(e.fillStyle=c.fillStyle);void 0!==c.invert&&(null===c.invert?a.invertbgfg(f):!0===c.invert?a.setbgfg(this,
"white","black"):a.setbgfg(this,"black","white"));void 0!==c.nomenu&&(e.nomenu=null===c.nomenu?!e.nomenu:c.nomenu);void 0!==c.ymin&&A(this,c.ymin,f.stk[0].ymax,"Y");void 0!==c.ymax&&A(this,f.stk[0].ymin,c.ymax,"Y");void 0!==c.xmin&&A(this,c.xmin,f.stk[0].xmax,"X");void 0!==c.xmax&&A(this,f.stk[0].xmin,c.xmax,"X");this.refresh();void 0!==c.pan&&U(this)},reread:function(){for(var c=this._Gx,d=[],e=0;e<c.lyr.length;e++)d[e]=c.lyr[e];e=c.HCB.slice();this.deoverlay();for(var f=0;f<e.length;f++)this.overlay_bluefile(e[f]);
for(e=0;e<c.lyr.length;e++)c.lyr[e].symbol=d[e].symbol,c.lyr[e].radius=d[e].radius;this.refresh();c=document.createEvent("Event");c.initEvent("reread",!0,!0);a.dispatchEvent(this._Mx,c)},cleanup:function(){},reload:function(a,c,d){var e=this._Mx,f=this._Gx;0>a||a>=f.lyr.length||void 0===f.lyr[a].reload||(a=f.lyr[a].reload(c,d),0===e.level&&T(this,{get_data:!1},a.xmin,a.xmax),this.refresh())},rescale:function(){0===this._Mx.level&&T(this,{get_data:!1},void 0,void 0);this.refresh()},push:function(a,
c,d,e){var f=this._Mx,g=this._Gx;0>a||a>=g.lyr.length||void 0===g.lyr[a].push||(a=g.lyr[a].push(c,d,e),0===f.level&&a&&T(this,{get_data:!1}),this.refresh())},overlay_array:function(a,c,e){d.log.debug("Overlay array");a=d.initialize(a,c);return this.overlay_bluefile(a,e)},overlay_pipe:function(a,c){d.log.debug("Overlay pipe");a||(a={});a.pipe=!0;var e=d.initialize(null,a);return this.overlay_bluefile(e,c)},overlay_websocket:function(a,c,e){d.log.debug("Overlay websocket: "+a);a=new WebSocket(a,"plot-data");
a.binaryType="arraybuffer";var f=this,g=d.initialize(null,c);g.ws=a;var h=this.overlay_bluefile(g,e);a.onopen=function(a){};a.onmessage=function(a){return function(a){if(a.data instanceof ArrayBuffer){var c=g.createArray(a.data);f.reload(h,c)}else if("string"===typeof a.data){var d=f._Gx,d=d.HCB[d.lyr[h].hcb];a=JSON.parse(a.data);for(c in a)d[c]=a[c];g.size=void 0}}}(a);return h},overlay_href:function(a,c,e){d.log.debug("Overlay href: "+a);try{this.show_spinner();var f=function(a,c){return function(d){try{if(d){var f=
a.overlay_bluefile(d,e);c&&c(d,f)}else alert("Failed to load data")}finally{a.hide_spinner()}}}(this,c);(new BlueFileReader).read_http(a,f)}catch(g){console.log(g),alert("Failed to load data"),this.hide_spinner()}},show_spinner:function(){this._Gx.spinner||(Q.color=this._Mx.xwfg,this._Gx.spinner=(new Spinner(Q)).spin(this._Gx.parent))},hide_spinner:function(){this._Gx.spinner&&this._Gx.spinner.stop();this._Gx.spinner=void 0},add_layer:function(c){var d=this._Gx,e=this._Mx;d.lyr.push(c);var f=document.createEvent("Event");
f.initEvent("file_overlayed",!0,!0);f.index=d.lyr.length-1;f.name=c.name;a.dispatchEvent(e,f)},get_layer:function(a){var c=this._Gx;return 0<=a&&a<c.lyr.length?c.lyr[a]:null},overlay_bluefile:function(a,c){d.log.debug("Overlay bluefile: "+a.file_name);var f=this._Mx,g=this._Gx;c=c||{};var l=0===g.HCB.length;g.HCB.push(a);1===g.HCB.length&&h(this,!0);var p=g.lyr.length;void 0===c.layerType?1===a["class"]?e.Layer1D.overlay(this,a,c):2===a["class"]&&e.Layer2D.overlay(this,a,c):c.layerType.overlay(this,
a,c);y(this,g.cmode);if(l)if(0===g.HCB.length)h(this,!1);else{g.basemode=g.cmode;var q,t;0===(g.autox&&1)&&(q=g.xmin);0===(g.autox&&2)&&(t=g.xmin);T(this,{get_data:!0},q,t);f.level=0;0!==(g.autox&&1)&&(g.xmin=f.stk[0].xmin);0!==(g.autox&&2)&&(g.xmax=f.stk[0].xmax);0!==(g.autoy&&1)&&(g.ymin=f.stk[0].ymin);0!==(g.autoy&&2)&&(g.ymax=f.stk[0].ymax);f.resize=!0;f.origin=g.lyr[0].preferred_origin?g.lyr[0].preferred_origin:1}else for(f=p;f<g.lyr.length;f++)w(this,f);u(this);this.refresh();return g.HCB.length-
1},load_files:function(a,c){for(var d=function(a){return function(d){a.overlay_bluefile(d,c)}}(this),e=0;e<a.length;e++){var f=a[e];(new BlueFileReader).read(f,d)}},deoverlay:function(a){var c=this._Gx;if(0<c.HCB.length)if(void 0===a)for(a=c.HCB.length-1;0<=a;a--)this.remove_layer(a);else if(0>a){a=c.HCB.length+a;if(0>a)return;this.remove_layer(a)}else a<c.HCB.length&&this.remove_layer(a);0===c.lyr.length&&(h(this,!1),T(this,{}))},remove_layer:function(c){var d=this._Gx,e="",f=null;if(0<=c&&c<d.HCB.length){e=
d.HCB[c].file_name;f=d.HCB[c];for(d.HCB[c]=null;c<d.HCB.length-1;c++)d.HCB[c]=d.HCB[c+1];d.HCB.length-=1}for(c=d.lyr.length-1;0<=c;c--)if(d.lyr[c].hcb===f){var g=c,h=this._Gx;h.lyr[g].ybufn=0;h.lyr[g].ybuf=null;if(g<h.lyr.length-1)for(;g<h.lyr.length-1;g++)h.lyr[g]=h.lyr[g+1];h.lyr.length-=1;0<h.HCB.length&&(h.panxmin=1,h.panxmax=-1,h.panymin=1,h.panymax=-1)}u(this);this.refresh();d=document.createEvent("Event");d.initEvent("file_deoverlayed",!0,!0);""!==e&&(d.fileName=e);a.dispatchEvent(this._Mx,
d)},pixel_zoom:function(a,c,d,e,f){a=O(this,a,c);d=O(this,d,e);this.zoom(a,d,f)},percent_zoom:function(a,c,d){var e=this._Mx,f=this._Gx,g=0;1>Math.abs(a)&&(g=Math.abs(e.stk[e.level].xmax-e.stk[e.level].xmin),g=g*a/2);a=0;1>Math.abs(c)&&(a=Math.abs(e.stk[e.level].ymax-e.stk[e.level].ymin),a=a*c/2);c={x:Math.max(e.stk[e.level].xmin+g,f.panxmin),y:Math.max(e.stk[e.level].ymin+a,f.panymin)};e={x:Math.min(e.stk[e.level].xmax-g,f.panxmax),y:Math.min(e.stk[e.level].ymax-a,f.panymax)};this.zoom(c,e,d)},zoom:function(c,
d,e){var f=this._Mx,g=this._Gx;if(!(9<=f.level)){void 0===c.x&&(c.x=f.stk[f.level].xmin);void 0===c.y&&(c.y=f.stk[f.level].ymin);void 0===d.x&&(d.x=f.stk[f.level].xmax);void 0===d.y&&(d.y=f.stk[f.level].ymax);if(d.x<c.x){var h=d.x;d.x=c.x;c.x=h}d.y<c.y&&(h=d.y,d.y=c.y,c.y=h);h={};h.xscl=f.stk[f.level].xscl;h.yscl=f.stk[f.level].yscl;h.xmin=c.x;h.xmax=d.x;h.ymin=c.y;h.ymax=d.y;g.index&&(h.xmin=Math.min(h.xmin/g.xdelta),h.xmax=Math.min(h.xmax/g.xdelta));e&&g.inContinuousZoom?f.stk[f.level]=h:(f.stk.push(h),
f.level=f.stk.length-1);g.inContinuousZoom=e;c=document.createEvent("Event");c.initEvent("zoom",!0,!0);c.level=f.level;c.inContinuousZoom=g.inContinuousZoom;c.xmin=f.stk[f.level].xmin;c.ymin=f.stk[f.level].ymin;c.xmax=f.stk[f.level].xmax;c.ymax=f.stk[f.level].ymax;a.dispatchEvent(f,c);this.refresh()}},unzoom:function(c){var d=this._Mx,e=this._Gx;if(0!==d.level){c||(c=d.stk.length);for(;0<c&&0!==d.level;)d.stk.pop(),d.level=d.stk.length-1,c-=1;e.inContinuousZoom=!1;c=document.createEvent("Event");
c.initEvent("unzoom",!0,!0);c.level=d.level;c.xmin=d.stk[d.level].xmin;c.ymin=d.stk[d.level].ymin;c.xmax=d.stk[d.level].xmax;c.ymax=d.stk[d.level].ymax;a.dispatchEvent(d,c);this.refresh()}},mimic:function(a,c){var d=this;c||(c={});c.zoom?a.addListener("zoom",function(a){d.zoom({x:a.xmin,y:a.ymin},{x:a.xmax,y:a.ymax},a.inContinuousZoom)}):c.xzoom?a.addListener("zoom",function(a){d.zoom({x:a.xmin,y:void 0},{x:a.xmax,y:void 0},a.inContinuousZoom)}):c.yzoom&&a.addListener("zoom",function(a){d.zoom({x:void 0,
y:a.ymin},{x:void 0,y:a.ymax},a.inContinuousZoom)});c.unzoom&&a.addListener("unzoom",function(a){d.unzoom(1)})},redraw:function(){var a=this._Gx,c=this._Mx,d=c.canvas.getContext("2d");a.plotData.valid?(d.drawImage(a.plotData,c.l-1,c.t-1,c.r-c.l+2,c.b-c.t+2,c.l-1,c.t-1,c.r-c.l+2,c.b-c.t+2),B(this),a.cross_xpos=void 0,a.cross_ypos=void 0,C(this)):this.refresh()},refresh:function(){var c=this;a.render(this._Mx,function(){c._refresh()})},enable_listeners:function(){var c=this._Mx;a.addEventListener(c,
"mousedown",this.onmousedown,!1);a.addEventListener(c,"mousemove",this.throttledOnMouseMove,!1);document.addEventListener("mouseup",this.docMouseUp,!1);a.addEventListener(c,"mouseup",this.mouseup,!1);window.addEventListener("mousedown",this.dragMouseDownHandler,!1);window.addEventListener("mousemove",this.throttledDragOnMouseMove,!1);window.addEventListener("mouseup",this.dragMouseUpHandler,!1);window.addEventListener("wheel",this.wheelHandler,!1);window.addEventListener("mousewheel",this.wheelHandler,
!1);window.addEventListener("DOMMouseScroll",this.wheelHandler,!1);window.addEventListener("keypress",this.onkeypress,!1)},disable_listeners:function(){var c=this._Mx;a.removeEventListener(c,"mousedown",this.onmousedown,!1);a.removeEventListener(c,"mousemove",this.throttledOnMouseMove,!1);document.removeEventListener("mouseup",this.docMouseUp,!1);a.removeEventListener(c,"mouseup",this.mouseup,!1);window.removeEventListener("mousedown",this.dragMouseDownHandler,!1);window.removeEventListener("mousemove",
this.throttledDragOnMouseMove,!1);window.removeEventListener("mouseup",this.dragMouseUpHandler,!1);window.removeEventListener("wheel",this.wheelHandler,!1);window.removeEventListener("mousewheel",this.wheelHandler,!1);window.removeEventListener("DOMMouseScroll",this.wheelHandler,!1);window.removeEventListener("keypress",this.onkeypress,!1)},checkresize:function(){a.checkresize(this._Mx)&&this.refresh()},_refresh:function(){var c=this._Mx,d=this._Gx;c.canvas.getContext("2d");if(!d.hold){a.set_font(c,
Math.min(8,c.width/64));d.pthk=1.5*c.text_w;d.specs?(c.l=!0===d.show_y_axis?6*c.text_w:1,c.r=!0===d.pan?c.width-(d.pthk+2*c.text_w):c.width-2,d.show_readout?(c.t=2*c.text_h,c.b=d.show_x_axis?c.height-4*c.text_h:c.height-3*c.text_h):(c.t=d.pan?d.pthk+2*c.text_w:1,c.b=d.show_x_axis?c.height-3*c.text_h/2:c.height-2),d.pl=d.show_readout?50*c.text_w:35*c.text_w,d.pr=Math.max(d.pl+9*c.text_w,c.r),d.pt=d.show_readout?d.show_x_axis?c.b+c.text_h+(c.height-c.b-c.text_h-d.pthk)/2:c.b+(c.height-c.b-d.pthk)/2:
(c.t-d.pthk)/2,d.lbtn=c.text_h+c.text_w+2):(d.pan?(c.t=d.pthk+2*c.text_w,c.r=c.width-(d.pthk+c.text_w)):(c.t=1,c.r=c.width-2),c.b=c.height-2,c.l=1,d.pl=c.l,d.pr=c.r,d.pt=(c.t-d.pthk)/2,d.lbtn=0);d.pyl=c.r+(c.width-c.r-d.pthk)/2+1;var e=c.level;c.stk[e].x1=c.l;c.stk[e].y1=c.t;c.stk[e].x2=c.r;c.stk[e].y2=c.b;c.stk[e].xscl=(c.stk[e].xmax-c.stk[e].xmin)/(c.r-c.l);c.stk[e].yscl=(c.stk[e].ymax-c.stk[e].ymin)/(c.b-c.t);e=O(this,c.xpos,c.ypos);d.retx=e.x;d.rety=e.y;if(0===d.panning||0!==d.panning)d.plotData.valid=
!1,a.clear_window(c);var e=d.xlab,f=d.ylab;void 0===e&&(e=30);d.index&&(e=0);void 0===f&&(f=0<d.lyr.length&&d.lyr[0].cx,1===d.cmode?f=28:2===d.cmode?f=d.plab:3===d.cmode&&f?f=21:4===d.cmode?f=22:5===d.cmode?(f=22,e=21):f=6===d.cmode?26:7===d.cmode?27:0);if(d.specs){if(0===d.sections){var g={grid:d.grid};2===d.panning&&(g.noxtlab=!0);d.show_x_axis||(g.noxtics=!0,g.noxtlab=!0,g.noxplab=!0);d.show_y_axis||(g.noytics=!0,g.noytlab=!0,g.noyplab=!0);!d.specs||d.show_readout||d.pan||(g.noyplab=!0,g.noxplab=
!0);d.gridBackground&&(g.fillStyle=d.gridBackground);d.gridStyle&&(g.gridStyle=d.gridStyle);a.drawaxis(c,d.xdiv,d.ydiv,e,f,g)}e=d.lbtn-2;d.show_readout&&d.pan&&(d.legend?(d.legendBtnLocation={x:c.width-d.lbtn,y:2,width:e,height:e},a.shadowbox(c,c.width-d.lbtn,2,e,e,1,-2,"L")):(d.legendBtnLocation={x:c.width-d.lbtn,y:2,width:e,height:e},a.shadowbox(c,c.width-d.lbtn,2,e,e,1,2,"L")),U(this))}else d.grid&&0<=d.sections&&(g={grid:!0,noaxisbox:!0,noxtics:!0,noxtlab:!0,noxplab:!0,noytics:!0,noytlab:!0,noyplab:!0},
a.drawaxis(c,d.xdiv,d.ydiv,e,f,g));for(e=0;e<d.lyr.length;e++)w(this,e);p(this,4);c.r>c.l&&c.b>c.t&&(d.plotData.width=c.canvas.width,d.plotData.height=c.canvas.height,d.plotData.getContext("2d").drawImage(c.canvas,0,0),d.plotData.valid=!0);B(this);d.cross_xpos=void 0;d.cross_ypos=void 0;C(this)}}};var Q={lines:13,length:7,width:4,radius:10,corners:1,rotate:0,color:"#FFF",speed:1,trail:60,shadow:!1,hwaccel:!1,className:"spinner",zIndex:2E9,top:"auto",left:"auto"},z="Ma Ph Re Im IR Lo L2".split(" "),
S=["(absc)","(indx)","(1/ab)","(dydx)"]})(window.sigplot,window.mx,window.m);

/*!

 File: sigplot.annotations.js

 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser 
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or 
 (at your option) any later version. This library is distributed in the hope that it will be useful, but 
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the 
 GNU Lesser General Public License along with SigPlot.

 File: sigplot.slider.js

 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser 
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or 
 (at your option) any later version. This library is distributed in the hope that it will be useful, but 
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the 
 GNU Lesser General Public License along with SigPlot.

 File: sigplot.accordion.js

 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser 
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or 
 (at your option) any later version. This library is distributed in the hope that it will be useful, but 
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the 
 GNU Lesser General Public License along with SigPlot.

 File: sigplot.boxes.js

 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser 
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or 
 (at your option) any later version. This library is distributed in the hope that it will be useful, but 
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the 
 GNU Lesser General Public License along with SigPlot.

 File: sigplot.playback.js

 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser 
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or 
 (at your option) any later version. This library is distributed in the hope that it will be useful, but 
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the 
 GNU Lesser General Public License along with SigPlot.

 File: license.js
 Copyright (c) 2012-2014, Michael Ihde, All rights reserved.
 Copyright (c) 2012-2014, Axios Inc., All rights reserved.

 This file is part of SigPlot.

 SigPlot is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser 
 General Public License as published by the Free Software Foundation; either version 3.0 of the License, or 
 (at your option) any later version. This library is distributed in the hope that it will be useful, but 
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 PURPOSE. See the GNU Lesser General Public License for more details. You should have received a copy of the 
 GNU Lesser General Public License along with SigPlot.

 Portions of SigPlot may utilize the following open-source software:

   loglevel.js          - MIT License; Copyright (c) 2014, Tim Perry
   typedarray.js        - MIT License; Copyright (c) 2010, Linden Research, Inc.
   tinycolor.js         - MIT License; Copyright (c) 2013, Brian Grinstead
   CanvasInput.js       - MIT License; Copyright (c) 2013, James Simpson of GoldFire Studios
   spin.js              - MIT License; Copyright (c) 2011-2013 Felix Gnass
   Array.remove         - MIT License; Copyright (c) 2007, John Resig
   Firefox subarray fix - Public Domain; Copyright (c) 2011, Ryan Berdeen
*/
(function(k,e,n,d){k.AnnotationPlugin=function(a){this.options=a===d?{}:a;this.options.display===d&&(this.options.display=!0);this.annotations=[]};k.AnnotationPlugin.prototype={init:function(a){this.plot=a},menu:function(){var a=function(b){return function(){b.options.display=!b.options.display;b.plot.redraw()}}(this),c=function(b){return function(){b.annotations=[];b.plot.redraw()}}(this);return{text:"Annotations...",menu:{title:"ANNOTATIONS",items:[{text:"Display",checked:this.options.display,style:"checkbox",
handler:a},{text:"Clear All",handler:c}]}}},add_annotation:function(a){this.annotations.push(a);this.plot.redraw();return this.annotations.length},clear_annotations:function(){this.annotations=[];this.plot.redraw()},refresh:function(a){if(this.options.display){var c=this.plot._Mx;a=a.getContext("2d");for(var b=0;b<this.annotations.length;b++){var l=this.annotations[b],d={x:l.x,y:l.y};!0===l.absolute_placement?d.x+=c.l:d=e.real_to_pixel(c,d.x,d.y);d.y+=c.t;l.value instanceof HTMLImageElement||l.value instanceof
HTMLCanvasElement||l.value instanceof HTMLVideoElement?a.drawImage(l.value,d.x,d.y):(a.save(),a.font="bold italic 20px new century schoolbook",a.globalAlpha=1,a.fillStyle=c.fg,l.font&&(a.font=l.font),a.fillText(l.value,d.x,d.y),a.restore())}}},dispose:function(){this.annotations=this.plot=d}}})(window.sigplot=window.sigplot||{},mx,m);
(function(k,e,n,d){k.SliderPlugin=function(a){this.options=a!==d?a:{};this.options.display===d&&(this.options.display=!0);this.options.style===d&&(this.options.style={});this.options.direction===d&&(this.options.direction="vertical");this.location=this.position=d};k.SliderPlugin.prototype={init:function(a){this.plot=a;var c=a._Mx,b=this;this.onmousemove=function(a){if(b.location!==d&&!b.options.prevent_drag)if(a.xpos<c.l||a.xpos>c.r)b.set_highlight(!1);else if(a.ypos>c.b||a.ypos<c.t)b.set_highlight(!1);
else{var h=b.options.style.lineWidth!==d?b.options.style.lineWidth:1;b.dragging?(h=e.pixel_to_real(c,a.xpos,a.ypos),"vertical"===b.options.direction?(b.location=a.xpos,b.position=h.x):"horizontal"===b.options.direction&&(b.location=a.ypos,b.location=h.y),b.plot.redraw(),a.preventDefault()):c.warpbox||("vertical"===b.options.direction?Math.abs(b.location-a.xpos)<h+5?b.set_highlight(!0):b.set_highlight(!1):"horizontal"===b.options.direction&&(Math.abs(b.location-a.ypos)<h+5?b.set_highlight(!0):b.set_highlight(!1)))}};
this.plot.addListener("mmove",this.onmousemove);this.onmousedown=function(a){if(b.location!==d&&!(b.options.prevent_drag||a.xpos<c.l||a.xpos>c.r||a.ypos>c.b||a.ypos<c.t)){var h=b.options.style.lineWidth!==d?b.options.style.lineWidth:1;"vertical"===b.options.direction?Math.abs(b.location-a.xpos)<h+5&&(b.dragging=!0,a.preventDefault()):"horizontal"===b.options.direction&&Math.abs(b.location-a.ypos)<h+5&&(b.dragging=!0,a.preventDefault())}};this.plot.addListener("mdown",this.onmousedown);this.onmouseup=
function(a){b.dragging=!1;a=document.createEvent("Event");a.initEvent("slidertag",!0,!0);a.location=b.location;a.position=b.position;e.dispatchEvent(c,a);a=document.createEvent("Event");a.initEvent("sliderdrag",!0,!0);a.location=b.location;a.position=b.position;e.dispatchEvent(c,a)};document.addEventListener("mouseup",this.onmouseup,!1)},addListener:function(a,c){e.addEventListener(this.plot._Mx,a,c,!1)},removeListener:function(a,c){e.removeEventListener(this.plot._Mx,a,c,!1)},set_highlight:function(a){a!==
this.highlight&&(this.highlight=a,this.plot.redraw())},set_position:function(a){if(!this.dragging&&this.position!==a){this.set_highlight(!1);var c=this.plot._Mx;this.position=a;a=e.real_to_pixel(c,this.position,this.position);"vertical"===this.options.direction?this.location=a.x:"horizontal"===this.options.direction&&(this.location=a.y);a=document.createEvent("Event");a.initEvent("slidertag",!0,!0);a.location=this.location;a.position=this.position;e.dispatchEvent(c,a)&&this.plot.redraw()}},set_location:function(a){if(!this.dragging&&
this.location!==a){this.set_highlight(!1);var c=this.plot._Mx;this.location=a;a=e.pixel_to_real(c,a,a);"vertical"===this.options.direction?this.position=a.x:"horizontal"===this.options.direction&&(this.location=a.y);a=document.createEvent("Event");a.initEvent("slidertag",!0,!0);a.location=this.location;a.position=this.position;e.dispatchEvent(c,a)&&this.plot.redraw()}},get_position:function(){return this.position},get_location:function(){return this.location},refresh:function(a){if(this.options.display&&
this.position!==d){var c=this.plot._Mx;a=a.getContext("2d");a.lineWidth=this.options.style.lineWidth!==d?this.options.style.lineWidth:1;a.lineCap=this.options.style.lineCap!==d?this.options.style.lineCap:"square";a.strokeStyle=this.options.style.strokeStyle!==d?this.options.style.strokeStyle:c.fg;if(this.dragging||this.highlight)a.lineWidth=Math.ceil(1.2*a.lineWidth);var b=e.real_to_pixel(c,this.position,this.position);if("vertical"===this.options.direction){if(b.x<c.l||b.x>c.r)return;this.location=
b.x}else if("horizontal"===this.options.direction){if(b.y<c.t||b.y>c.b)return;this.location=b.y}"vertical"===this.options.direction?(a.beginPath(),a.moveTo(this.location+0.5,c.t),a.lineTo(this.location+0.5,c.b),a.stroke()):"horizontal"===this.options.direction&&(a.beginPath(),a.moveTo(c.l,this.location+0.5),a.lineTo(c.r,this.location+0.5),a.stroke())}},dispose:function(){this.plot.removeListener("mmove",this.onmousemove);document.removeEventListener("mouseup",this.onmouseup,!1);this.position=this.plot=
d}}})(window.sigplot=window.sigplot||{},mx,m);
(function(k,e,n,d){k.AccordionPlugin=function(a){this.options=a!==d?a:{};this.options.display===d&&(this.options.display=!0);this.options.center_line_style===d&&(this.options.center_line_style={});this.options.edge_line_style===d&&(this.options.edge_line_style={});this.options.fill_style===d&&(this.options.fill_style={});this.options.direction===d&&(this.options.direction="vertical");this.loc_2=this.loc_1=this.center_location=this.width=this.center=d};k.AccordionPlugin.prototype={init:function(a){this.plot=
a;var c=this.plot._Mx,b=this;this.onmousemove=function(a){if(b.center_location!==d&&!b.options.prevent_drag)if(a.xpos<c.l||a.xpos>c.r)b.set_highlight(!1);else if(a.ypos>c.b||a.ypos<c.t)b.set_highlight(!1);else{var h=b.options.center_line_style.lineWidth!==d?b.options.center_line_style.lineWidth:1,f=b.options.edge_line_style.lineWidth!==d?b.options.edge_line_style.lineWidth:1;b.dragging||b.edge_dragging?(b.dragging&&(h=e.pixel_to_real(c,a.xpos,a.ypos),"vertical"===b.options.direction?(b.center_location=
a.xpos,b.center=h.x):"horizontal"===b.options.direction&&(b.center_location=a.ypos,b.center=h.y)),b.edge_dragging&&(h=e.pixel_to_real(c,a.xpos,a.ypos),"vertical"===b.options.direction?b.width=2*Math.abs(b.center-h.x):"horizontal"===b.options.direction&&(b.width=2*Math.abs(b.center-h.y))),b.plot&&b.plot.refresh(),a.preventDefault()):c.warpbox||("vertical"===b.options.direction?(Math.abs(b.center_location-a.xpos)<h+5?b.set_highlight(!0):b.set_highlight(!1),Math.abs(b.loc_1-a.xpos)<f+5||Math.abs(b.loc_2-
a.xpos)<f+5?b.set_edge_highlight(!0):b.set_edge_highlight(!1)):"horizontal"===b.options.direction&&(Math.abs(b.center_location-a.ypos)<h+5?b.set_highlight(!0):b.set_highlight(!1),Math.abs(b.loc_1-a.ypos)<f+5||Math.abs(b.loc_2-a.ypos)<f+5?b.set_edge_highlight(!0):b.set_edge_highlight(!1)))}};this.plot.addListener("mmove",this.onmousemove);this.onmousedown=function(a){if(b.center_location!==d&&!(a.xpos<c.l||a.xpos>c.r||a.ypos>c.b||a.ypos<c.t)){var h=b.options.center_line_style.lineWidth!==d?b.options.center_line_style.lineWidth:
1,f=b.options.edge_line_style.lineWidth!==d?b.options.edge_line_style.lineWidth:1;"vertical"===b.options.direction?Math.abs(b.loc_1-a.xpos)<f+5||Math.abs(b.loc_2-a.xpos)<f+5?(b.edge_dragging=!0,a.preventDefault()):Math.abs(b.center_location-a.xpos)<h+5&&(b.dragging=!0,a.preventDefault()):"horizontal"===b.options.direction&&(Math.abs(b.loc_1-a.ypos)<f+5||Math.abs(b.loc_2-a.ypos)<f+5?(b.edge_dragging=!0,a.preventDefault()):Math.abs(b.center_location-a.ypos)<h+5&&(b.dragging=!0,a.preventDefault()))}};
this.plot.addListener("mdown",this.onmousedown);this.onmouseup=function(a){b.dragging=!1;b.edge_dragging=!1;a=document.createEvent("Event");a.initEvent("accordiontag",!0,!0);a.center=b.center;a.width=b.width;e.dispatchEvent(c,a)};document.addEventListener("mouseup",this.onmouseup,!1)},addListener:function(a,c){e.addEventListener(this.plot._Mx,a,c,!1)},removeListener:function(a,c){e.removeEventListener(this.plot._Mx,a,c,!1)},set_highlight:function(a){a!==this.highlight&&(this.highlight=a,this.plot.redraw())},
set_edge_highlight:function(a){a!==this.edge_highlight&&(this.edge_highlight=a,this.plot.redraw())},set_center:function(a){this.center=a;if(this.plot){a=this.plot._Mx;var c=document.createEvent("Event");c.initEvent("accordiontag",!0,!0);c.center=this.center;c.width=this.width;e.dispatchEvent(a,c)&&this.plot.redraw()}},set_width:function(a){this.width=a;if(this.plot){a=this.plot._Mx;var c=document.createEvent("Event");c.initEvent("accordiontag",!0,!0);c.center=this.center;c.width=this.width;e.dispatchEvent(a,
c)&&this.plot.redraw()}},get_center:function(){return this.center},get_width:function(){return this.width},refresh:function(a){if(this.plot&&this.options.display&&this.center!==d&&this.width!==d){var c=this.plot._Mx,b=a.getContext("2d");b.clearRect(0,0,a.width,a.height);a=e.real_to_pixel(c,this.center,this.center);var l=e.real_to_pixel(c,this.center-this.width/2,this.center-this.width/2),h=e.real_to_pixel(c,this.center+this.width/2,this.center+this.width/2);"vertical"===this.options.direction?(this.center_location=
a.x,this.loc_1=Math.max(c.l,l.x),this.loc_2=Math.min(c.r,h.x)):"horizontal"===this.options.direction&&(this.center_location=a.y,this.loc_1=Math.max(c.t,h.y),this.loc_2=Math.min(c.b,l.y));this.options.shade_area&&0<this.loc_2-this.loc_1&&(a=b.globalAlpha,b.globalAlpha=this.options.fill_style.opacity!==d?this.options.fill_style.opacity:0.4,b.fillStyle=this.options.fill_style.fillStyle!==d?this.options.fill_style.fillStyle:c.hi,"vertical"===this.options.direction?b.fillRect(this.loc_1,c.t,this.loc_2-
this.loc_1,c.b-c.t):"horizontal"===this.options.direction&&b.fillRect(c.l,this.loc_1,c.r-c.l,this.loc_2-this.loc_1),b.globalAlpha=a);if(this.options.draw_edge_lines||this.edge_highlight||this.edge_dragging){b.lineWidth=this.options.edge_line_style.lineWidth!==d?this.options.edge_line_style.lineWidth:1;b.lineCap=this.options.edge_line_style.lineCap!==d?this.options.edge_line_style.lineCap:"square";b.strokeStyle=this.options.edge_line_style.strokeStyle!==d?this.options.edge_line_style.strokeStyle:c.fg;
if(this.edge_dragging||this.edge_highlight)b.lineWidth=Math.ceil(1.2*b.lineWidth);"vertical"===this.options.direction?(b.beginPath(),b.moveTo(this.loc_1+0.5,c.t),b.lineTo(this.loc_1+0.5,c.b),b.stroke(),b.beginPath(),b.moveTo(this.loc_2+0.5,c.t),b.lineTo(this.loc_2+0.5,c.b),b.stroke()):"horizontal"===this.options.direction&&(b.beginPath(),b.moveTo(c.l,this.loc_1+0.5),b.lineTo(c.r,this.loc_1+0.5),b.stroke(),b.beginPath(),b.moveTo(c.l,this.loc_2+0.5),b.lineTo(c.r,this.loc_2+0.5),b.stroke())}if(this.options.draw_center_line){b.lineWidth=
this.options.center_line_style.lineWidth!==d?this.options.center_line_style.lineWidth:1;b.lineCap=this.options.center_line_style.lineCap!==d?this.options.center_line_style.lineCap:"square";b.strokeStyle=this.options.center_line_style.strokeStyle!==d?this.options.center_line_style.strokeStyle:c.fg;if(this.dragging||this.highlight)b.lineWidth=Math.ceil(1.2*b.lineWidth);"vertical"===this.options.direction?(b.beginPath(),b.moveTo(this.center_location+0.5,c.t),b.lineTo(this.center_location+0.5,c.b),b.stroke()):
"horizontal"===this.options.direction&&(b.beginPath(),b.moveTo(c.l,this.center_location+0.5),b.lineTo(c.r,this.center_location+0.5),b.stroke())}}},dispose:function(){this.width=this.center_location=this.center=this.plot=d}}})(window.sigplot=window.sigplot||{},mx,m);
(function(k,e,n,d){k.BoxesPlugin=function(a){this.options=a===d?{}:a;this.options.display===d&&(this.options.display=!0);this.boxes=[]};k.BoxesPlugin.prototype={init:function(a){this.plot=a},menu:function(){var a=function(a){return function(){a.options.display=!a.options.display;a.plot.redraw()}}(this),c=function(a){return function(){a.boxes=[];a.plot.redraw()}}(this);return{text:"Annotations...",menu:{title:"ANNOTATIONS",items:[{text:"Display",checked:this.options.display,style:"checkbox",handler:a},
{text:"Clear All",handler:c}]}}},add_box:function(a){this.boxes.push(a);this.plot.redraw();return this.boxes.length},refresh:function(a){if(this.options.display){var c=this.plot._Mx;a=a.getContext("2d");var b,d,h,f,g,p;a.save();a.beginPath();a.rect(c.l,c.t,c.r-c.l,c.b-c.t);a.clip();for(var k=0;k<this.boxes.length;k++)b=this.boxes[k],!0===b.absolute_placement?(d=b.x+c.l,h=b.y+c.t,f=b.w,g=b.h):(g=e.real_to_pixel(c,b.x,b.y),p=e.real_to_pixel(c,b.x+b.w,b.y+b.h),d=g.x,h=g.y,f=p.x-g.x,g=g.y-p.y),a.strokeStyle=
b.strokeStyle||c.fg,a.lineWidth=b.lineWidth||1,1===a.lineWidth%2&&(d+=0.5,h+=0.5),a.strokeRect(d,h,f,g),b.text&&(a.save(),a.font=b.font||c.text_H+"px Courier New, monospace",a.globalAlpha=1,a.textAlign="end",a.fillStyle=a.strokeStyle,b.font&&(a.font=b.font),d-=c.text_w,h-=c.text_h/3,g=a.measureText(b.text).width,d-g<c.l&&(d+=f),a.fillText(b.text,d,h),a.restore());a.restore()}},dispose:function(){this.boxes=this.plot=d}}})(window.sigplot=window.sigplot||{},mx,m);
(function(k,e,n,d){k.PlaybackControlsPlugin=function(a){this.options=a===d?{}:a;this.options.display===d&&(this.options.display=!0);this.options.size=this.options.size||25;this.options.lineWidth=this.options.lineWidth||2;this.state="paused";this.highlight=!1};k.PlaybackControlsPlugin.prototype={init:function(a){this.plot=a;var c=this,b=this.plot._Mx;this.onmousemove=function(a){b.warpbox||(c.ismouseover(a.xpos,a.ypos)?c.set_highlight(!0):c.set_highlight(!1))};this.plot.addListener("mmove",this.onmousemove);
this.onmousedown=function(a){b.warpbox||c.ismouseover(a.xpos,a.ypos)&&a.preventDefault()};this.plot.addListener("mdown",this.onmousedown);this.onmouseclick=function(a){!b.warpbox&&c.ismouseover(a.xpos,a.ypos)&&(c.toggle(),a.preventDefault())};this.plot.addListener("mclick",this.onmouseclick)},set_highlight:function(a){a!==this.highlight&&(this.highlight=a,this.plot.redraw())},toggle:function(a){a||(a="paused"===this.state?"playing":"paused");if(a!==this.state&&this.plot){var c=this.plot._Mx,b=document.createEvent("Event");
b.initEvent("playbackevt",!0,!0);b.state=a;e.dispatchEvent(c,b)&&(this.state=a);this.plot.redraw()}},addListener:function(a,c){e.addEventListener(this.plot._Mx,a,c,!1)},removeListener:function(a,c){e.removeEventListener(this.plot._Mx,a,c,!1)},ismouseover:function(a,c){var b=this.position();return Math.pow(a-b.x,2)+Math.pow(c-b.y,2)<Math.pow(this.options.size/2,2)},position:function(){if(this.options.position)return this.options.position;if(this.plot){var a=this.plot._Mx,c=this.options.size/2;return{x:a.l+
c+this.options.lineWidth+1,y:a.t+c+this.options.lineWidth+1}}return{x:null,y:null}},refresh:function(a){var c,b,d;if(this.options.display){var h=this.plot._Mx,f=a.getContext("2d");f.lineWidth=this.options.lineWidth;var g=this.options.size/2;this.highlight&&(f.lineWidth+=2,g+=1);var e=this.position();f.beginPath();f.arc(e.x,e.y,g-f.lineWidth,0,2*Math.PI,!0);f.closePath();f.strokeStyle=this.options.strokeStyle||h.fg;f.stroke();this.options.fillStyle&&(f.fillStyle=this.options.fillStyle,f.fill());if("paused"===
this.state){var k;b=0.8*g+(e.x-g);a=1.45*g+(e.x-g);k=0.8*g+(e.x-g);d=0.56*g+(e.y-g);c=g+(e.y-g);g=1.45*g+(e.y-g);f.beginPath();f.moveTo(b,d);f.lineTo(a,c);f.lineTo(k,g);f.closePath();f.fillStyle=this.options.strokeStyle||h.fg;f.fill()}else f.lineCap="round",f.lineWidth=Math.floor(Math.min(1,this.options.size/8)),b=0.8*g+(e.x-g),a=0.8*g+(e.x-g),d=g/2+(e.y-g),c=1.5*g+(e.y-g),f.beginPath(),f.moveTo(b,d),f.lineTo(a,c),f.closePath(),f.stroke(),b=g+g/5+(e.x-g),a=g+g/5+(e.x-g),d=g/2+(e.y-g),c=1.5*g+(e.y-
g),f.beginPath(),f.moveTo(b,d),f.lineTo(a,c),f.closePath(),f.stroke();f.restore()}},dispose:function(){this.boxes=this.plot=d}}})(window.sigplot=window.sigplot||{},mx,m);

angular.module('webSCA').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/device-managers.html',
    "<h2>Device Managers</h2><div class=container><div class=row><div class=col-md-3><div class=\"panel panel-default\"><div class=panel-heading>Device Managers</div><ul class=\"list-group selection\"><a ng-repeat=\"item in redhawk.deviceManagers\" ng-click=setManager(item.id) ng-class=\"{'active': (setManager() == item.id) }\" class=list-group-item><b>{{item.name}}</b></a> <a class=list-group-item ng-hide=redhawk.deviceManagers><i>No Device Managers found</i></a></ul><div class=panel-footer><div class=\"text-right text-muted\"><small>{{redhawk.deviceManagers.length}} Device Managers</small></div></div></div></div><div class=col-md-9><div class=\"panel panel-default\" ng-show=manager><div class=panel-heading><h3 class=panel-title>{{manager.name}}<status info=manager.status></status><small>{{manager.id}}</small><json-source json-data=manager></json-source></h3></div><div class=panel-body><div class=container-fluid><div class=row><div class=col-md-6><div class=row><div class=col-md-12><h4><span class=\"glyphicon glyphicon-tasks\"></span> Devices</h4></div><div class=col-md-12><ul class=list-group><li ng-repeat=\"(label, device) in manager.devices\" class=list-group-item><device id=device.id manager-id=manager.id domain-id=manager.domainId></device></li></ul></div></div></div><div class=col-md-6><properties info=manager.properties can-edit=false configure=configure(properties)></properties></div></div></div></div></div><div class=\"center-block text-center text-muted\" ng-hide=manager><div class=\"panel panel-default\"><div class=panel-body><h2><i class=\"icon-eye-close icon-3x\"></i></h2><h3>No Device Manager Selected</h3><p>Try selecting one from the list on the left.</p></div></div></div></div></div></div>"
  );


  $templateCache.put('views/device.html',
    "<h2>Device Details</h2><div id=device class=container><div class=row><div class=\"col-md-10 col-md-offset-1\"><div class=\"panel panel-default\"><div class=panel-heading><h3><strong>{{device.name}}</strong><status info=device.status></status><div class=\"label label-default\"><span ng-if=device.started>Started</span><span ng-if=!device.started>Stopped</span></div><small>{{device.id}}</small></h3></div><div class=panel-body><properties info=device.properties></properties></div></div></div></div></div>"
  );


  $templateCache.put('views/overview.html',
    "<h2>Overview</h2><div class=container><div class=row><div class=\"col-md-10 col-md-offset-1\"><div class=\"panel panel-default\"><div class=panel-heading><h3><strong>{{domain.name}}</strong><status info=domain.status></status><small>{{domain.id}}<json-source json-data=domain></json-source></small></h3></div><div class=panel-body><div class=container-fluid><div class=row><div class=col-md-12><div class=row><div class=col-md-6><div class=\"text-center overview-nav\"><a href=#/waveforms><h1 class=text-info>{{domain.applications.length}}</h1><h3 class=number-header>Waveforms</h3></a></div></div><div class=col-md-6><div class=\"text-center overview-nav\"><a href=#/deviceManagers><h1 class=text-info>{{domain.deviceManagers.length}}</h1><h3 class=number-header>Device Managers</h3></a></div></div></div></div></div><div class=row><div class=col-md-12><properties info=domain.properties can-edit=true configure=configure(properties)></properties></div></div></div></div></div></div></div></div>"
  );


  $templateCache.put('views/plot.html',
    "<div class=container><div class=row><div class=col-md-12><h2>{{sri.streamID}}</h2><dl class=dl-horizontal><dt>Waveform Id</dt><dd>{{waveformId}}</dd><dt>Component Id</dt><dd>{{componentId}}</dd><dt>Port Name</dt><dd>{{name}}</dd></dl></div></div><div class=row><div class=col-md-8><div class=\"well plot-container\"><div id=plot></div><div id=raster></div></div></div><div class=col-md-4><div class=\"panel panel-default\"><div class=panel-heading ng-click=\"showOptions = !showOptions\"><span class=glyphicon ng-class=\"{'glyphicon-chevron-down': showOptions, 'glyphicon-chevron-right': !showOptions}\"></span> Plotting Options</div><div class=panel-body ng-class=\"{'collapse': !showOptions}\"><form role=form class=form-horizontal><div class=\"checkbox col-sm-offset-2 col-sm-10\"><label><input type=checkbox ng-model=useSRISettings value=1> Use SRI settings</label></div><div class=form-group ng-repeat=\"(key, value) in plotSettings\"><label for={{key}} class=\"col-sm-2 control-label\">{{key}}</label><div class=col-sm-10><input ng-hide=useSRISettings type=number class=\"form-control input-sm\" ng-change=updateCustomSettings() ng-model=customSettings[key] id={{key}} value=\"{{value}}\"> <input ng-show=useSRISettings type=number class=\"form-control input-sm\" ng-model=customSettings[key] id={{key}} disabled=\"disabled\"></div></div></form></div></div><h4>SRI</h4><table class=table><thead><tr><th>Name</th><th>Value</th></tr></thead><tr ng-repeat=\"(name, item) in sri | orderBy:name\"><td>{{name}}</td><td>{{item}}</td></tr></table></div></div><div class=row></div></div>"
  );


  $templateCache.put('views/waveforms.html',
    "<h2>Waveforms</h2><div class=container><div class=row><div class=col-md-3><div class=\"panel panel-default\"><div class=panel-heading><div class=row><div class=col-md-7><select ng-model=selectedWaveform ng-options=\"item for item in waveforms\" class=form-control></select></div><div class=col-md-5><button class=\"btn btn-default btn-block\" ng-click=launch(selectedWaveform) ng-class=\"{'disabled': !selectedWaveform}\">Launch</button></div></div></div><ul class=\"list-group selection\"><a ng-repeat=\"item in domain.applications\" ng-click=setWaveform(item.id) ng-class=\"{'active': (setWaveform() == item.id) }\" class=list-group-item><b>{{item.name}}</b></a> <a class=list-group-item ng-hide=domain.applications><i>No Waveforms Running</i></a></ul><div class=panel-footer><div class=\"text-right text-muted\"><small>{{domain.applications.length}} Waveforms Running</small></div></div></div></div><div class=col-md-9><waveform ng-show=domain.applications.length id=currentWaveform domain-id=domain._restId></waveform><div class=\"center-block text-center text-muted\" ng-hide=domain.applications.length><div class=\"panel panel-default\"><div class=panel-body><h2><i class=\"icon-eye-close icon-3x\"></i></h2><h3>No Waveform Selected</h3><p>Try selecting one from the list on the left or launching a new one.</p></div></div></div></div></div></div>"
  );

}]);

angular.module('webSCA').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('components/redhawk/templates/component.html',
    "<div class=container-fluid><div class=row><div class=col-md-8><h6 class=list-group-item-heading><strong>{{component.name}}</strong><br><small>{{component.id}}</small></h6><div><start-status info=component.started></start-status></div></div><div class=col-md-4><div class=btn-group><div class=btn-group><button class=\"btn btn-default btn-sm dropdown-toggle\" data-toggle=dropdown><span class=\"glyphicon glyphicon-bullhorn\"></span> <span class=caret></span></button><ul class=dropdown-menu role=menu><li ng-repeat=\"port in component.ports\"><a ng-if=port.canPlot ng-class=\"{'disabled': !port.plotType}\" href=#/plot/waveform/{{component.waveform.id}}/component/{{component.id}}/port/{{port.name}}/{{port.plotType}}>{{port.name}}</a></li></ul></div><div class=btn-group><properties info=component.properties can-edit=true configure=configure(properties) compact=true></properties></div></div></div></div></div>"
  );


  $templateCache.put('components/redhawk/templates/device.html',
    "<div class=conatainer-fluid><div class=row><div class=col-md-9><h6><a href=#/manager/{{managerId}}/device/{{id}}><strong>{{device.name}}</strong></a><br><small>{{device.id}}</small></h6></div><div class=col-md-3><start-status class=pull-right info=device.started></start-status></div></div></div>"
  );


  $templateCache.put('components/redhawk/templates/file-system.html',
    "<div class=\"panel panel-default\"><div class=panel-heading><h5 class=panel-title><strong><span class=\"glyphicon glyphicon-hdd\"></span> {{filesystem.cwd || '/'}}</strong><json-source json-data=filesystem></json-source></h5></div><div class=list-group><a class=list-group-item ng-click=loadFileSystem(filesystem.parent)><span class=\"glyphicon glyphicon-circle-arrow-left\"></span> Up</a><div ng-repeat=\"item in filesystem.data.children track by $index\"><a ng-if=item.directory class=list-group-item ng-click=\"loadFileSystem(filesystem.cwd+'/'+item.name)\"><span class=\"glyphicon glyphicon-folder-open\"></span> <small>{{item.name}}</small></a><div ng-if=!item.directory class=dropdown><a class=list-group-item id=dropdownMenu-{{$id}} data-toggle=dropdown><span class=\"glyphicon glyphicon-file\"></span> <small>{{item.name}}</small> <span class=caret></span></a><ul class=dropdown-menu role=menu aria-labelledby=dropdownMenu-{{$id}}><li role=presentation ng-class=\"{'disabled': !item.canView}\"><a role=menuitem ng-click=\"fileViewer(filesystem.cwd+'/'+item.name)\"><i class=icon-code></i> File Viewer</a></li><li role=presentation class=divider></li><li role=presentation><a role=menuitem tabindex=-1 href=\"{{fileUrl(filesystem.cwd+'/'+item.name)}}\"><span class=\"glyphicon glyphicon-download\"></span> Download</a></li><li role=presentation ng-class=\"{'disabled': !item.canLaunch}\"><a role=menuitem tabindex=-1 ng-click=\"launchWaveform(filesystem.cwd+'/'+item.name, item.launchName+'-'+$id)\"><span class=\"fa fa-paper-plane\"></span> Launch</a></li></ul></div></div></div></div>"
  );


  $templateCache.put('components/redhawk/templates/file-viewer.html',
    "<div class=modal-header><button type=button class=close ng-click=close()>&times;</button><h4 class=modal-title><span class=\"glyphicon glyphicon-file\"></span> File Viewer <small>{{path}}</small></h4></div><div class=modal-body><div hljs include=path></div></div><div class=modal-footer><a class=\"btn btn-link\" href={{path}}><span class=\"glyphicon glyphicon-download\"></span> Download</a> <button type=button class=\"btn btn-default\" ng-click=close()>Close</button></div>"
  );


  $templateCache.put('components/redhawk/templates/properties.html',
    "<div ng-if=!compact><h4 ng-if=\"title === undefined ? true : title\"><i class=icon-gears></i> Properties<json-source json-data=properties></json-source></h4><div class=container-fluid onload=this.tooltip()><form role=form class=form-inline ng-submit=submit()><table class=\"table table-striped table-condensed\"><tr><th>Label</th><th>Value</th></tr><tr ng-repeat=\"prop in properties | orderBy: 'name'\" ng-class=\"{'text-muted': !prop.canEdit}\"><td data-toggle=tooltip data-placement=auto title={{prop.description.trim()}}><span>{{prop.name}} <span class=name ng-if=!prop.name>{{prop.id}}</span> <span class=\"label label-default\" ng-if=\"prop.scaType == 'simpleSeq'\">Sequence</span> <span class=\"label label-default\" ng-if=\"prop.scaType == 'struct'\">Struct</span> <span class=\"label label-default\" ng-if=\"prop.scaType == 'structSeq'\">Struct Sequence</span></span></td><td><div ng-if=\"prop.canEdit && edit\" class=form-group><select ng-if=\"prop.type == 'boolean'\" class=form-control ng-model=form[prop.id] ng-options=\"o.value as o.name for o in booleanSelectOptions\"></select><select ng-if=prop.enumerations class=form-control ng-model=form[prop.id] ng-options=\"value as label for (label, value) in prop.enumerations\"></select><input ng-if=\"prop.type != 'boolean' && !prop.enumerations\" class=form-control ng-model=form[prop.id] value=\"{{prop.value}}\"> <span ng-if=prop.definition.units>{{prop.definition.units}}</span></div><div ng-if=\"!prop.canEdit || !edit\"><span class=value ng-if=\"prop.scaType == 'simple'\">{{prop.value}}</span> <span ng-if=\"prop.scaType == 'simpleSeq'\" ng-repeat=\"item in prop.value track by $index\">{{item}}</span> <span ng-if=\"prop.scaType == 'sequence'\"><property info=prop></property></span><div ng-if=\"prop.scaType == 'struct'\"><property info=prop></property></div><div ng-if=\"prop.scaType == 'structSeq'\"><property info=prop></property></div><span ng-if=prop.definition.units>{{prop.definition.units}}</span></div></td></tr><tr ng-if=canEdit><td colspan=2><button type=submit class=\"btn btn-default\" ng-if=edit>Configure</button> <a class=\"btn btn-link\" ng-click=toggleEdit()><i ng-class=\"{'icon-unlock': edit, 'icon-lock': !edit}\"></i></a></td></tr></table></form></div></div><span ng-if=compact><button class=\"btn btn-sm btn-default\" data-toggle=modal data-target=#properties-{{$id}}><i class=icon-gears></i></button><div class=\"modal fade\" id=properties-{{$id}} tabindex=-1 role=dialog aria-labelledby=myModalLabel aria-hidden=true><div class=modal-dialog><div class=modal-content><div class=modal-header><button type=button class=close data-dismiss=modal aria-hidden=true>&times;</button><h4 class=modal-title><i class=icon-gears></i> Properties <small><json-source json-data=properties></json-source></small></h4></div><div class=modal-body><properties info=properties can-edit=canEdit configure=\"configure({properties: properties})\" title=false></properties></div><div class=modal-footer><button type=button class=\"btn btn-default\" data-dismiss=modal>Close</button></div></div></div></div></span>"
  );


  $templateCache.put('components/redhawk/templates/property.html',
    "<div ng-if=\"prop.scaType == 'simple'\" class=\"well well-sm\"><span class=name>{{prop.name}}:</span> <span class=name ng-if=!prop.name>{{prop.id}} (id)</span> <span class=value ng-class=\"{muted: !prop.canEdit}\">{{prop.value}}</span> <span ng-if=\"[prop.scaType == 'simpleSeq']\" ng-repeat=\"item in prop.value track by $index\">{{item}}</span></div><div ng-if=\"prop.scaType == 'simpleSeq'\" class=\"well well-sm\"><span class=name>{{prop.name}}:</span> <span class=name ng-if=!prop.name>{{prop.id}} (id)</span> <span class=value ng-class=\"{'text-muted': !prop.canEdit}\">{{prop.value}}</span> <span ng-if=\"prop.scaType == 'simpleSeq'\" ng-repeat=\"item in prop.value track by $index\">{{item}}</span></div><div ng-if=\"prop.scaType == 'struct'\"><dl class=dl-horizontal><span ng-repeat=\"(k,v) in prop.value\"><dt>{{k}}</dt><dd>{{v}}</dd></span></dl></div><div ng-if=\"prop.scaType == 'structSeq'\"><dl class=dl-horizontal ng-repeat=\"struct in prop.value\"><span ng-repeat=\"(k,v) in struct\"><dt>{{k}}</dt><dd>{{v}}</dd></span></dl></div>"
  );


  $templateCache.put('components/redhawk/templates/status.html',
    "<span ng-switch on=status.severity><span ng-switch-when=OK><span class=\"label label-success\">{{status.severity}}</span></span> <span ng-switch-when=WARNING><span class=\"label label-warning\">{{status.severity}}</span></span> <span ng-switch-when=ERROR><span class=\"label label-danger\">{{status.severity}}</span></span> <span ng-switch-default><span class=\"label label-default\">{{status.severity}}</span></span></span>"
  );


  $templateCache.put('components/redhawk/templates/waveform.html',
    "<div class=\"panel panel-default\"><div class=panel-heading><h3 class=panel-title><b>{{waveform.name}}</b><status info=waveform.status></status><small>{{waveform.id}}</small> <small><json-source json-data=waveform></json-source></small></h3></div><div class=panel-body><div class=container-fluid><div class=row><div class=\"col-md-6 well\"><div class=row><div class=col-md-8><h4><i class=icon-power-off></i> Status</h4></div><div class=col-md-4><start-status class=pull-right info=waveform.started></start-status></div><div class=col-md-12><div class=btn-toolbar><div class=btn-group><button class=\"btn btn-default btn-lg\" ng-if=!waveform.started ng-click=waveform.start()><span class=\"glyphicon glyphicon-play\"></span></button> <button class=\"btn btn-default btn-lg\" ng-if=waveform.started ng-click=waveform.stop()><span class=\"glyphicon glyphicon-stop\"></span></button> <button class=\"btn btn-default btn-lg\" ng-click=waveform.release()><span class=\"glyphicon glyphicon-eject\"></span></button></div></div></div></div><div class=row><div class=col-md-12><div ng-repeat=\"msg in messages\" class=alert ng-class=\"{'alert-danger': msg.is_warning, 'alert-info': !msg.is_warning}\"><small>{{msg.text}}</small></div></div></div><div class=row><div class=col-md-12><div><h4><span class=\"glyphicon glyphicon-briefcase\"></span> Components</h4><ul class=list-group><li ng-repeat=\"comp in waveform.components\" class=list-group-item><component id=comp.id waveform-id=waveform.id domain-id=domainId></component></li></ul></div><div><h4><span class=\"glyphicon glyphicon-bullhorn\"></span> Ports</h4><ul class=list-group><li ng-repeat=\"port in waveform.ports\" class=list-group-item><a ng-if=port.canPlot href=#plot/waveform/{{waveform.id}}/port/{{port.name}}/{{port.plotType}}>{{port.name}}</a></li></ul></div></div></div></div><div class=col-md-6><div><properties info=waveform.properties can-edit=true configure=configure(properties)></properties></div></div></div></div></div></div>"
  );


  $templateCache.put('components/websca/templates/add-domain.html',
    "<div class=modal-content><div class=modal-header><button type=button class=close ng-click=close()>&times;</button><h4 class=modal-title>Connect to Domain</h4></div><div class=modal-body><form class=form-horizontal role=form><div class=form-group><label for=id class=\"col-sm-2 control-label\">Id</label><div class=col-sm-10><input ng-model=id id=id class=form-control></div></div><div class=form-group><label for=name class=\"col-sm-2 control-label\">Name</label><div class=col-sm-10><input ng-model=name id=name class=form-control></div></div><div class=form-group><label for=uri class=\"col-sm-2 control-label\">URI</label><div class=col-sm-10><input ng-model=uri id=uri class=form-control></div></div></form></div><div class=modal-footer><button type=button class=\"btn btn-primary\" ng-click=\"add(id, name, uri)\">Add</button> <button type=button class=\"btn btn-default\" ng-click=close()>Close</button></div></div>"
  );


  $templateCache.put('components/websca/templates/json-source.html',
    "<div class=modal-content><div class=modal-header><button type=button class=close ng-click=close()>&times;</button><h4 class=modal-title>JSON</h4></div><div class=modal-body><div hljs source=\"json | json\" language=json></div></div><div class=modal-footer><button type=button class=\"btn btn-default\" ng-click=close()>Close</button></div></div>"
  );

}]);
