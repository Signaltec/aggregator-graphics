app.directive('sgMicroPortChart', ['charts.InfluxConnection', 'charts.PortsCharts', 'charts.Const',
  function(InfluxConnection, PortsCharts, Const) {
    'use strict';

    function isInDateRange() {

    }

    return {
      restrict: 'E',
      scope: {
        port: '=',
        config: '=',
        color: '=',
        togglePort: '&'
      },
      template: '<div class="port-name">' +
        '  <input type="checkbox" ng-model="port.checked" ng-change="togglePort(port)"/> {{port.num}}' +
        '</div>' +
        '<div class="port-graph"></div>' +
        '<div class="peaks">' +
        '  <div class="peak">{{min.rx | rateformat}} / {{max.rx | rateformat}}</div>' +
        '  <div class="peak">{{min.tx | rateformat}} / {{max.tx | rateformat}}</div>' +
        '</div>',

      link: function(scope, element) {

        var connection = new InfluxConnection(null, 'monitoring');
        var chartContainer = element[0].querySelector('.port-graph');
        var chart = new PortsCharts(chartContainer, scope.color, 0);
        var period;

        scope.max = {
          rx: 0, tx: 0
        };

        scope.min = {
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
        function updatePeaks() {
          var rxIndex = chart.getRxIndex();
          var txIndex = chart.getTxIndex();
          var startDate = new Date();
          var endDate = new Date();
          var start = startDate.setHours(scope.config.start, 0, 0, 0);
          var end = endDate.setHours(scope.config.end, 0, 0, 0);
          var range = scope.state.filter(function(d) {
            return d[0] >= start && d[0] <= end;
          });

          scope.max.rx = d3.max(range, function(d) {
            return d[rxIndex];
          }) || 0;

          scope.max.tx = d3.max(range, function(d) {
            return d[txIndex];
          }) || 0;

          scope.min.rx = d3.min(range, function(d) {
            return d[rxIndex];
          }) || 0;

          scope.min.tx = d3.min(range, function(d) {
            return d[txIndex];
          }) || 0;
        }

        // Render microChart
        function render() {
          chart.microChart(
            scope.state,
            scope.columns,
            scope.config.aggregate,
            Math.abs(scope.config.floor) * 60 * 60 * 1000
          );

          updatePeaks();
          setEmpty();
        }

        /**
         * Fetch data from InfluxDB
         * @param {number}  start config.floor
         */
        function fetch(start) {
          if (period === start) {
            return;
          }

          period = start;

          connection.query()
            .selectPorts({
              measurement: scope.config.getFloorMeasurement(),
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

        scope.$on('PortsCharts.config.changed', updatePeaks);

        scope.$on('PortsCharts.config.floorChanged', function($event, floor) {
          fetch(Math.abs(floor));
        });

        scope.$on('PortsCharts.config.aggregateChanged', render);

        fetch(Const.hHalfYear);
      }
    }
  }]
);
