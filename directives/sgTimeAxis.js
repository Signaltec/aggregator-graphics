app.directive('sgTimeAxis', function() {
  var hour = 60 * 60 * 1000;

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

      scope.$watch('floor', function(n, o) {
        var lastDate, xAxis;

        if (n != o) {
          lastDate = new Date(scope.now + scope.floor * hour);
          x.domain([lastDate, scope.now]);

          xAxis = d3.svg.axis().scale(x).orient('bottom')
            .tickFormat(d3.time.format('%e %b'));

          axis.call(xAxis);
        }
      });
    }
  }
});
