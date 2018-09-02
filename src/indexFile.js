/*!
 * indexFile.js
 *
 * 		implements fast index lookup of WordNet's index files
 *
 * Copyright (c) 2012-2018 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Portions: Copyright (c) 2011, Chris Umbel
 *
 * Released under MIT license
 */

var _ = require('underscore')._,
  util = require('util'),
  path = require('path'),
  fs = require('fs'),
  piper = require('./piper'),
  KEY_LENGTH = 3;


/**
 * load fast index bucket data
 *
 * @param dir {string} - dir path of index files
 * @param name {string} - name of index file, eg, 'index.verb'
 * @returns {Object} - fast index data object
 */
function loadFastIndex(dir, name) {
  var jsonFile = path.join(dir, 'fast-' + name + '.json'),
    data = null;
  try{
    data = JSON.parse( fs.readFileSync(jsonFile,'utf8') );
    //console.log('loaded %d buckets for %s', data.stats.buckets, data.name);
  } catch(e) {
    console.error('Error with fast index file. Try reinstalling from npm!');
    throw e;
  }
  return data;
}

/**
 * read index file using fast index data at key
 *
 * @param key {string} - 3-char key into fast index
 * @param index {object} - index file object
 * @param callback {function} - function receives buffer of data read
 * @returns none
 */
function readIndexForKey(key, index, callback) {
  var data = index.fastIndex,
    offset = data.offsets[key][0],
    nextKey = data.offsets[key][1],
    nextOffset = data.offsets[nextKey][0],
    len = nextOffset - offset - 1,
    buffer = new Buffer.alloc(len);

  fs.read(index.fd, buffer, 0, len, offset, function(err, count){
     if (err) return console.log(err);
     //console.log('  read %d bytes for <%s>', count, key);
     callback(buffer);
  });
}


/**
 * read index file using fast index data at keyStart to keyEnd (inclusive)
 *
 * @param keyStart {string} - 3-char key into fast index to begin at
 * @param keyEnd {string|null} - 3-char key into fast index to end at.  If null, reads to next key.
 * @param index {object} - index file object
 * @param callback - function receives buffer of data read
 * @returns none
 */
function readIndexBetweenKeys(keyStart, keyEnd, index, callback) {
  var data = index.fastIndex,
    offset = data.offsets[keyStart][0],
    end = keyEnd || keyStart,
    nextKey = data.offsets[end][1],
    nextOffset = data.offsets[nextKey][0],
    len = nextOffset - offset - 1,
    buffer = new Buffer.alloc(len);

  //console.log('### readIndexBetweenKeys', keyStart, keyEnd, nextKey, len)
  fs.read(index.fd, buffer, 0, len, offset, function(err, count){
     if (err) return console.log(err);
     // console.log('  read %d bytes for <%s>', count, keyStart);
     callback(buffer);
  });
}

/**
 * find a search term in an index file (using fast index)
 *
 * Calls to same bucket are queued for callback using the piper.
 *
 * @param search {string} - word to search for
 * @param callback {function} - callback receives found line and tokens
 * @returns none
 */
function find(search, callback) {
  var self = this,
    data = this.fastIndex,
    readCallbacks = this.callbackQueue,
    miss = {status: 'miss'};

  var key = search.slice(0, KEY_LENGTH);
  if (!(key in data.offsets)) return process.nextTick(function(){ callback(miss) });

  // prepare the piper
  var task = 'find:' + key,
    args = [key, this],
    context = [search, callback]; // last arg MUST be callback

  // pay the piper
  this.piper(task, readIndexForKey, args, context, collector);

  function collector(_key, index, search, callback, buffer){
    var lines = buffer.toString().split('\n'),
      keys = lines.map(function(line){
        return line.substring(0,line.indexOf(' '));
      }),
      ind = _.indexOf(keys, search, /*isSorted*/ true);	// binary search!

    //console.log(' %s is %d', search, ind);
    if (ind === -1) return callback(miss);

    var tokens = lines[ind].split(/\s+/),
      key = tokens[0],
      result = {status: 'hit', key: key, 'line': lines[ind], tokens: tokens};

    callback(result);
  }
}

/**
 * find a word and prepare its lexical record
 *
 * @param word {string} - search word
 * @param callback {function} - callback function receives result
 * @returns none
 *
 * Credit for this routine to https://github.com/NaturalNode/natural
 */
function lookup(word, callback) {
  var self = this;

  return new Promise(function(resolve, reject){
    self.find(word, function (record) {
      var indexRecord = null,
        i;

      if (record.status == 'hit') {
        var ptrs = [], offsets = [];

        for (i = 0; i < parseInt(record.tokens[3]); i++)
          ptrs.push(record.tokens[i]);

        for (i = 0; i < parseInt(record.tokens[2]); i++)
          offsets.push(parseInt(record.tokens[ptrs.length + 6 + i], 10));

        indexRecord = {
          lemma       : record.tokens[0],
          pos         : record.tokens[1],
          ptrSymbol   : ptrs,
          senseCnt    : parseInt(record.tokens[ptrs.length + 4], 10),
          tagsenseCnt : parseInt(record.tokens[ptrs.length + 5], 10),
          synsetOffset: offsets
        };
      }

      callback && callback(indexRecord);
      resolve(indexRecord);
    });
  });
}


/**
 * loads fast index data and return fast index find function
 *
 * @param index {object} - the IndexFile instance
 */
function initIndex(index){
  var key = index.filePath,
    data;

  if (!(key in cache)) {
    data = loadFastIndex(index.dictPath, index.fileName);
    cache[key] = data;
  }

  // if no fast index data was found or was corrupt, throw
  if (!cache[key]) throw new Error('Unable to load fastIndex file: ' + index.filePath);

  index.fastIndex = cache[key];
  index.fastIndex.indexKeys = Object.keys(index.fastIndex.offsets);
  index.fastIndex.trie = null;  // calc on demand

  index.refcount = 0;
  index.callbackQueue = {};
  index.piper = _.bind(piper, index);
}

/**
 * IndexFile class
 *
 * @param dictPath {string} - WordNet db dict path
 * @param name {string} - name of index: noun, verb, adj, adv
 * @constructor
 */
var IndexFile = function(dictPath, name) {
  this.dictPath = dictPath;
  this.fileName = 'index.' + name;
  this.filePath = path.join(this.dictPath, this.fileName);
  initIndex(this);
};

IndexFile.prototype.lookup = lookup;
IndexFile.prototype.find = find;

/**
 * export static method
 * @type {readIndexBetweenKeys}
 */
IndexFile.readIndexBetweenKeys = readIndexBetweenKeys;

/**
 * cache of fast index data across instances of WordPOS class
 *
 * @type {object}
 */
var cache = {};



module.exports = IndexFile;
