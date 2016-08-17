/* Форматирование скорости передачи данных. Вход: байты ("октеты") в секунду */
app.filter("rateformat", function() {
  var symbols = ['bps', 'kbps', 'Mbps', 'Gbps'];

  /*return symbol.map(function (rate) {
   return translate('network.rate.' + rate)
   });*/

  return function(rate) {
    // var symbol = getSymbol(translate);

    var base = 1000, rank = 0;

    function precise_round(num, decimals) {
      return num.toFixed(decimals);
    }

    // преобразовать из байтов ("октетов") в секунду в биты в секунду
    rate = (!rate || +rate<=0 ) ? 0 : rate*8;
    // выяснить наибольший rank данной величины
    if (rate!=0) {for (var i=1; i<=3; i++) if (rate >= base) {rate = rate / base; rank = i} }
    // округлить величину до первого знака после запятой (с учётом rank'а)
    rate = (rank>=1) ? precise_round(rate, 1) : precise_round(rate, 0);
    // вывести вместе с единицей измерения
    return (rate.toString().replace(/(\d)(?=(\d{3})+([^\d]|$))/g, "$1 ").replace(".", ",") + "\u00A0" + symbols[rank]);
  }
});