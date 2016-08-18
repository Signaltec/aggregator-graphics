
app.directive('sgBigPortChart', [
  '$timeout', 'charts.InfluxConnection', 'charts.PortsCharts', 'charts.Const',
  function($timeout, InfluxConnection, PortsCharts, Const) {
    'use strict';

    var connection = new InfluxConnection(null, 'monitoring');
    var measurements = {};
    measurements[Const.hHalfYear] = 'd1';
    measurements[Const.hWeek] = 's10';

    function getPortNames(ports) {
      return ports.map(function(d) {
        return d.name;
      });
    }

    function getCheckedPortNames(ports) {
      return ports
        .filter(function(d) {
          return d.checked;
        })
        .map(function(d) {
          return d.name;
        });
    }

    return {
      restrict: 'E',
      scope: {
        ports: '=',
        config: '=',
        summarize: '=',
        color: '='
      },
      template: '<div class="port-graph"></div>',
      link: function(scope, element) {
        var chartContainer = element[0].querySelector('.port-graph');
        var chart = new PortsCharts(chartContainer, scope.color, 70);
        var timeout;

        scope.names = getPortNames(scope.ports);

        // Render Big Chart
        function render() {
          chart.multiChart(scope.state, scope.columns, scope.names, scope.config.aggregate);
        }

        // Fetch data from InfluxDB
        function fetch() {
          var checkedNames = getCheckedPortNames(scope.ports);
          var start, end, selectConf, query, timeGroup;

          scope.state = null;
          scope.columns = null;

          if (!checkedNames.length) {
            render();
            return;
          }

          start = Math.abs(scope.config.start);
          end = Math.abs(scope.config.end);
          query = connection.query();
          timeGroup = Math.max(1, Math.round((start - end) / 300)) + 'h';

          selectConf = {
            measurement: 'h1',
            ports: checkedNames,
            timeFrom: 'now() - ' + start + 'h',
            timeTo: 'now() - ' + end + 'h'
          };

          if (scope.summarize) {
            query.selectPortsSum(selectConf);
          } else {
            query.selectPortsGrouped(selectConf);
          }

          query.groupByTime(timeGroup);


          if (!scope.summarize) {
            query.groupBy(['port'], true)
          }

          query
            .fetch()
            .then(function(result) {
              if (result.series) {
                scope.state = result.series;
                scope.columns = result.series[0].columns;
              }

              render();
            });
        }

        scope.$on('PortsCharts.portToggled', function($event, port, ports) {

          /* Порты переприсваиваются из-за баги в ангуляре:
           когда ловится ивент с измененеим в наружном скоупе,
           внутренний скоуп не успевает обновится до этого состояния. */
          scope.ports = ports;
          fetch();
        });

        scope.$on('PortsCharts.summarizeChanged', function($event, value) {
          /* См. описание баги выше */
          scope.summarize = value;
          fetch();
        });

        scope.$on('PortsCharts.config.changed', function() {
          $timeout.cancel(timeout);
          timeout = $timeout(fetch, 300);
        });

        scope.$on('PortsCharts.config.aggregateChanged', render);
        scope.$on('PortsCharts.config.floorChanged', fetch);

        fetch();
      }
    }
  }]
);
