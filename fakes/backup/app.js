/**
 * Конвертация дампа данных с инфлюкса ~0.8.8 в 0.9+(0.13 на текущий момент)
 */

var fs = require('fs');
var async = require('async');

/**
 * Стрим для результирующего файла с часовой группировкой
 */
var wsHour = fs.createWriteStream('./data/data_h.txt');

/**
 * Стрим для результирующего файла с секундной группировкой
 */
var wsSeconds = fs.createWriteStream('./data/data_s.txt');

/**
 * Преобразование имён колонок из строки инфлюкса в объект
 * columns: ['xyi', 'pizda', 'shurupovyort'] => {xyi: 0, pizda: 1, shurupovyort: 2}
 * @param {{}}  item
 * @returns {{}}  объект с ключом - колонкой и значением - индексом в массиве.
 */
function convertColumns(item) {
  var columns = {};

  if (!item.columns) {
    throw new Error('Объект должен являться строкой из инфлюкса и содержать columns');
  }

  item.columns.forEach((column, index) => {
    columns[column] = index;
  });

  return columns;
}

wsHour.on('finish', err => {
  console.error('Hours was written', err);
});

wsSeconds.on('finish', err => {
  console.error('Seconds was written', err);
});

async.series([
  callback => {

  /**
     * Конвертация дампа в формат для некст ген инфлюксов
     */
    fs.readFile('./data/tmp_1h', 'utf8', (err, data) => {

      if (err) {
        callback(err);
        return;
      }

      data = JSON.parse(data);

      data.forEach(item => {
        let portName = item.name.match(/port\d+/)[0];
        let h = convertColumns(item);

        item.points.forEach(point => {
          wsHour.write(`h1,port=${portName} crc_mean=${point[h.crc]},drops_mean=${point[h.drops]},rx_mean=${point[h.rx_speed]},tx_mean=${point[h.tx_speed]} ${point[h.time] * 1000000}\n`);
        });
      });

      callback();
    });
  },
  callback => {
    fs.readFile('./data/tmp_10s', 'utf8', (err, data) => {

      if (err) {
        callback(err);
        return;
      }

      data = JSON.parse(data);

      data.forEach(item => {
        let portName = item.name.match(/port\d+/)[0];
        let s = convertColumns(item);

        item.points.forEach(point => {
          wsSeconds.write(`s10,port=${portName} crc_mean=${point[s.crc]},drops_mean=${point[s.drops]},rx_mean=${point[s.rx_speed]},tx_mean=${point[s.tx_speed]} ${point[s.time] * 1000000}\n`);
        });
      });

      callback();
    });
  },
  callback => {
    wsHour.end();
    wsSeconds.end();
    callback();
  }
], (err) => {
  if (err) {
    console.error('Ошибка:', err);
  }

  console.error('Збс');
});
