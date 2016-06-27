# generate
node fakes.js

# create Db
#curl -i -XGET 'http://192.168.99.100:8086/query?CREATE DATABASE monitoring'

# drop
#curl -i -XGET 'http://192.168.99.100:8086/query?db=monitoring&q=drop%20measurement%20traffic'

# write data
for filename in fakes/*.txt; do
  curl -i -XPOST 'http://192.168.99.100:8086/write?db=monitoring' -H 'Content-Type: text/plain' --data-binary @$filename
done


