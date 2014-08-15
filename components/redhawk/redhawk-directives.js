/**
 * Directives for REDHAWK
 */
angular.module('redhawkDirectives', ['RecursionHelper', 'webSCAServices', 'ui.bootstrap'])
    .factory('PropertyProcessorService', ['RecursionHelper', function(RecursionHelper) {
      return {
        compile: function (element) {
          return RecursionHelper.compile(element, function (scope, element, attrs) {

            scope.$watch("properties",function(newValue, oldValue) {
              scope.form = {};
              angular.forEach(scope.properties, function (prop) {

                prop.canEdit = false;
                if(prop.scaType == 'simple')
                  prop.canEdit = prop.mode != 'readonly' && prop.kinds.indexOf('configure') > -1;

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
    .directive('fileSystem', ['RedhawkConfig','RedhawkDomain', '$modal',
      function(RedhawkConfig, RedhawkDomain, $modal){
      return {
        restrict: 'E',
        scope: {
          domainId: '='
        },
        templateUrl: 'components/redhawk/templates/file-system.html',
        link: function(scope, element, attrs) {
          var viewablePattern = /\.(xml|py)$/i;
          var launchablePattern = /\.xml$/i;

          scope.$watch('domainId', function(){
            scope.loadFileSystem('');
          });

          scope.loadFileSystem = function(branch) {
            var data = RedhawkDomain.getDomain(scope.domainId).getFileSystem(branch);
            data.$promise.then(function(newData) {
              angular.forEach(newData.children, function(value) {
                value.canView = viewablePattern.test(value.name) && !value.directory;
              });
              angular.forEach(newData.children, function(value) {
                value.canLaunch = launchablePattern.test(value.name) && !value.directory;
                if(value.canLaunch)
                  value.launchName = value.name.replace(/\./g, '_');
              });

              var parent = '/';
              if(!angular.equals(branch, '/')) {
                parent = branch.substring(0, branch.lastIndexOf('/'));
              }

              scope.filesystem = {
                cwd: branch,
                parent: parent,
                data: newData
              };
            });
          };

          scope.fileUrl = function(path) {
            return RedhawkConfig.restUrl + '/domains/' + scope.domainId + '/fs' + path;
          };

          scope.launchWaveform = function(fileName) {
            RedhawkDomain.getDomain(scope.domainId).launch(fileName);
          };

          scope.fileViewer = function(path) {
            var url = scope.fileUrl(path);
            $modal.open({
              templateUrl: 'components/redhawk/templates/file-viewer.html',
              controller: function ($scope, $modalInstance) {
                $scope.path = url;
                $scope.close = function() {
                  $modalInstance.close();
                }
              },
              size: 'lg'
            });
          }
        }
      }
    }])
;