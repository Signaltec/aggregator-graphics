#!/usr/bin/env bash

# Дампер данных из influxdb 0.8.8
# usage ./xyi.sh -t 1h
# где 1h - таблица, из которой дампить
# Выходной файл будет в папке data/tmp_${table}

declare -r url='https://192.168.0.252/influxdb/db/monitoring/series'
declare -r user='reader'
declare -r password='Re@D3r'

# Обязательно эскейпить символы такие как +\ и т.д.
declare -r query="select%20*%20from%20/${table}.port..?/"

while [[ $# > 0 ]]
do
key="$1"

case $key in

    # table
    -t)
    declare -r table="$2"
    shift # past argument
    ;;
    # end interactive argument

    *)
    # unknown option
    ;;
esac
shift # past argument or value
done
if [[ -n $1 ]]; then
    echo "Last line of file specified as non-opt/last argument:"
    tail -1 $1
fi

curl -k "${url}?u=${user}&p=${password}&q=${query}" > "./data/tmp_${table}"