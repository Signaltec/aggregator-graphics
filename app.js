// Position value inside returned from Influx dataset
var valuePosition = {
  rx: {mean: 7, max: 6},
  tx: {mean: 9, max: 8},
  drops: {mean: 4, max: 3},
  crc: {mean: 2, max: 1}
};

var dataRatio = {
  errors: 0.2
};

var CONST = {
  pointsPerGraph: 300,
  hWeek: 24 * 14,
  hHalfYear: 183 * 24,
  msHalfYear: 183 * 24 * 60 * 60 * 1000
};

/* ----------------------------------------------------- */

var app = angular.module('app', ['ngAnimate', 'ngRoute', 'ngSanitize', 'rzModule']);

app.controller('AppCtrl', function($rootScope, $window, $location, $filter, $http, $timeout) {

});

app.controller('aggregatorGraphicsCtrl', function($scope, $window, $timeout) {
  var emptyPortsSelection;

  $scope.CONST = CONST;

  function getPorts() {
    // default 64
    var count = 64;
    var result = [], num;
    for (var i = 0; i < count; i++) {
      num = i + 1;
      result.push({
        num: num,
        name: 'port' + num,
        checked: false
      });
    }

    emptyPortsSelection = result.every(function(i) {
      return !i.cheked
    });

    if (emptyPortsSelection) result[0].checked = true;

    return result;
  }

  /**
   * Отрисовка прямоугольника выделенного диапазона дат/времени на превьюшках портов
   */
  function drawSelection() {
    var selection = document.querySelector('.ports-microcharts .selection');
    var slider = document.querySelector('.rzslider');
    var minPointer = slider.querySelector('.rz-pointer-min');
    var maxPointer = slider.querySelector('.rz-pointer-max');
    var leftOffset = minPointer.offsetLeft;
    var width = (maxPointer.offsetLeft - leftOffset) + 'px';

    selection.style.left = (leftOffset + 70) + 'px';
    selection.style.width = width;
  }

  $scope.hideEmpty = false;

  $scope.togglePort = function(port) {
    $scope.$broadcast('PortsCharts.portToggled', port, $scope.ports);
  };

  $scope.timeNav = {
    types: {},
    start: -48,
    end: 0,
    floor: -CONST.hHalfYear,
    ceiling: 0,
    aggregate: 'mean',
    /* My own properties */
    now: new Date(),
    hour: 60 * 60 * 1000,
    format: 'D MMM',

    _isHalfYear: function() {
      return -CONST.hHalfYear === this.floor;
    },

    init: function() {
      $scope.$watch('timeNav.aggregate', function(n, o) {
        if (o !== n) {
          $scope.$broadcast('PortsCharts.timeNav.aggregateChanged', n);
        }
      });

      $scope.$watch('::timeNav.start', drawSelection);
    },

    getFloorMeasurement: function() {
      return this._isHalfYear() ? 'd1' : 'h1';
    },

    getFloorTime: function() {
      return this._isHalfYear() ? '1d' : '1h';
    },

    setAggregate: function(aggregate) {
      this.aggregate = aggregate;

      if ($scope.hideEmpty) {
        $timeout(drawSelection, 0);
      }
    },

    formatDate: function(delta) {
      var res = new Date(this.now - (-delta * this.hour));
      return moment(res).format(this.format);
    },

    changeFloor: function(floor) {
      $scope.timeNav.floor = $scope.slider.options.floor = floor;

      if ($scope.timeNav.start < floor) {
        $scope.timeNav.start = $scope.slider.minValue = floor;
      }

      if ($scope.timeNav.end < floor) {
        $scope.timeNav.end = $scope.slider.maxValue = floor;
      }

      $timeout(drawSelection, 0);
      $scope.$broadcast('PortsCharts.timeNav.floorChanged', $scope.timeNav.floor);
    }
  };

  /**
   * Объект слайдера
   */
  $scope.slider = {
    minValue: $scope.timeNav.start,
    maxValue: $scope.timeNav.end,
    options: {
      floor: $scope.timeNav.floor,
      ceil: $scope.timeNav.ceiling,
      precision: 1,
      onChange: function(sliderId, modelValue, highValue) {
        var data = {
          start: modelValue,
          end: highValue
        };

        $scope.timeNav.start = modelValue;
        $scope.timeNav.end = highValue;

        drawSelection();
        $scope.$broadcast('PortsCharts.timeNav.changed', data);
      },
      translate: function(value) {
        return $scope.timeNav.formatDate(value);
      }
    }
  };

  $scope.$watch('summarize', function(n, o) {
    if (o !== n) {
      $scope.$broadcast('PortsCharts.summarizeChanged', n);
    }
  });

  $scope.timeNav.init();
  // Init
  $scope.ports = getPorts();
  $scope.portColors = d3.scale.category10();
  $scope.portColors.domain($scope.ports.map(function(i) {
    return i.name;
  }));
});