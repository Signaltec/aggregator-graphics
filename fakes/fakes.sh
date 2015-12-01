# generate
node fakes.js

# drop
curl -i -XGET 'http://localhost:8086/query?db=monitoring&q=drop%20measurement%20traffic'

# load data
curl -i -XPOST 'http://localhost:8086/write?db=monitoring' --data-binary @fakes.txt