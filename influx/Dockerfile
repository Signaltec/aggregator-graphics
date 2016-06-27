FROM evild/alpine-influxdb:0.11

RUN apk --update --no-progress add nodejs curl && \
    rm -rf /var/cache/apk/*

COPY fakes /tmp/fakes

WORKDIR /tmp/fakes
RUN ./fakes.sh

# docker run -p 8083:8083 -p 8086:8086 influx
# docker run -p 8083:8083 -p 8086:8086 -v influxdb:/var/lib/influxdb influx
# docker run -i -t -p 8083:8083 -p 8086:8086 influx /bin/bash

