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
