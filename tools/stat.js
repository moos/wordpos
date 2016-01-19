/**
 * stat.js
 *
 *     generate fast index for WordNet index files
 *
 * Usage:
 *    node stat [--no-stats] index.adv ...
 *
 * --no-stats prevents writing bucket size statistics to file.
 *
 * Fast index is based on buckets keyed off first THREE characters in the index word,
 * eg, 'awesome' goes into bucket 'awe'.
 *
 * Format of the fast index JSON object:
 *  {
 *   "firstKey":".22",				// first key value
 *   "keyLength":3,					// #characters in key
 *   "version":"3.0",				// WNdb version
 *   "name":"index.adj",			// index file name
 *   "stats":{
 *   	"buckets":2326,				// # of buckets
 *   	"words":21479,				// total # words
 *   	"biggest":310,				// #words in biggest bucket
 *   	"avg":"9.23",				// average #words per bucket
 *   	"median":3					// median #words per bucket
 *     },
 *   "offsets":{
 *     "100":[2271,"101"],			// "100" is the key,
 *     								// value=[byte offset in index file, next key]
 *      ...
 *    }
 *  }
 *
 *  To lookup a word:
 *
 *  find key (first <keyLength> chars of word)
 *  look it up in <offsets> O(1)
 *  if it exists
 *  	get offset of key and offset of next key
 *      read index file between the two offsets
 *  	binary search read data O(log avg)
 *
 * Copyright (c) 2012-2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */
var
  WNdb = require('../src/wordpos').WNdb,
  util = require('util'),
  BufferedReader = require ('./buffered-reader'),
  _ = require('underscore')._,
  fs = require('fs'),
  path = require('path'),
  KEY_LENGTH = 3,
  stats = true,
  eofKey = '_EOF_'; // should be unique

console.log('DB folder: ', WNdb.path);
if (process.argv.length < 3) {
  console.log('#Usage:\nnode stat index.adv ...');
  process.exit(1);
}

_(process.argv.slice(2)).filter(function(arg){
  // disable writing stats file
  if (arg == '--no-stats') {
    stats = false;
    return false;
  }
  return true;
}).forEach(function(basename){

  var indexFile = path.join(WNdb.path, basename),
    jsonFile = path.join(WNdb.path, 'fast-' + basename + '.json'),
    countFile = 'fast-' + basename + '.tsv',
    endOffset = fs.statSync(indexFile).size,
    buckets = {},
    lastKey = null,
    offsets = {},
    firstKey = null;

  new BufferedReader (indexFile, {encoding: "utf8"})
    .on ("error", function (error){
      console.log ("error: %s", indexFile, error);
    })
    .on ("line", function (line, offset){
      // skip license info
      if (line[0] == ' ') return;

      // if (++i > 225) return this.interrupt();
      var key = line.substring(0, Math.min(line.indexOf(' '), KEY_LENGTH));
      if (firstKey === null) firstKey = key;

      if (key in buckets) {
        ++buckets[key];
        return;
      }

      buckets[key] = 1;
      offsets[key] = [offset];
      (lastKey !== null) && offsets[lastKey].push(key);	// current key is the 'next key' for the previous key
      lastKey = key;
    })
    .on ("end", function (){

      // add EOF offset
      offsets[lastKey].push(eofKey);
      offsets[eofKey] = [endOffset, null];

      var size = _.size(buckets),
        sum = _.reduce(buckets, function(memo, num){ return memo + num; }, 0),
        sorted = _.sortBy(buckets, function(val){ return val }),
        median = sorted[Math.floor(size/2)],
        max =  sorted[sorted.length-1], // _.max(buckets),
        maxkey = _.reduce(buckets, function(memo, val, key){ return memo + (val == max ? key :  '') }, ''),
        avg = (sum/size).toFixed(2),
        info = util.format('buckets %d, max %d at %s, sum %d, avg %d, median %d', size, max, maxkey, sum, avg, median);

      console.log(basename, info);

      if (stats) {
        // distribution in groups of 10
        var grouped = _.groupBy(buckets, function(num){ return 1 + 10*(Math.floor((num-1)/10) ) });
        _(grouped).each(function(arr, key, list){
              list[key] = arr.length;
            });
        str = '';
        _.each(grouped, function(value, key){ str += key+"\t"+value+"\n" });
        fs.writeFileSync(countFile, '#'+info+'\n'
            + '#bucket_size (1-10, 11-20, etc.) \t #buckets\n'
            + str, 'utf8');
      }

      // offset data
      var data = {
          firstKey: firstKey,
          keyLength: KEY_LENGTH,
          version: WNdb.version,
          name: basename,
          stats: {
            buckets: size,
            words: sum,
            biggest: max,
            avg: avg,
            median: median
          },
          offsets: offsets
      };

      fs.writeFileSync(jsonFile, JSON.stringify(data), 'utf8');
      console.log('  wrote %s\n', jsonFile);
    })
    .read();
});
