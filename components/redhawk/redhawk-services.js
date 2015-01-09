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
