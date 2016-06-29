app.directive('sgMicroPortChart', ['charts.InfluxConnection', 'charts.PortsCharts',
  function(InfluxConnection, PortsCharts) {
    'use strict';

    function isInDateRange() {

    }

    return {
      restrict: 'E',
      scope: {
        port: '=',
        timeNav: '=',
        color: '=',
        togglePort: '&'
      },
      template: '<div class="port-name">' +
        '  <input type="checkbox" ng-model="port.checked" ng-change="togglePort(port)"/> {{port.num}}' +
        '</div>' +
        '<div class="port-graph"></div>' +
        '<div class="max">{{max.rx | rateformat}}</div>' +
        '<div class="max">{{max.tx | rateformat}}</div>',

      link: function(scope, element) {

        var connection = new InfluxConnection(null, 'monitoring');
        var chartContainer = element[0].querySelector('.port-graph');
        var chart = new PortsCharts(chartContainer, scope.color, 0);
        var period;

        scope.max = {
          rx: 0, tx: 0
        };

        /**
         * Установка в порт флага, который обозначает, что все rx и tx данные 0 или не существуют
         */
        function setEmpty() {
          var rxIndex = chart.getRxIndex();
          var txIndex = chart.getTxIndex();

          scope.port.empty = !scope.state.some(function(item) {
            return item[rxIndex] || item[txIndex];
          });
        }

        /**
         * Обновление максимальных значений rx и tx на интервале
         */
        function updateMax() {
          var rxIndex = chart.getRxIndex();
          var txIndex = chart.getTxIndex();
          var startDate = new Date();
          var endDate = new Date();
          var start = startDate.setHours(scope.timeNav.start, 0, 0, 0);
          var end = endDate.setHours(scope.timeNav.end, 0, 0, 0);
          var range = scope.state.filter(function(d) {
            return d[0] >= start && d[0] <= end;
          });

          scope.max.rx = d3.max(range, function(d) {
            return d[rxIndex];
          }) || 0;

          scope.max.tx = d3.max(range, function(d) {
            return d[txIndex];
          }) || 0;
        }

        // Render microChart
        function render() {
          chart.microChart(
            scope.state,
            scope.columns,
            scope.timeNav.aggregate,
            Math.abs(scope.timeNav.floor) * 60 * 60 * 1000
          );

          updateMax();
          setEmpty();
        }

        /**
         * Fetch data from InfluxDB
         * @param {number}  start timeNav.floor
         */
        function fetch(start) {
          if (period === start) {
            return;
          }

          period = start;

          connection.query()
            .selectPorts({
              measurement: scope.timeNav.getFloorMeasurement(),
              ports: [scope.port.name],
              timeFrom: 'now() - ' + period + 'h',
              timeTo: 'now()'
            })
            .fetch()
            .then(function(result) {
              if (result.series) {
                scope.state = result.series[0].values;
                scope.columns = result.series[0].columns;

                scope.$apply(render);
              }
            });
        }

        scope.$on('PortsCharts.timeNav.changed', updateMax);

        scope.$on('PortsCharts.timeNav.floorChanged', function($event, floor) {
          fetch(Math.abs(floor));
        });

        scope.$on('PortsCharts.timeNav.aggregateChanged', render);

        fetch(CONST.hHalfYear);
      }
    }
  }]
);