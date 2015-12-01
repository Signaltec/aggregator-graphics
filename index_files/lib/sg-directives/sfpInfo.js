app
  .directive('sfpInfo', function(Port, Port_numeration) {
    return {
      restrict: 'E',
      scope: {
        data: '=data',
        port_id: '=portId'
      },
      templateUrl: 'pages/include/sfp_info.html'
    };
  });
