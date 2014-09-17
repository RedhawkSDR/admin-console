angular.module('RedhawkREST', ['ngResource', 'RedhawkConfig'])
  .service('RedhawkREST', ['$resource', 'RedhawkConfig', function($resource, RedhawkConfig) {
    this.domain = $resource(RedhawkConfig.restUrl + '/domains', {}, {
      query: {method: 'GET'},
      add: {method: 'POST'},
      info: {method: 'GET', url: RedhawkConfig.restUrl + '/domains/:domainId'},
      configure: {method: 'PUT', url: RedhawkConfig.restUrl + '/domains/:domainId/configure'},
      events: {method: 'GET', url: RedhawkConfig.restUrl + '/domains/:domainId/eventChannels', isArray:true}
    });
    this.fileSystem = $resource(RedhawkConfig.restUrl + '/domains/:domainId/fs/:path', {}, {
      query: {method: 'GET'}
    });
    this.deviceManager = $resource(RedhawkConfig.restUrl + '/domains/:domainId/deviceManagers/:id', {}, {
      query: {method: 'GET'}
    });
    this.device = $resource(RedhawkConfig.restUrl + '/domains/:domainId/deviceManagers/:managerId/devices/:deviceId', {}, {
      query: {method: 'GET'}
    });
    this.waveform = $resource(RedhawkConfig.restUrl + '/domains/:domainId/waveforms', {}, {
      query:     {method: 'GET',    url: RedhawkConfig.restUrl + '/domains/:domainId/waveforms/:id'},
      status:    {method: 'GET',    url: RedhawkConfig.restUrl + '/domains/:domainId/waveforms'},
      launch:    {method: 'POST',   url: RedhawkConfig.restUrl + '/domains/:domainId/waveforms'},
      release:   {method: 'DELETE', url: RedhawkConfig.restUrl + '/domains/:domainId/waveforms/:id'},
      update:    {method: 'POST',    url: RedhawkConfig.restUrl + '/domains/:domainId/waveforms/:id'},
      configure: {method: 'PUT',    url: RedhawkConfig.restUrl + '/domains/:domainId/waveforms/:id/properties'}
    });
    this.component = $resource(RedhawkConfig.restUrl + '/domains/:domainId/waveforms/:waveformId/components/:componentId', {}, {
      query: {method: 'GET'},
      configure: {method: 'PUT', url: RedhawkConfig.restUrl + '/domains/:domainId/waveforms/:waveformId/components/:componentId/properties'}
    });
  }]);