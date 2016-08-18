
var app = angular.module('app', ['ngAnimate', 'ngRoute', 'ngSanitize', 'rzModule']);

app.controller('AppCtrl', function($rootScope, $window, $location, $filter, $http, $timeout) {

});

app.controller('aggregatorGraphicsCtrl', ['$scope', '$window', '$timeout', 'charts.Const',
  function($scope, $window, $timeout, Const) {
    $scope.Const = Const;

    function toPx(value) {
      return value + 'px';
    }

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
      var width = toPx(maxPointer.offsetLeft - leftOffset);

      selection.style.left = toPx(leftOffset + 70);
      selection.style.width = width;
    }

    $scope.togglePort = function(port) {
      $scope.$broadcast('PortsCharts.portToggled', port, $scope.ports);
    };

    $scope.config = {
      start: -48,
      end: 0,
      floor: -Const.hHalfYear,
      ceiling: 0,
      aggregate: 'mean',
      /* My own properties */
      now: new Date(),
      format: d3.time.format('%e %b'),
      hideEmpty: false,
      summarize: false,

      _isHalfYear: function() {
        return -Const.hHalfYear === this.floor;
      },

      init: function() {
        $scope.$watch('config.aggregate', function(n, o) {
          if (o !== n) {
            $scope.$broadcast('PortsCharts.config.aggregateChanged', n);
          }
        });

        $scope.$watch('::config.start', drawSelection);
      },

      getFloorMeasurement: function() {
        return this._isHalfYear() ? 'd1' : 'h1';
      },

      getFloorTime: function() {
        return this._isHalfYear() ? '1d' : '1h';
      },

      setAggregate: function(aggregate) {
        this.aggregate = aggregate;

        if ($scope.config.hideEmpty) {
          $timeout(drawSelection, 0);
        }
      },

      formatDate: function(delta) {
        return this.format(new Date(this.now - (-delta * Const.msHour)));
      },

      changeFloor: function(floor) {
        $scope.config.floor = $scope.slider.options.floor = floor;

        if ($scope.config.start < floor) {
          $scope.config.start = $scope.slider.minValue = floor;
        }

        if ($scope.config.end < floor) {
          $scope.config.end = $scope.slider.maxValue = floor;
        }

        $timeout(drawSelection, 0);
        $scope.$broadcast('PortsCharts.config.floorChanged', $scope.config.floor);
      }
    };

    /**
     * Объект слайдера
     */
    $scope.slider = {
      minValue: $scope.config.start,
      maxValue: $scope.config.end,
      options: {
        floor: $scope.config.floor,
        ceil: $scope.config.ceiling,
        precision: 1,
        onChange: function(sliderId, modelValue, highValue) {
          var data = {
            start: modelValue,
            end: highValue
          };

          $scope.config.start = modelValue;
          $scope.config.end = highValue;

          drawSelection();
          $scope.$broadcast('PortsCharts.config.changed', data);
        },
        translate: function(value) {
          return $scope.config.formatDate(value);
        }
      }
    };

    $scope.$watch('config.summarize', function(n, o) {
      if (o !== n) {
        $scope.$broadcast('PortsCharts.summarizeChanged', n);
      }
    });

    // Init
    $scope.config.init();
    $scope.ports = getPorts();
    $scope.portColors = d3.scale.category10();
    $scope.portColors.domain($scope.ports.map(function(i) {
      return i.name;
    }));
  }]
);
