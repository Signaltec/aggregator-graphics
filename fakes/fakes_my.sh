#!/usr/bin/env bash
# generate
#node fakes.js

# create Db
#curl -i -XGET 'http://localhost:8086/query?q=create+database+"monitoring"'

# drop
#curl -i -XGET 'http://localhost:8086/query?db=monitoring&q=drop%20measurement%20traffic'

# hour cont query
# curl -i XGET 'http://localhost:8086/query?db=monitoring&q=create continuous query on monitoring'

# write data
for filename in fakes/*.txt; do
  curl -i 'http://localhost:8086/write?db=monitoring&u=root&p=pussy-root' -H 'Content-Type: text/plain' --data-binary @$filename
done

GRANT READ ON monitoring TO reader
GRANT WRITE ON monitoring TO writer

CREATE CONTINUOUS QUERY event_s10 ON monitoring BEGIN SELECT max(rx_speed) AS rx_max, max(tx_speed) AS tx_max, mean(rx_speed) AS rx_mean, mean(tx_speed) AS tx_mean, max(drops) AS drops_max, mean(drops) as drops_mean, max(crc) AS crc_max, mean(crc) as crc_mean INTO s10 FROM traffic GROUP BY time(10s), port END
CREATE CONTINUOUS QUERY event_h1 ON monitoring BEGIN SELECT max(rx_max) AS rx_max, max(tx_max) AS tx_max, mean(rx_mean) AS rx_mean, mean(tx_mean) AS tx_mean, max(drops_max) AS drops_max, mean(drops_mean) as drops_mean, max(crc_max) AS crc_max, mean(crc_mean) as crc_mean INTO h1 FROM s10 GROUP BY time(1h), port END
CREATE CONTINUOUS QUERY event_d1 ON monitoring BEGIN SELECT max(rx_max) AS rx_max, max(tx_max) AS tx_max, mean(rx_mean) AS rx_mean, mean(tx_mean) AS tx_mean, max(drops_max) AS drops_max, mean(drops_mean) as drops_mean, max(crc_max) AS crc_max, mean(crc_mean) as crc_mean INTO d1 FROM h1 GROUP BY time(1d), port END