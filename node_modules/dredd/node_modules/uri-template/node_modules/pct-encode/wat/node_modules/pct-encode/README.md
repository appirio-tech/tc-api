# pct-encode

Create versions of strings where characters that match a regular expression are percent encoded.

## Synopsis

```javascript

var pctEncode = require('pct-encode')

var encode = pctEncode(/\W/);

console.log(encode("UTF-8 in your URIs: ✓"));
```

## API

# module.exports = function (regexp) -> function (string)



