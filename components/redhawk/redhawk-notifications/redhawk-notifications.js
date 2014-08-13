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
              fadeOut: {enabled: true, delay: 10000}
            }).show();
          }
        }
      };
    }])
;