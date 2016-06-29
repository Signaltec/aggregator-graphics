app.factory('charts.InfluxConnection', [function() {
  var connectionURI = 'http://192.168.0.187:8086/';

  function Connection(uri, db, user, passwd) {
    if (!db) throw new Error('No InfluxDB database name (db)!');

    this.db = db;
    this.user = user || 'reader';
    this.passwd = passwd || 'Re@D3r';
    this.uri = uri || connectionURI;
  }

  Connection.prototype.query = function() {
    return new Query(this.uri, this.db, this.user, this.passwd);
  };

  function Query(uri, db, user, passwd) {
    this.query = '';
    this.uri = uri;
    this.db = db;
    this.user = user;
    this.passwd = passwd;
  }

  Query.columns = [
    'crc_max', 'crc_mean', 'drops_max', 'drops_mean',
    'port', 'rx_max', 'rx_mean', 'tx_max', 'tx_mean'
  ];

  Query.groupedColumns = [
    'max(crc_max) as crc_max',
    'mean(crc_mean) as crc_mean',
    'max(drops_max) as drops_max',
    'mean(drops_mean) as drops_mean',
    'max(rx_max) as rx_max',
    'mean(rx_mean) as rx_mean',
    'max(tx_max) as tx_max',
    'mean(tx_mean) as tx_mean'
  ];

  Query.summarizedColumns = [
    'sum(crc_max) as crc_max',
    'sum(crc_mean) as crc_mean',
    'sum(drops_max) as drops_max',
    'sum(drops_mean) as drops_mean',
    'sum(rx_max) as rx_max',
    'sum(rx_mean) as rx_mean',
    'sum(tx_max) as tx_max',
    'sum(tx_mean) as tx_mean'
  ];

  Query.prototype = {
    /**
     * Подготовка итогового запроса
     * @returns {string}
     * @private
     */
    _prepare: function() {
      return this.uri + 'query?u=' + this.user +
        '&p=' + this.passwd + '&q=' + this.query + '&db=' + this.db;
    },

    /**
     * Преобразование массива имён колонок в массив суммирования по этим колонкам
     * @param {string[]}  columns имена колонок ['tx_mean', 'rx_max']
     * @returns {string[]}  результирующий массив ['sum(tx_mean) as tx_mean', 'sum(tx_max) as tx_max']
     * @private
     */
    _sumSelect: function(columns) {
      return columns.map(function(col) {
        return 'sum(' + col + ') as ' + col;
      });
    },

    select: function(select) {
      this.query = 'select ' + select.join(', ');
      return this;
    },

    from: function(from) {
      this.query += ' from ' + from;
      return this;
    },

    where: function(where) {
      this.query += ' where ' + where;
      return this;
    },

    fetch: function() {
      var queryUri = this._prepare();

      return new Promise(function(resolve, reject) {
        d3.json(queryUri, function(error, data) {
          if (error) {
            reject(error);
            throw new Error(error);
          }

          if (data.results.length) data = data.results[0];

          resolve(data);
        });
      });
    },

    /**
     * Добавление группировки
     * @param {string[]}  fields          поля для группировки
     * @param {boolean}   [append=false]  флаг добавление полей в конец без добавления "group by"
     * @returns {Query}
     */
    groupBy: function(fields, append) {
      this.query += append ? ', ' : 'group by ';
      this.query += fields.join(', ');

      return this;
    },

    /**
     * Группировка по полю
     * @param {string}  value 10s, 1h...
     * @returns {Query}
     */
    groupByTime: function(value) {
      this.query += ' group by time(' + value + ')';
      return this;
    },

    /**
     *
     * @param {object}    conf
     * @param {string}    [conf.measurement='s10']  Измерение(таблица)
     *                    Должно совпадать с таблицей из которой берётся. d1 - time(1d)
     * @param {string[]}  [conf.columns=this.columns]  Колонки для выборки
     * @param {string[]}  conf.ports      имена портов
     * @param {string}    conf.timeFrom   начало выборки
     * @param {string}    conf.timeTo     конец выборки
     * @returns {Query}
     */
    selectPorts: function(conf) {
      var measurement = conf.measurement || 'h1';
      var columns = conf.columns || Query.columns;
      var ports;

      ports = conf.ports
        .map(function(port) {
          return '^' + port + '$';
        })
        .join('|');

      this.select(columns)
        .from(measurement)
        .where(
          'time > ' + conf.timeFrom + ' AND time < ' + conf.timeTo +
          ' AND port =~ /' + ports + '/'
        );

      return this;
    },

    selectPortsSum: function(conf) {
      conf.columns = Query.summarizedColumns;
      return this.selectPorts(conf);
    },

    selectPortsGrouped: function(conf) {
      conf.columns = Query.groupedColumns;
      return this.selectPorts(conf);
    }
  };

  return Connection;
}]);