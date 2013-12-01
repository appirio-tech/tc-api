var assert = require('assert')
var pctEncode = require('./')

var encode = pctEncode(/[^\w~.\-]/g);

assert.equal(encode("UTF-8 in your URIs: ✓"),
             "UTF-8%20in%20your%20URIs%3A%20%E2%9C%93");

console.log('ok');
