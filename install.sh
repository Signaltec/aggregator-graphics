#!/bin/bash

this_directory="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Install Node.js

echo "==============================================="
echo "= Установка Node.js (если она ещё не стоит)   ="
echo "==============================================="
read -p "  (нажмите Enter для продолжения)" nonexistent

# 
# https://github.com/joyent/node/wiki/installing-node.js-via-package-manager
sudo apt-get install curl
curl --silent --location https://deb.nodesource.com/setup_0.12 | sudo bash -
# sudo apt-get update
sudo apt-get install --yes nodejs nodejs-legacy
sudo apt-get install --yes build-essential

# если не скачивается nodejs-legacy через apt-get, то можно руками:
# https://packages.debian.org/ru/sid/all/nodejs-legacy/download

# Install InfluxDB

# http://influxdb.com/docs/v0.8/introduction/installation.html

echo "==============================================="
echo "= Установка пакетов npm                       ="
echo "==============================================="
read -p "  (нажмите Enter для продолжения)" nonexistent

sudo npm install gulp --global
sudo npm install bower --global
npm install

echo "==============================================="
echo "= Установка InfluxDB                          ="
echo "==============================================="
read -p "  (нажмите Enter для продолжения)" nonexistent

# for 64-bit systems
wget http://s3.amazonaws.com/influxdb/influxdb_latest_amd64.deb
sudo dpkg -i influxdb_latest_amd64.deb
# rm influxdb_latest_amd64.deb

##sudo dpkg --install ./install/InfluxDB/influxdb_0.9.5_amd64.deb

echo "==============================================="
echo "= Настройка InfluxDB                          ="
echo "==============================================="
influxdb_configuration=/opt/influxdb/shared/config.toml

# запустить InfluxDB
sudo service influxdb restart

# если не удалось запустить InfluxDB
if [ $? != 0 ];then
	echo "Не удалось запустить InfluxDB. Проконсультируйтесь со специалистом."
	exit 1
fi

# подождать, пока поднимется http сервер influxdb после её перезапуска (обычно достаточно пяти-семи секунд)

# sleep 20

spin[0]="-"
spin[1]="\\"
spin[2]="|"
spin[3]="/"

echo "==============================================="
echo -n "= Ожидание, пока InfluxDB поднимет http порт ${spin[0]}"
echo "==============================================="

while [[ "`sudo netstat --all --numeric --tcp --program | awk '{ print $4 }' | grep --word-regexp :::8086 | wc --lines`" != "1" ]]
do
	for i in "${spin[@]}"
	do
		echo -ne "\b$i"
		sleep 0.1
	done
done

echo ""
echo "==============================================="
echo "= Смена пароля root'а на InfluxDB             ="
echo "==============================================="

# # for 32-bit systems
# wget http://s3.amazonaws.com/influxdb/influxdb_latest_i386.deb
# sudo dpkg -i influxdb_latest_i386.deb

# Install Node.js modules

curl --request POST "http://localhost:8086/cluster_admins/root?u=root&p=root" --data "{\"password\": \"root\"}"

echo "==============================================="
echo "= Первичная настройка базы данных InfluxDB    ="
echo "==============================================="

##npm run build
##node install/InfluxDB/influxdb.js --from 0.0.0

echo "==============================================="
echo "= Конец                                       ="
echo "==============================================="