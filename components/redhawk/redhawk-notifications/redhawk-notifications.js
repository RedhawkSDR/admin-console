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
angular.module('redhawk-notifications', [])
  .service('RedhawkNotificationService', [function(){
    var self = this;

    self._messages = [];
    self._callbacks = [];

    var Msg = function(severity, text) {
      return {
        severity: severity,
        text: text
      };
    };

    self.addListener = function(callbackFn) {
      var index = $.inArray(callbackFn, self._callbacks);
      if(index < 0)
        self._callbacks.push(callbackFn);
    };
    self.removeListener = function(callbackFn) {
      var index = $.inArray(callbackFn, self._callbacks);
      if(index > -1)
        self._callbacks = self._callbacks.splice(index, 1);
    };
    self._callListeners = function(msg){
      angular.forEach(self._callbacks, function(fn){
        fn.call(null, msg);
      });
    };

    self.msg = function(severity, text) {
      self._callListeners(new Msg(severity, text));
    };

    self.error = function(text) {
      self.msg("danger", text);
    };
    self.info = function(text) {
      self.msg("info", text);
    };
    self.success = function(text) {
      self.msg("success", text);
    };
  }])
  .directive('redhawkNotification',['RedhawkNotificationService',
    function(RedhawkNotificationService) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          element.append('<div id="redhawk-notification" class="notifications bottom-right"></div>');

          RedhawkNotificationService.addListener(function(msg){
            scope.addAlert(msg.severity, msg.text);
          });

          scope.addAlert = function(severity, message){
            console.log("["+severity.toUpperCase()+"] :: "+message);
            $('#redhawk-notification').notify({
              message: {text: message},
              type: severity,
              fadeOut: {enabled: true, delay: 3000}
            }).show();
          }
        }
      };
    }])
;
