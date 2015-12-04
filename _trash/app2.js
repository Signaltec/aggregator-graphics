
/* ----------------------------------------------------- */


var app = angular.module("app",['ngAnimate','ngRoute','uiSlider','ngSanitize']);

app.controller("AppCtrl", function($rootScope, $window, $location, $filter, $http, $timeout) {

});

app.controller("aggregatorGraphicsCtrl", function($scope, $location, $route, $window, $timeout) {
  
  var charts = []; 
  var chart, query;
  
  function getPorts() {
    var count = 2;
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
  
  $scope.reload = function() {
    $window.location.reload();
  };
  
   
  // Init
  $scope.ports = getPorts();

  $scope.timeNav = {
    start: -40,
    end: 0,
    floor: -366,
    ceiling: 0,
    /* My own properties */
    now: new Date(),
    hour: 60 * 60 * 1000,
    format: "D MMM",
    formatDate: function(delta) {
      var res = new Date(this.now - (-delta * this.hour));
      res = moment(res).format(this.format); 
      return res;
    }
  };

  function drawSelection() {
    var mc = document.querySelector('.micro-charts');
    var selection = document.querySelector('.micro-charts .selection');
    
    var pointers = document.querySelectorAll('slider .pointer');
    if (pointers.length > 1) {
      selection.style.top = 0;
      selection.style.height = mc.offsetHeight + 'px';
      selection.style.left = (pointers[0].offsetLeft + 10) + 'px';
      selection.style.width = (pointers[1].offsetLeft - pointers[0].offsetLeft) + 'px';
    }
  }
  
  $scope.timeNavChange = function() {
    console.log('changed');
    drawSelection();
  
  };
  
  // Wait 500 ms before show selection  
  $timeout(function() {
    drawSelection();
  }, 500);
  
  
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
      var lastDate = new Date(scope.now - (-scope.floor * hour));
      
      var x = d3.time.scale().range([0, width]);
      x.domain([lastDate, scope.now]);

      var xAxis = d3.svg.axis().scale(x).orient("bottom")
        .tickFormat(d3.time.format("%e %b"));
      
      var svg = d3.select(element[0])
        .append("svg")
        .attr("width", width)
        .attr("height", height);
      
      svg.append("g").attr("class", "axis").call(xAxis);      
    }
  }
});



