# Прототипирование графиков статистики агрегатора

## Установка зависимостей

Будет установлена InfluxDB 0.9.5 и npm-пакеты

```bash
./install.sh
```


## Генерация фейковых данных для портов

Формат фейковых данных соответствует 10 мин. continous query.
Measurement = traffic
Данные:
…
Тег port: port1, port2, port3, …

Для генерации фейков запустите скрипт. Скрипт удалит measurement. Сгенерирует данные на полгода (24000 точек для каждого порта). И вставит их в InfluxDB.

```bash
./fakes/fakes.sh
```


## Старт. Запустите гульп и откройте в браузере localhost:3000

```bash
gulp
```

---
docker run --name alpine-influxdb -p 8083:8083 -p 8086:8086 evild/alpine-influxdb:0.11


**Signaltech**, 2015
