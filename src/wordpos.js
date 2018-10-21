/*!
* wordpos.js
*
*    Node.js part-of-speech utilities using WordNet database.
*
* Copyright (c) 2012-2019 mooster@42at.com
* https://github.com/moos/wordpos
*
* Released under MIT license
*/

console.log(333, process.browser);

if (11 || process.browser) {
  module.exports = require('./browser');
} else {
  module.exports = require('./node');
}
