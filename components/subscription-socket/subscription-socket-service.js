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
