class TimeAxis {
  
    var HOUR = 60 * 60 * 1000;
    var WIDTH = 400;
    var HEIGHT = 300;
  
    constructor() {
        this.svg = d3.select('.time-axis-svg'); 
        this.axis = this.svg.append("g").attr("class", "axis");
        this.x = d3.time.scale().range([0, WIDTH]);
      
        this.render = function() {
          this.x.domain([this.from, this.to]);
          
          xAxis = d3.svg.axis()
            .scale(this.x)
            .orient("bottom")
            .tickFormat(d3.time.format("%e %b"));

          this.axis.call(xAxis);
        }
    }
  
    get bindedValue() {
        return this.$value;
    }

    set bindedValue(value) {
       this.$value = value;
       this.render();
    }
};

angular.module('app').component('TimeAxis', {
   bindings: {
       'from': '=',
       'to': '=',
   },
   template: `
      <div class="time-axis">
        <svg width="300" height="30" class="time-axis-svg"></svg>
      </div>
    `,
    style: `
      
    `,
   controller: TimeAxis
});
