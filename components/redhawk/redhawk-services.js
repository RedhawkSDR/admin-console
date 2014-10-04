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

      var redhawk = {
        domainIds: null,
        domains: {}
      };

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

      var genId = (function(){
        var padZeros = function(value, digits) {
          if( value.toString().length < digits ){
            var pad = new Array( 5 ).join( '0' );
            value = ( '' + pad + value ).slice(-digits);
          }
          return value;
        };

        var id = 0;
        return function(){
          id += 1;
          return padZeros(id.toString(16), 3);
        };
      })();

      var uniqueId = function() {
        return $.makeArray(arguments).join("::");
      };

      var portDataTypeRegex = /^data(.*)$/;
      var processPorts = function(ports) {
        angular.forEach(ports, function(port) {
          var matches = portDataTypeRegex.exec(port.type);
          if(matches) {
            port.canPlot = port.direction == "Uses" && port.namespace == "BULKIO";
            if(port.canPlot)
              port.plotType = matches[1].toLowerCase();
          } else {
            port.canPlot = false;
            console.log("DEBUG: " + port + " port has unrecognized repid: " + port.repid);
          }
        });
      };

      var Domain = function(id) {
        var self = this;

        self.getEvents = function() {
          return self.events;
        };

        self._update = function(updateData) {
          if(updateData) {
            angular.extend(self, updateData);

            processPorts(self.ports);
          }
        };

        self._load = function(id) {
          self._restId = id;

          self.events = new EventChannel(id);
          self.devicemanagers = {};
          self.waveforms = {};
          self.components = {};
          self.devices = {};

          self.$promise = RedhawkREST.domain.info({domainId: self._restId}, function(data){
            self._update(data);
          }, function(data){
            notify.error("Domain "+id+" returned "+data.status);
          }).$promise;
        };
        self._reload = function() { self._load(self._restId); };

        self.configure = function(properties) {
          RedhawkREST.domain.configure({domainId: self._restId},{properties: properties});
        };

        self.getFileSystem = function(path) {
          return RedhawkREST.fileSystem.query({domainId: self._restId, path: path});
        };

        self.getEventChannels = function() {
          return RedhawkREST.domain.events({domainId: self._restId});
        };

        self.getDevice = function(id, deviceManagerId){
          var devId = uniqueId(id, deviceManagerId);
          if(!self.devices[devId]){
            self.devices[devId] = new Device(id, self._restId, deviceManagerId);
          }

          return self.devices[devId];
        };

        self.getDeviceManager = function(id) {
          if(!self.devicemanagers[id]) {
            self.devicemanagers[id] = new DeviceManager(id, self._restId);
          }

          return self.devicemanagers[id];
        };

        self.getComponent = function(id, waveformId){
          var compId = uniqueId(id, waveformId);

          if(!self.components[compId]) {
            self.components[compId] = new Component(id, self._restId, waveformId);
          }

          return self.components[compId];
        };

        self.getWaveform = function(id){
          if(!self.waveforms[id]) {
            self.waveforms[id] = new Waveform(id, self._restId);
          }

          return self.waveforms[id];
        };

        self.getLaunchableWaveforms = function() {
          if(!redhawk.availableWaveforms) {
            redhawk.availableWaveforms = [];
            redhawk.availableWaveforms.$promise =
                RedhawkREST.waveform.status({domainId: self._restId}).$promise.then(function(data){
                  angular.forEach(data['available'], function(item){
                    this.push(item['name']);
                  },redhawk.availableWaveforms);

                  return redhawk.availableWaveforms;
                }
            );
          }

          return redhawk.availableWaveforms
        };
        self.launch = function(name) {
          return RedhawkREST.waveform.launch({domainId: self._restId}, {name: name}, function(data){
            notify.success("Waveform "+data['launched']+" launched");
            self._reload();
          });
        };

        self._load(id);
      };

      redhawk.getDomain = function(id){
        if(!redhawk.domains[id])
          redhawk.domains[id] = new Domain(id);
        return redhawk.domains[id];
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

      var Waveform = function(id, domainId) {
        var self = this;

        self._update = function(updateData) {
          if(updateData) {
            angular.extend(self, updateData);

            processPorts(self.ports);
            //self.uniqueId = uniqueId(self.identifier);
          }
        };

        self._load = function(id, domainId) {
          self.$promise = RedhawkREST.waveform.query({id: id, domainId: domainId}, function(data){
            self._update(data);
            self.domainId = domainId;
          }, function(data){
            notify.error("Waveform "+id+" returned "+data.status);
          }).$promise;
        };
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
        self.configure = function(properties) {
          return RedhawkREST.waveform.configure({id: self.id, domainId: self.domainId}, {properties: properties});
        };

        self._load(id, domainId);
      };

      var Component = function(id, domainId, waveformId) {
        var self = this;

        self._update = function(updateData) {
          if(updateData) {
            angular.extend(this, updateData);

            processPorts(this.ports);
            //self.uniqueId = uniqueId(this.identifier, this.waveform.id);
          }
        };
        self._load = function(id, domainId, waveformId) {
          self.$promise = RedhawkREST.component.query({componentId: id, waveformId: waveformId, domainId: domainId}, function(data){
            self._update(data);
            self.waveform = {id: waveformId};
            self.domainId = domainId;
          }, function(data){
            notify.error("Component "+id+" returned "+data.status);
          }).$promise;
        };
        self._reload = function() { self._load(self.id, self.domainId, self.waveform.id); };

        self.configure = function(properties) {
          return RedhawkREST.component.configure(
              {componentId: self.id, waveformId: self.waveform.id, domainId: self.domainId},
              {properties: properties},
              function(){ self._reload(); }
          );
        };

        self._load(id, domainId, waveformId);
      };

      var Device = function(id, domainId, managerId) {
        var self = this;

        self._update = function(updateData) {
          if(updateData) {
            angular.extend(this, updateData);

            //self.uniqueId = uniqueId(self.identifier, self.deviceManager.id);
          }
        };
        self._load = function(id, domainId, managerId) {
          self.$promise = RedhawkREST.device.query({deviceId: id, managerId: managerId, domainId: domainId}, function(data){
            self._update(data);
            self.deviceManager = {id: managerId};
            self.domainId = domainId;
          }, function(data){
            notify.error("Device "+id+" returned "+data.status);
          }).$promise;
        };
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

      var DeviceManager = function(id, domainId) {
        var self = this;

        this._update = function(updateData) {
          if(updateData) {
            angular.extend(this, updateData);

            //self.uniqueId = uniqueId(self.identifier);
          }
        };
        self._load = function(id, domainId) {
          self.$promise = RedhawkREST.deviceManager.query({id: id, domainId: domainId}, function(data){
            self._update(data);
            self.domainId = domainId;
          }, function(data){
            notify.error("Device Manager "+id+" returned "+data.status);
          }).$promise;
        };
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

        var domain = redhawk.domains[domainId];
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
        //console.log(event);
        var element = event.ChangedElement;
        var elementType = element.eobj_type;

        var domain = redhawk.domains[event.domain];
        if(!domain) {
          //console.log(event);
          if(event.domain)
            console.log("Skipping notification for other domain '"+event.domain+"'.");
          return;
        }

        switch(elementType) {
          case "ScaWaveformFactory":
            //console.log("RedhawkDomain::NOTIF ["+elementType + "] ");
            //console.log(event);
            if(redhawk.domain)
              domain._reload();
            break;
          case "ScaWaveform":
            var waveformId = event.waveformInstance;
            console.log("RedhawkDomain::NOTIF ["+elementType + "] "+waveformId);
            console.log(event);
            if(domain.waveforms[waveformId]){
              //console.log("Updating Waveform  "+waveformId);
              domain.waveforms[waveformId]._update(element);
            }
            break;
          case "ScaComponent":
            var compId = uniqueId(event.componentInstance, event.waveformInstance);
            //console.log("RedhawkDomain::NOTIF ["+elementType + "] "+compId);
            //console.log(event);
            if(domain.components[compId]) {
              //console.log("Updating Component "+compId);
              domain.components[compId]._update(element);
            }
            break;
          case "ScaSimpleProperty":
            var path = event.Notification.path;
            //console.log("RedhawkDomain::NOTIF ["+elementType + "] "+path);
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
          url += '/waveforms/'+options.waveform;
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
