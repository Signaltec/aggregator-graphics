app.factory('charts.PortsCharts', [function() {

  // Custom tickFormat
  var customTimeFormat = d3.time.format.multi([
    ['%H:%M', function(d) {
      return d.getMinutes();
    }],
    ['%H:%M', function(d) {
      return d.getHours();
    }],
    ['%e %b', function(d) {
      return d.getDate() != 1;
    }],
    ['%B', function(d) {
      return d.getMonth();
    }],
    ['%Y', function() {
      return true;
    }]
  ]);

  function convertHex(hex, opacity) {
    var r, g, b;

    hex = hex.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);

    return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
  }

  function PortsCharts(container, color, margin) {
    var self = this;

    this.container = container;

    if (typeof this.container === 'string') {
      this.element = document.querySelector(this.container);
    } else {
      this.element = this.container;
    }

    this.aggregate = 'mean';
    this.oldAggregate = 'mean';

    this.margin = +margin;
    this.color = color;

    this.width = this.element.offsetWidth - this.margin;
    this.height = this.element.offsetHeight;

    this.x = d3.time.scale().range([0, this.width]);
    this.y = d3.scale.linear().range([this.height / 2, 0]);

    this.rx = d3.svg.area()
      // .interpolate('basis')
      .x(function(d) {
        return self.x(d[0]);
      })
      .y0(this.height / 2)
      .y1(function(d) {
        return self.y(d[self.rxAggregateIndex]);
      });

    this.tx = d3.svg.area()
      // .interpolate('basis')
      .x(function(d) {
        return self.x(d[0]);
      })
      .y0(this.height / 2)
      .y1(function(d) {
        return self.y(-d[self.txAggregateIndex]);
      });
  }

  /**
   * Преобразование массива с именами колонок в объект имя_колонки -> индекс
   * @param {string[]}  columns
   * @returns {{}}
   */
  PortsCharts.colsToObj = function(columns) {
    var cols = {};

    columns.forEach(function(colName, index) {
      cols[colName] = index;
    });

    return cols;
  };

  PortsCharts.getBitRates = function(translate) {

  }

  PortsCharts.prototype = {
    aggregate: null,
    oldAggregate: null,
    element: null,
    margin: null,
    color: null,
    width: null,
    height: null,
    x: null,
    y: null,
    rx: null,
    tx: null,
    svg: null,
    rxAggregateIndex: null,
    txAggregateIndex: null,
    yMax: 0,

    _getMaxOnRange: function(start, end) {
      var self = this;

      return d3.max(this.portData, function(d) {
        return d[0] >= start && d[0] <= end ?
          d3.max([d[self.rxAggregateIndex], d[self.txAggregateIndex]]) :
          0;
      });
    },

    getMax: function(start, end) {
      return angular.isNumber(start) && angular.isNumber(end) ?
        this._getMaxOnRange(start, end) || 0 :
        this.yMax;
    },

    getRxIndex: function() {
      return this.rxAggregateIndex;
    },

    getTxIndex: function() {
      return this.txAggregateIndex;
    },

    /**
     *
     * @param portData
     * @param cols
     * @param aggregate
     * @param {number}  period  Время начала выборки периода в мс. (hHalfYear * 60 * 1000)
     */
    microChart: function(portData, cols, aggregate, period) {
      var self = this;
      cols = PortsCharts.colsToObj(cols);

      this.aggregate = aggregate;
      this.rxAggregateIndex = cols['rx_' + aggregate];
      this.txAggregateIndex = cols['tx_' + aggregate];

      if (!portData || !portData.length) return;
      this.portData = portData;

      portData.forEach(function(d) {
        d[0] = new Date(d[0])
      });

      this.x.domain([new Date() - period, new Date()]);

      this.yMax = d3.max(portData, function(d) {
        return d3.max([d[self.rxAggregateIndex], d[self.txAggregateIndex]]);
      }) || 0;

      // HARD clear
      d3.select(this.element).select('svg').remove();

      this.svg = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin)
        .attr('height', this.height)
        .append('g')
        .attr('transform', 'translate(' + this.margin + ',0)');

      if (this.yMax > 0) {

        this.y.domain([0, this.yMax]);

        // Draw errors
        /*this.svg.selectAll('.dot')
          .data(portData)
          .enter().append('circle')
          .attr('class', 'dot')
          .attr('r', function(d) {
            return ((d[valuePosition.drops.max] + d[valuePosition.crc.max]) * dataRatio.errors);
          })
          .attr('cx', function(d) {
            return self.x(d[0]);
          })
          .attr('cy', this.height / 2);*/

        var elem = this.svg.append('g').attr('class', 'elem');

        // Draw RX
        elem.append('path')
          .attr('class', 'area')
          .attr('d', function() {
            return self.rx(portData);
          })
          .attr('fill', convertHex(this.color, 0.4));

        // Draw TX
        elem.append('path')
          .attr('class', 'area tx')
          .attr('d', function() {
            return self.tx(portData);
          })
          .attr('fill', convertHex(this.color, 0.4));
      }
    },

    multiChart: function(series, cols, portsNames, aggregate) {
      var self = this;

      // k, M e.t.c
      var yAxisTickFormat = d3.format('s');

      this.aggregate = aggregate;

      // HARD clear
      d3.select(this.element).select('svg').remove();

      this.svg = d3.select(this.container).append('svg')
        .attr('width', this.width + this.margin)
        .attr('height', this.height)
        .append('g')
        .attr('transform', 'translate(' + this.margin + ',0)');

      if (!series || !series.length) {
        this.svg.append('text')
          .attr('x', this.width / 2)
          .attr('y', this.height / 2)
          .text('Данных нет')
          .style("text-anchor", "middle");

        return;
      }

      this.series = series;

      cols = PortsCharts.colsToObj(cols);
      this.rxAggregateIndex = cols['rx_' + aggregate];
      this.txAggregateIndex = cols['tx_' + aggregate];

      // prepare dates
      series.forEach(function(s) {
        s.values.forEach(function(d) {
          d[0] = new Date(d[0]);
        });
      });

      this.x.domain(d3.extent(series[0].values, function(d) {
        return d[0];
      }));

      this.yMax = d3.max(series, function(c) {
        return d3.max(c.values, function(d) {
          return d3.max([d[self.rxAggregateIndex], d[self.txAggregateIndex]]);
        });
      });

      // Draw axis
      this.xa = this.svg.append('g').attr('class', 'x axis');
      this.ya = this.svg.append('g').attr('class', 'y axis');

      this.xAxis = d3.svg.axis().scale(this.x).orient('bottom').tickFormat(customTimeFormat).ticks(10);
      this.xa.attr('transform', 'translate(0,' + this.height / 2 + ')').call(this.xAxis);

      var axisScale = d3.scale.linear().domain([-this.yMax, this.yMax]).range([0, this.height - 20]);

      this.yAxis = d3.svg.axis().scale(axisScale).orient('left')
        .ticks(10)
        .tickFormat(function(d) {
          return yAxisTickFormat(Math.abs(d));
        });

      this.ya.attr('transform', 'translate(0,10)').call(this.yAxis);

      if (this.yMax) {
        this.y.domain([0, this.yMax]);

        var elem;
        var portData;
        var portName = 'port1';
        var bitrate = d3.formatPrefix(this.yMax).symbol + 'bps';

        // For thru ports
        for (var i = 0; i < series.length; i++) {
          portData = series[i];
          elem = this.svg.append('g').attr('class', 'elem');

          if (portData.tags) {
            portName = portData.tags.port;
          }

          // Draw RX
          elem.append('path')
            .attr('class', 'area')
            .attr('d', function(d) {
              return self.rx(portData.values);
            })
            .attr('fill', convertHex(
              this.color(portName), 0.3
            ));

          // Draw TX
          elem.append('path')
            .attr('class', 'area tx')
            .attr('d', function(d) {
              return self.tx(portData.values);
            })
            .attr('fill', convertHex(
              this.color(portName),
              0.3
            ));

          // Draw errors
          /*elem.selectAll('.dot')
            .data(portData.values)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('r', function(d) {
              return ((d[valuePosition.drops[self.aggregate]] + d[valuePosition.crc[self.aggregate]]) * dataRatio.errors);
            })
            .attr('cx', function(d) {
              return self.x(d[0]);
            })
            .attr('cy', this.height / 2);*/
        }

        this.svg.append('text')
          .attr('y', 10)
          .text('RX, ' + bitrate);

        this.svg.append('text')
          .attr('y', this.height - 10)
          .text('TX, ' + bitrate);

        this.oldAggregate = aggregate;
      }
    }
  };

  return PortsCharts;
}]);