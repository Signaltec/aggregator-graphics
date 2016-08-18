app.directive('sgTimeAxis', [function() {
  var hour = 60 * 60 * 1000;
  var tickFormat = d3.time.format('%e %b');

  return {
    restrict: 'E',
    scope: {
      floor: '=',
      now: '='
    },
    link: function(scope, element) {
      var width = element[0].offsetWidth;
      var height = element[0].offsetHeight;

      var svg = d3.select(element[0])
        .append('svg')
        .attr({
          width: width,
          height: height
        });

      var axis = svg.append('g').attr('class', 'axis');
      var x = d3.time.scale().range([0, width]);
      var lastDate, xAxis;

      function updateAxis() {
        lastDate = new Date(scope.now.getTime() + scope.floor * hour);
        x.domain([lastDate, scope.now]);

        xAxis = d3.svg.axis().scale(x).orient('bottom')
          .ticks(10)
          .tickFormat(tickFormat);

        axis.call(xAxis);
      }

      scope.$watch('floor', function(n, o) {
        if (n != o) {
          updateAxis();
        }
      });

      updateAxis();
    }
  }
}]);
