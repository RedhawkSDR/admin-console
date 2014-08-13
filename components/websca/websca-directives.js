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
  .directive('jsonSource', ['$modal', function($modal) {
    return {
      restrict: 'E',
      scope: {
        jsonData: "="
      },
      template: '<button class="btn btn-sm btn-link" ng-click="openViewer()"><small><span class="glyphicon glyphicon-barcode"></span></small></button>',
      link: function($scope, $element, $attr) {
        $scope.openViewer = function() {
          var json = $scope.jsonData;
          $modal.open({
            templateUrl: 'components/websca/templates/json-source.html',
            controller: function ($scope, $modalInstance) {
              $scope.json = json;
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