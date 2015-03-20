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
    'ngRoute',
    'ui.bootstrap'//,
//    'hljs'
])
    .config(['$routeProvider',
        function($routeProvider) {
            $routeProvider
                .when('/overview', {
                    templateUrl: 'views/overview.html',
                    controller: 'Overview'
                })
                .when('/preferences', {
                    templateUrl: 'views/preferences.html',
                    controller: 'UserSettings'
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
    .factory('user', ['RedhawkDomain', 'RedhawkSysinfo',  function(RedhawkDomain, RedhawkSysinfo){
        var user = {
            domain: undefined,
            hosts: [ 'localhost'],
            domains: [],
            alldomains: [],
            hoststatus: {},
            sysinfo: {}
        };

        // Update sys info
        RedhawkSysinfo().then(function(data) {
            console.debug("Got sysinfo data " , data);
            user.sysinfo = data;
            user.refreshData();
        }, function(err) {
            console.warn("No sysinfo data ", err);
            user.refreshData();
        });

        // Query server with hosts list and update domains, domain
        user.refreshData = function() {
            console.debug("Refreshing locations");

            return new Promise(function(resolve, reject) {
                RedhawkDomain.getDomainIds(user.hosts, user.sysinfo.supportsRemoteLocations).then(function(data) {
                    user.setData(data);
                    resolve();
                });
            });
        };

        // Set the domains list, optionally clearing domain if not in domains list
        user.setData = function(data) {
            var i, found = false;
            var firstValid = undefined;
            var tmpdomains = [];
            var tmpstatus = {};
            this.alldomains = data;

            // Filter good domains
            for (i = 0; i < data.length; i++) {
                firstValid = firstValid || data[i].domain;

                // Filter good domains for domain list
                if (data[i].domain) {
                    tmpdomains.push(data[i]);
                } else {
                    tmpstatus[data[i].host] = {error: data[i].error};
                }

                // Does existing domain still exists?
                if (this.domain === data[i].domain) {
                    found = true;
                }
            };

            if (!this.domain || !found) {
                this.domain = firstValid;
            }

            this.domains = tmpdomains;
            this.hoststatus = tmpstatus;
            return this;
        };

        return user;
    }])
    .controller('UserSettings', ['$scope', 'user', '$timeout', 'RedhawkDomain',
        function($scope, user, $timeout, RedhawkDomain) {
            $scope.user = user;

            $scope.add_host = function(newhost) {
                if (newhost) {
                    $scope.user.hosts.push(newhost);
                    $scope.newhost = '';
                    $scope.user.refreshData();
                };
            };

            $scope.remove_host = function(index) {
                $scope.user.hosts.splice(index, 1);
                $scope.user.refreshData();
            };

        }
    ])
    .controller('Overview', ['$scope', 'RedhawkSocket',  'RedhawkDomain', 'user', '$location', 'RedhawkNotificationService',
        function($scope, RedhawkSocket, RedhawkDomain, user, $location, RedhawkNotificationService) {

            user.refreshData().then(function() {
                if (user.domains.length == 0) {
                    if (user.hosts.length == 0) {
                        RedhawkNotificationService.error('No Remote Hosts Specified: Please add a host');
                        $location.path('/preferences');
                    } else {
                        RedhawkNotificationService.info('No domains found on any of the configured hosts');
                    }
                }
            });
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
    .controller('Waveforms', ['$scope', 'RedhawkDomain', 'user', '$location', 'RedhawkNotificationService',
        function($scope, RedhawkDomain, user, $location, RedhawkNotificationService) {
            user.refreshData().then(function() {
                if (user.domains.length == 0) {
                    if (user.hosts.length == 0) {
                        RedhawkNotificationService.error('No Remote Hosts Specified: Please add a host');
                        $location.path('/preferences');
                    } else {
                        RedhawkNotificationService.info('No domains found on any of the configured hosts');
                    }
                }
            });
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
    .controller('DeviceManagers', ['$scope', 'RedhawkDomain', 'user', '$location', 'RedhawkNotificationService',
        function($scope, RedhawkDomain, user, $location, RedhawkNotificationService) {
            user.refreshData().then(function() {
                if (user.domains.length == 0) {
                    if (user.hosts.length == 0) {
                        RedhawkNotificationService.error('No Remote Hosts Specified: Please add a host');
                        $location.path('/preferences');
                    } else {
                        RedhawkNotificationService.info('No domains found on any of the configured hosts');
                    }
                }
            });
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
    .controller('Device', ['$scope', '$window', '$filter', '$routeParams', 'RedhawkDomain', 'user', '$location', 'RedhawkNotificationService',
        function($scope, $window, $filter, $routeParams, RedhawkDomain, user, $location, RedhawkNotificationService){
            user.refreshData().then(function() {
                if (user.domains.length == 0) {
                    if (user.hosts.length == 0) {
                        RedhawkNotificationService.error('No Remote Hosts Specified: Please add a host');
                        $location.path('/preferences');
                    } else {
                        RedhawkNotificationService.info('No domains found on any of the configured hosts');
                    }
                }
            });
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

            var defaultOverrides = {
                xdelta: 0,
                xstart: 0,
                ydelta: 0,
                ystart: 0,
                yunits: 0,
                xunits: 1,
                subsize: 4096
            };
            $scope.plotOverrides = angular.copy(defaultOverrides);
            console.log("plotOverrides initial values");
            angular.forEach($scope.plotOverrides, function(value, key) {
                console.log(key + " " + value);
            });

            $scope.useSRISettings = true;
            $scope.customSettings = angular.copy(defaultOverrides);

            $scope.$watch('useSRISettings', function(value) {
                if(value) {
                    $scope.customSettings = angular.copy($scope.plotOverrides);
                }
                reloadSri = true;
                $scope.updateCustomSettings();
            });

            var plot = null, raster = null, layer = undefined, layer2 = undefined;;

            var fillStyle = [
                "rgba(255, 255, 100, 0.7)",
                "rgba(255, 0, 0, 0.7)",
                "rgba(0, 255, 0, 0.7)",
                "rgba(0, 0, 255, 0.7)"
            ];

            var createPlot = function(settings) {

                plot = new sigplot.Plot(document.getElementById("plot"),
                    angular.extend(settings,
                        {
                            expand: true,
                            autol: 5,
                            autohide_panbars: true,
                            autox: 3,
                            legend: false,
                            xcnt: 0,
                            cmode: "MA",
                            colors: {bg: "#222", fg: "#888"}
                        }));
                plot.change_settings({
                    fillStyle: fillStyle
                });
            };

            var overlayPlot = function(overrides, options) {
                options = options || {};
                var optionsCopy = angular.extend(options, {layerType: sigplot.Layer1D});
                layer = plot.overlay_array(null, overrides, optionsCopy);
            };

            createPlot({});

            var createRaster = function(settings) {
                settings = settings || {};
                raster = new sigplot.Plot(document.getElementById("raster"), angular.extend(settings,
                    {
                        expand: true,
                        autol: 5,
                        autox: 3,
                        autohide_panbars: true,
                        xcnt: 0,
                        colors: {bg: "#222", fg: "#888"},
                        nogrid: true,
                        'cmode': "D2"
                    }));
                raster.change_settings({
                    fillStyle: fillStyle
                });
            };

            var overlayRaster = function(overrides) {
                //layerType defaults to Layer1D with type = 1000, so we set it explicitly to Layer2D
                var overridesCopy = angular.copy(overrides);
                layer2 = raster.overlay_pipe(angular.extend(overridesCopy, {'pipe': true, 'pipsesize': 1024 * 1024 * 5}), {layerType: sigplot.Layer2D});
            };

            createRaster();

            raster.mimic(plot, {xzoom: true, unzoom: true, xpan: true});
            plot.mimic(raster, {xzoom: true, unzoom: true, xpan: true});

            var reloadSri, useCustomSettings;

            $scope.updateCustomSettings = function() {
                useCustomSettings = !$scope.useSRISettings;
                reloadSri = true;
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

            var defaultSubsize = 1024;

            var on_data = function(data) {

                defaultSubsize = 1024;

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

                if ($scope.plotOverrides.subsize === undefined) {
                    $scope.plotOverrides.subsize = defaultSubsize;
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
                var frameSize = $scope.plotOverrides.subsize * bpa * ape;

                if (data.byteLength/bpa/ape < defaultSubsize) {
                    defaultSubsize = data.byteLength/bpa/ape;
                    $scope.plotOverrides.subsize = defaultSubsize;
                    frameSize = defaultSubsize * bpa * ape;
                    reloadSri = true;
                }
                data = data.slice(0, frameSize);
                var array = dataConverter(data);//NB the return value toggles between two different length values. Thus the data is sometimes not properly formatted
                if (plot && raster) {
                    //WORKAROUND: This check should not be necessary. Every other frame seems to have invalid format
                    // apparently containing values that are not of the type specified in dataType
                    if (array.length !== frameSize / bpa && array.length !== frameSize) {
                        //console.log("array length " + array.length + " not equal to framesize / bpa " + (frameSize / bpa));
                        return;
                    }
                    reloadPlots(array);
                }
            };

            var reloadPlots = function(data) {
                var overrides;

                if (useCustomSettings) {
                    overrides = $scope.customSettings;
                } else {
                    overrides = $scope.plotOverrides;
                }

                if (layer === undefined) {
                    overlayPlot(overrides);
                }

                if (layer2 === undefined) {
                    overlayRaster(overrides);
                }

                if (reloadSri) {
                    plot.reload(layer, data, overrides);
                    plot.refresh();
                    raster.push(layer2, data, overrides);
                    raster.refresh();
                    reloadSri = false;
                } else {
                    plot.reload(layer, data);
                    raster.push(layer2, data);
                }
            };

            var mode = '';

            var updatePlotSettings = function(data) {
                var isDirty = false;
                angular.forEach(data, function(item, key){
                    if (angular.isDefined($scope.plotOverrides[key]) && !angular.equals($scope.plotOverrides[key], item)) {
                        isDirty = true;
                        console.log("Plot settings change "+key+": "+$scope.plotOverrides[key]+" -> "+item);
                        $scope.plotOverrides[key] = item;
                    }
                });

                if(data['subsize'] === 0) {
                    $scope.plotOverrides['subsize'] = defaultSubsize;
                    $scope.plotOverrides['ydelta'] = $scope.plotOverrides.xdelta * defaultSubsize;

                }
                $scope.plotOverrides['type'] = 2000;
                $scope.plotOverrides['size'] = 1;


                var format = '';
                switch (data.mode) {
                    case 0:
                        mode = "S";
                        break;
                    case 1:
                        mode = "C";
                        break;
                    default:
                        mode = "S";
                }

                switch (dataType) {
                    case 'float':
                        format = mode + "F";
                        break;
                    case 'double':
                        format = mode + "D";
                        break;
                    case "short":
                    case "octet":
                        format = mode + "B";
                        break;
                    default:
                        format = mode + "F";
                }

                if ($scope.plotOverrides.format !== format) {
                    $scope.plotOverrides.format = format;
                    isDirty = true;
                }

                if(isDirty && $scope.useSRISettings) {
                    reloadSri = true;
                    $scope.customSettings = angular.copy($scope.plotOverrides);
                }

            };

            var sriData = {};

            var on_sri = function(sri) {

                if (typeof sri === 'string') {
                    return;
                }

                updatePlotSettings(sri);
                angular.forEach(sri, function(value, key) {
                    if(angular.isArray(value)) {
                        sriData[key] = value.join(", ");
                    }
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

            user.refreshData().then(function() {
                $scope.port = RedhawkSocket.port(
                    {domain: user.domain, waveform: $scope.waveformId, component: $scope.componentId, port: $scope.name},
                    on_data,
                    on_sri
                );
            });

            $scope.$on("$destroy", function(){
                $scope.port.close();
            })
        }
    ])
;
