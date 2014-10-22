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

angular.module('webSCA', ['webSCAConfig', 'redhawkServices', 'webSCADirectives', 'redhawkDirectives', 'ngRoute', 'ui.bootstrap', 'hljs'])
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
  .config(function (hljsServiceProvider) {
    hljsServiceProvider.setOptions({
      // replace tab with 4 spaces
      tabReplace: ' '
    });
  })
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
  .controller('UserSettings', ['$scope', '$modal', 'user', '$timeout', 'RedhawkDomain',
    function($scope, $modal, user, $timeout, RedhawkDomain){
      $scope.user = user;
      $scope.domains = RedhawkDomain.getDomainIds();
    }
  ])
  .controller('Overview', ['$scope', 'RedhawkSocket',  'RedhawkDomain', 'user',
    function($scope, RedhawkSocket, RedhawkDomain, user) {
      $scope.user = user;
      $scope.$watch('user.domain', function(domainId){
        if(!domainId) return;

        $scope.redhawk = RedhawkDomain.getDomain(domainId);
        var events = $scope.redhawk.getEvents();

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
      $scope.redhawk = RedhawkDomain.getDomain(domainId);

      $scope.waveforms = $scope.redhawk.getLaunchableWaveforms();

      $scope.currentWaveform = null;
    });

    $scope.$watch('redhawk.waveforms', function(waveforms){
      if(waveforms.length)
        $scope.setWaveform(waveforms[0].id);
    });

    $scope.setWaveform = function(id) {
      if(id)
        $scope.currentWaveform = id;
      return $scope.currentWaveform;
    };

    $scope.launch = function(name) {
      $scope.redhawk.launch(name).$promise.then(function(waveform){
        $scope.redhawk.$promise.then(function(){
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
          if (array.length !== frameSize / bpa) {
            return;
          }
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
                createPlot(mode + "F", $scope.plotSettings);
                createRaster(mode + "F", $scope.plotSettings);
                raster.mimic(plot, {xzoom: true, unzoom: true});
                console.log("Create plots with format " + mode + "F");
                break;
              case "double":
                createPlot(mode + "D", $scope.plotSettings);
                createRaster(mode + "D", $scope.plotSettings);
                raster.mimic(plot, {xzoom: true, unzoom: true});
                console.log("Create plots with format " + mode + "D");
                break;
              case "short":
              case "octet":
                createPlot(mode + "B", $scope.plotSettings);
                createRaster(mode + "B", $scope.plotSettings);
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
