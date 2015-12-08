/*
  Fakes generator output to fakes.txt
*/

var fs = require('fs');

/* Convert Array to String woth line protocol for iInfluxDB like this
   Note: \n delimeter between lines
   port1 rx=10,tx=20,… 1422568543702900257
                      1447838680202000000
   …
*/

function array2Lineproto(prefix, arr) {
  var res = '';
  var line, key;
  arr.forEach(function(i) {
    line = prefix + ' ';
    for (key in i) {
      if (key != 'time') { 
        line += key + "=" + i[key] + ",";
      }
    }
      
    if (line[line.length-1] == ',') line = line.substr(0,line.length-1);
    if ('time' in i) line += " " + i.time*1e6;
  
    line += "\n";
    res += line;
  });
  return res;
}

// Round random value
function Rand(max) {
  return Math.floor(Math.random(1)*max);
}

function rate(val,deltaTime) {
  return val
}

function negative2zero(val) {
  return (val > 0) ? val : 0;
}


// Generate fakes array for one port/ DeltaTime in seconds
function GenerateFakes(count, deltaTime, port) {
  var res = [];
  var point;
  var start = new Date();
  var types = ['input','output','both','empty'];
  var type = types[Rand(4)];

  for(var i = 0; i < count; i++) {
    point = {
      rx: Rand(300),
      tx: Rand(300),
      drops: Rand(3)*Rand(3),
      crc: Rand(2)*Rand(2),
      time: start - (count-i)*deltaTime*1000
    };
    
    if (type == 'input') point.tx = 0;
    if (type == 'output') point.rx = 0;
    if (type == 'empty') {
      point.tx = 0;
      point.rx = 0;
      point.drops = 0;
      point.crc = 0;
    }

    if (i>0) {
      point.rx += res[i-1].rx;
      point.tx += res[i-1].tx;
      point.drops += res[i-1].drops;
      point.crc += res[i-1].crc;

      point.rx_rate_mean = (point.rx - res[i-1].rx)/deltaTime;
      point.tx_rate_mean = (point.tx - res[i-1].tx)/deltaTime;
      point.drops_rate_mean = (point.drops - res[i-1].drops)/deltaTime;
      point.crc_rate_mean = (point.crc - res[i-1].crc)/deltaTime;
    }
    
    // fix negatives
    point.rx_rate_mean = negative2zero(point.rx_rate_mean);
    point.tx_rate_mean = negative2zero(point.tx_rate_mean);
    point.drops_rate_mean = negative2zero(point.drops_rate_mean);
    point.crc_rate_mean = negative2zero(point.crc_rate_mean);
    
    res.push(point);
  }
  return res;
}

var str = '';
for(var i = 0; i < 64; i++) {
  str += array2Lineproto('traffic,port=port' + (i+1), GenerateFakes(2000, 60 * 10));
}

//console.log(str);

fs.writeFileSync('fakes.txt', str, 'utf-8');
console.log('File fakes.txt generated');