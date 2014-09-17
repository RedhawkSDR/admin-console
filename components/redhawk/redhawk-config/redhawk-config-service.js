angular.module('RedhawkConfig', [])
  .provider('RedhawkConfig', [function(){
    var getWSBasePath = function() {
      var loc = window.location, new_uri;
      if (loc.protocol === "https:") {
        new_uri = "wss:";
      } else {
        new_uri = "ws:";
      }
      new_uri += "//" + loc.host;

      return new_uri;
    };

    this.restPath = '/rh/rest';
    this.wsPath = '/rh/rest';
    this.websocketUrl = getWSBasePath() + this.wsPath;
    this.restUrl = this.restPath;

    this.setLocation = function(host, port, basePath) {
      this.restUrl = "http://" + host + (port? ':'+port: '') + (basePath? '/'+basePath: '') + this.restPath;
      this.websocketUrl = 'ws://'+ host + (port? ':'+port: '') + (basePath? '/'+basePath: '') + this.wsPath;
    };

    var provider = this;
    this.$get = function() {
      return {
        restPath: provider.restPath,
        websocketPath: provider.wsPath,
        websocketUrl: provider.websocketUrl,
        restUrl: provider.restUrl
      };
    };
  }]);