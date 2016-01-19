/**
 * validate.js
 *
 *    read each index.<pos> file, and look up using wordpos and confirm find all words
 *
 * Usage:
 *    node validate index.adv
 *
 * Copyright (c) 2012-2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */
var
  WordPos = require('../src/wordpos'),
  WNdb = WordPos.WNdb,
  util = require('util'),
  BufferedReader = require ("../tools/buffered-reader"),
  _ = require('underscore')._,
  path = require('path'),
  fs = require('fs'),
  results = {},
  puts = _.compose(function(a){ process.stdout.write(a)}, util.format);

if (process.argv.length < 3) return usage();

var basename = process.argv.slice(2).shift(),
  indexFile = path.join(WNdb.path, basename);

if (!fs.existsSync(indexFile)) {
  console.error('Error: no such file %s', indexFile);
  process.exit(10);
}

function usage() {
  console.log('#Usage:\nnode validate.js index.adv');
  process.exit(1);
}

function pos(basename) {
  return basename.match(/index\.(.*)/)[1];
}

function isX(basename) {
  return {noun:'isNoun', verb:'isVerb', adj:'isAdjective', adv:'isAdverb'}[pos(basename)];
}

var
  wordpos = new WordPos(),
  bin = results[basename] = {total:0, notfound:0, notlist:[]},
  isFn = wordpos[isX(basename)],
  words = [],
  count = 0;

puts('\nReading %s:\n', indexFile);
new BufferedReader (indexFile, {encoding: "utf8", _bufferSize: 170 * 1024 })
  /*
   * reads 16 KB chunks by default... there's an inherent nextTick() between chunks in the underlying streaming fns.
   */
  .on ("error", function (error){
    console.error("error: %s", indexFile, error);
  })
  .on ("line", function (line, offset){
    // skip license info
    if (line[0] == ' ') return;

    //if (count > 50) return this.interrupt();
    var word = line.substring(0, line.indexOf(' '));
    ++count;
    words.push(word);
  })
  .on ("end", function (){
    puts('%d words, processing...', count);
    words.forEach(function(word, i) {
      isFn.call(wordpos, word, callback);
    });
  })
  .read();


function callback(result, word) {
  ++bin.total;
  !result && (++bin.notfound, bin.notlist.push(word));
  if (bin.total == count) done();
}

function done() {
  if (bin.notfound == 0) {
    console.log('OK!');
    process.exit(0);
  }
  else {
    var n = 25;
    console.log('%d not found\n%s', bin.notfound, bin.notlist.slice(0,n).join('\n'));
    (bin.notlist.length > n) && console.log(' +%d more', bin.notlist.length - n);
    process.nextTick(function(){ process.exit(1) });
  }
}

