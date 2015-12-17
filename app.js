/* 
  Module for retrive data from InfluxDB 0.9.x
  dependencies: d3js method d3.json
*/
function Influx(db, connection) {
  function prepareQueryUrl(query) {
    return self.connection + 'query?q=' + query + '&db=' + self.db;
  }

  if (!db) throw new Error('No InfluxDB database name (db)!');

  if (!connection) {
    if (window.location.host) {
      connection = window.location.protocol + '//' + window.location.host;  
    } else {
      connection = 'http://localhost'
    }
    connection += ':8086';
  }
  
  if (connection[connection.length - 1] != '/') {
    connection += '/'
  }
  
  var self = {
    connection: connection,
    db: db,
    query: function(query, callback) {
      /*
        Parameters: 
          query
          callback
      */
      var queryUrl = prepareQueryUrl(query);
      d3.json(queryUrl, function(error, data) {
          if (error) throw new Error(error);
          // data = data.results[0].series;
          if (data.results.length) data = data.results[0];
          callback(data);
      });      
    }
  };

  return self;
};

/*
  Function for prepare InfluxDB query
*/
function portQuery(ports, from, to, aggregate, timegroup) {  
  
  var measurment = 'traffic';
  
  // values to retrive from Databse
  var values = {
    mean: ['rx_rate_mean', 'tx_rate_mean', 'drops_rate_mean']
  };
  
  // default aggregation function is mean
  if (!aggregate) {
    aggregate = 'mean';
  }

  if (!(aggregate in values)) throw new Error("Unsupported aggregate function " + aggregate);
  
  // calculate timegroup
  if (!timegroup) timegroup = '1h';
  
  var result = '';
  result += ' SELECT ' + aggregate + '(' + values[aggregate].join('), ' + aggregate + '(') + ') ';
  result += ' FROM ' + measurment;
  result += ' WHERE time > ' + from;
  result += ' AND time < ' + to;
  result += ' AND (port = \'' + ports.join('\' OR port = \'') + '\')';
  result += ' GROUP BY time(' + timegroup + '), port';
  
  return result;
}


function PortsCharts(container, color, margin) {

  // Custom tickFormat
  var customTimeFormat = d3.time.format.multi([
      ["%H:%M", function(d) { return d.getMinutes(); }],
      ["%H:%M", function(d) { return d.getHours(); }],
      ["%e %b", function(d) { return d.getDate() != 1; }],
      ["%B", function(d) { return d.getMonth(); }],
      ["%Y", function() { return true; }]
  ]);
  
  function convertHex(hex, opacity) {
        hex = hex.replace('#','');
        r = parseInt(hex.substring(0,2), 16);
        g = parseInt(hex.substring(2,4), 16);
        b = parseInt(hex.substring(4,6), 16);

        result = 'rgba('+r+','+g+','+b+','+opacity+')';
        return result;
    }
    
    var self = {
      init: function(container, color, margin) {
          if (typeof container === 'string' ) {
            self.element = document.querySelector(container);
          } else {
            self.element = container;
          }
        
          self.margin = +margin;
        
          //console.log(container, self.element);
          self.color = color;
        
          self.width = self.element.offsetWidth - self.margin;
          self.height = self.element.offsetHeight;
          
          self.x = d3.time.scale().range([0, self.width]);
          self.y = d3.scale.linear().range([self.height/2, 0]);

          self.rx = d3.svg.area()
            .interpolate("basis")
            .x(function(d) { return self.x(d[0]); })
            .y0(self.height/2)
            .y1(function(d) { return self.y(d[1]); });

          self.tx = d3.svg.area()
            .interpolate("basis")
            .x(function(d) { return self.x(d[0]); })
            .y0(self.height/2)
            .y1(function(d) { return self.y(-d[2]); });
        
          // clear
          d3.select(container).select('svg').remove();
        
          self.svg = d3.select(container).append("svg")
            .attr("width", self.width + self.margin)
            .attr("height", self.height)
            .append("g")
            .attr("transform", "translate("  + self.margin + ",0)");

      },
      microChart: function(portData) {

        if (!portData || !portData.length) return;
        self.portData = portData;
        //console.log('1----', portData);
        
        portData.forEach(function(d) {
          d[0] = new Date(d[0])
        });
        
        self.x.domain(d3.extent(portData, function(d) { return d[0]; }));

        var yMax = d3.max(portData, function(d) { return d3.max([d[1],d[2]]); });
        
        if (yMax > 0) {

          self.y.domain([0,yMax]);

          // HARD clear
          d3.select(self.element).select('svg').remove();
          
          self.svg = d3.select(container).append("svg")
                .attr("width", self.width + self.margin)
                .attr("height", self.height)
                .append("g")
                .attr("transform", "translate("  + self.margin + ",0)");


          var elem = self.svg.append("g").attr("class", "elem");

          // Draw RX
          elem.append("path")
            .attr("class", "area")
            .attr("d", function(d) { return self.rx(portData); })
            .attr("fill", convertHex(self.color, 0.4));

          // Draw TX
          elem.append("path")
            .attr("class", "area tx")
            .attr("d", function(d) { return self.tx(portData); })
            .attr("fill", convertHex(self.color, 0.4));

          // Draw errors
          self.svg.selectAll(".dot")
         .data(portData)
         .enter().append("circle")
         .attr("class", "dot")
         .attr("r", function(d) { return (d[2] + d[3])* self.height * (0.02); })
         .attr("cx", function(d) { return self.x(d[0]); })
         .attr("cy", self.height/2 );
        
        } else {
          console.log('Empty data set');
        }      
      },
      multiChart: function(series, names) {
                
        console.log('multi', series);
        
        if (!series || !series.length) {
          console.log('Empty data set');
          return;
        }
        
        self.series = series;
        
        // prepare dates
        series.forEach(function(s) {
          s.values.forEach(function(d) {
            d[0] = new Date(d[0]);
          });
        });

        self.x.domain(d3.extent(series[0].values, function(d) { return d[0]; }));

        var yMax = d3.max(series, function(c) { 
          return d3.max(c.values, function(v) { 
            return d3.max([v[1],v[2]]); 
          }); 
        });
                      
          // HARD clear
          d3.select(self.element).select('svg').remove();
          self.svg = d3.select(container).append("svg")
                .attr("width", self.width + self.margin)
                .attr("height", self.height)
                .append("g")
                .attr("transform", "translate("  + self.margin + ",0)");  
          
          self.y.domain([0, yMax]);
          
          // Draw axis
          self.xa = self.svg.append("g").attr("class", "x axis");
          self.ya = self.svg.append("g").attr("class", "y axis");
          
          self.xAxis = d3.svg.axis().scale(self.x).orient("bottom").tickFormat(customTimeFormat).ticks(10);
          self.xa.attr("transform", "translate(0," + self.height/2 + ")").call(self.xAxis);

          
          var axisScale = d3.scale.linear().domain([-yMax,yMax]).range([0,self.height]);
          
          self.yAxis = d3.svg.axis().scale(axisScale).orient("left").ticks(8).tickFormat(function(d) {return Math.abs(d); });
          self.ya.attr("transform", "translate(" + 0 + ",0)").call(self.yAxis);          

          var elem;
          
          for (var i = 0; i < series.length; i++)  {
          
            console.log('--', series.length, i, names[i], self.color(names[i]));
            
            elem = self.svg.append("g").attr("class", "elem");

            // Draw RX
            elem.append("path")
              .attr("class", "area")
              .attr("d", function(d) { return self.rx(series[i].values); })
              .attr("fill", convertHex(self.color(names[i]), 0.3));

            // Draw TX
            elem.append("path")
              .attr("class", "area tx")
              .attr("d", function(d) { return self.tx(series[i].values); })
              .attr("fill", convertHex(self.color(names[i]), 0.3));

            // Draw errors
            elem.selectAll(".dot")
           .data(series[i].values)
           .enter().append("circle")
           .attr("class", "dot")
           .attr("r", function(d) { return (d[2] + d[3])* self.height * (0.02); })
           .attr("cx", function(d) { return self.x(d[0]); })
           .attr("cy", self.height/2 );
            
          }
          
          self.svg.append("text")
            .attr("y", 20)
            .text("RX");
          
          self.svg.append("text")
            .attr("y", self.height - 10)
            .text("TX");          
          
      
      }
      
    };    
  
    self.init(container, color, margin);
    return self;
  }

/* ----------------------------------------------------- */

var app = angular.module("app",['ngAnimate','ngRoute','ngSanitize','uiSlider']);

app.controller("AppCtrl", function($rootScope, $window, $location, $filter, $http, $timeout) {

});

app.controller("aggregatorGraphicsCtrl", function($scope, $window, $timeout) {
  
  var timeoutPromise;
  
  function getPorts() {
    var count = 40;
    var result = [], num;
    for(var i = 0; i < count; i++) {
      num = i + 1;
      result.push({
        num: num, 
        name: 'port' + num, 
        checked: false
      });
    }
    return result;
  }
  
  /* TODO: make directive if possible */
  function drawSelection() {
    var mc = document.querySelector('.ports-microcharts');
    var selection = document.querySelector('.ports-microcharts .selection');
    
    var pointers = document.querySelectorAll('slider .pointer');
    if (pointers.length > 1) {
      selection.style.top = 0;
      selection.style.height = mc.offsetHeight + 'px';
      selection.style.left = (pointers[0].offsetLeft + 80) + 'px';
      selection.style.width = (pointers[1].offsetLeft - pointers[0].offsetLeft) + 'px';
    }
  }  
  
  // Show/hide empty ports on ports-nav & micro-ports
  $scope.toggleEmpty = function() {
    $scope.ports.map(function(i) {
      if ($scope.hideEmpty && i.empty) {
        i.hide = true;
        i.checked = false;
      } else {
        i.hide = false;
      }
    });
  };

  $scope.updateBigPortChart = function() {
    if ($scope.summarize) {
      $scope.$broadcast('updateBigPortChart', {summarize: true});
    } else {
      $scope.$broadcast('updateBigPortChart');
    }
  };
  
  $scope.reload = function() {
    $window.location.reload();
  };
  
  // TODO: move to var
  $scope.timeNav = {
    start: -40,
    end: 0,
    floor: -366,
    ceiling: 0,
    aggregate: 'max',
    /* My own properties */
    now: new Date(),
    hour: 60 * 60 * 1000,
    format: "D MMM",
    formatDate: function(delta) {
      var res = new Date(this.now - (-delta * this.hour));
      res = moment(res).format(this.format); 
      return res;
    },
    changeFloor: function(floor) {
      $scope.timeNav.floor = floor;
      
      if ($scope.timeNav.start < floor) {
        $scope.timeNav.start = floor;
      }
      if ($scope.timeNav.end < floor) {
        $scope.timeNav.end = floor;
      }

    },
    changed: function() {
      console.log('changed timeNav');
      drawSelection();
      var r = {start: $scope.timeNav.start, end: $scope.timeNav.end};
      if ($scope.summarize) {
        r.summarize = true;
      }
      $scope.$broadcast('updateBigPortChart', r);
    }
  };  

  // Init
  $scope.ports = getPorts();
  $scope.portColors = d3.scale.category10();
  $scope.portColors.domain( $scope.ports.map(function(i) {return i.name;}) );
  
  $scope.$watch('timeNav.start + timeNav.end + timeNav.floor + timeNav.ceiling', function() {
     $timeout.cancel(timeoutPromise);
     timeoutPromise = $timeout(function() {
        $scope.timeNav.changed();
     }, 200);
  });

});

// microPortChart
app.directive("microPortChart", function($timeout) {
  'use strict';

  return {
    restrict: "E",
    scope: {
      port: '=',
      timeNav: '=',
      color: '='
    },
    template: '<div class="port-name"><input type="checkbox" ng-model="port.checked"' + 
    ' ng-change="updateBigPortChart()" /> {{port.num}}</div>' +
        '<div class="port-graph"></div>',
    link: function(scope, element, attrs) {
      
      var influx = new Influx('monitoring');
      var chartContainer = element[0].querySelector('.port-graph');
      var chart = new PortsCharts(chartContainer, scope.color, 0);
      var timegroup = '1h';
      var timeoutPromise, query;
      
      function drawMicroChart() {
           $timeout.cancel(timeoutPromise);
           timeoutPromise = $timeout(function() {
             
              timegroup = (scope.timeNav.floor < -1000) ? '10h' : '1h';
             
              query = portQuery([scope.port.name],'now() - ' + Math.abs(scope.timeNav.floor) + 'h','now()','mean',timegroup);

              scope.updateBigPortChart = function() {
                scope.timeNav.changed();
              };

              influx.query(query, function(result) {
                result = result.series[0].values;
                scope.port.empty = result.every(function(i) {return (i[1] + i[2]) === 0;});
                chart.microChart(result);
              });
           }, 10);
      }
      
      drawMicroChart();
      
      scope.$watch('timeNav.floor', function(n, o) {
         if (n != o) {
           drawMicroChart();
         }
      });
          
    }
  }
});

// bigPortChart
app.directive("bigPortChart", function() {
  'use strict';

  return {
    restrict: "E",
    scope: {
      ports: '=',
      timeNav: '=',
      color: '='
    },
    template: '<div class="port-graph"></div>',
    link: function(scope, element, attrs) {
      
      var influx = new Influx('monitoring');
      var chartContainer = element[0].querySelector('.port-graph');
      var chart = new PortsCharts(chartContainer, scope.color, 70);
      var names;
      var timegroup;
      var start, end
      var len, sum;
      
      scope.$on('updateBigPortChart', function (event, data) {
        
        if (data && Math.abs(+data.start + (+data.end)) > 0) {
          start = +data.start;
          end = +data.end;
        } else {
          start = +scope.timeNav.start;
          end = +scope.timeNav.end;
        }

            names = [];  
          
            scope.ports.forEach(function(d) {
              if (d.checked) names.push(d.name);
            });
          
            console.log('Update --', names);
          
            // calculate timegroup for min 300 points in minutes
            timegroup = Math.floor(Math.abs(end - start) * 60 / 200 );
            if (timegroup < 10) {
              timegroup = 10;
            }
            timegroup += 'm';
            
            var query = portQuery(names ,'now() - ' + Math.abs(start) + 'h' ,'now() - ' + Math.abs(end) + 'h', 'mean', timegroup);
            console.log(query, timegroup);

            influx.query(query, function(result) {
              console.log('-90-', result);
    
              // summarize
              if (data && data.summarize && result.series.length > 1) {
                
                len = result.series.length;
                result.series[0].values.forEach(function(d, index) {
                  for (var j = 1; j < 4; j++) {
                    sum = 0;
                    for(var i = 1; i < len; i++) {
                      sum += +result.series[i].values[index][j];
                    }
                    d[j] += sum;
                  }
                });
                
                result.series = [result.series[0]];
              }

              chart.multiChart(result.series, names);
            });

      });

    }
  }
});

app.directive("timeAxis", function() {
  var hour = 60 * 60 * 1000;

  return {
    restrict: "E",
    scope: {
      floor: "=",
      now: "="
    },
    link: function(scope, element, attrs) {
      
      var width = element[0].offsetWidth;
      var height = element[0].offsetHeight;
      var svg = d3.select(element[0])
        .append("svg")
        .attr("width", width)
        .attr("height", height);
      var axis = svg.append("g").attr("class", "axis");

      var x = d3.time.scale().range([0, width]);
      var lastDate, xAxis;

      scope.$watch('floor', function(n,o) {
        if (n != o) {
          lastDate = new Date(scope.now - (-scope.floor * hour));
          x.domain([lastDate, scope.now]);

          xAxis = d3.svg.axis().scale(x).orient("bottom")
            .tickFormat(d3.time.format("%e %b"));

          axis.call(xAxis);
        }
      });
    }
  }
});

