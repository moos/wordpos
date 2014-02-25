/**
 * fastIndex.js
 *
 * 		override natural.WordNet's IndexFile to use fast index data
 *
 * Copyright (c) 2012 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var _ = require('underscore')._,
  util = require('util'),
  path = require('path'),
  fs = require('fs'),
  KEY_LENGTH = 3;

/**
 * load fast index bucket data
 * @param dir - dir path of index files
 * @param name - name of index file, eg, 'index.verb'
 * @returns Object - fast index data object
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
 * @param key - 3-char key into fast index
 * @param index - index file name (eg, 'index.verb')
 * @param callback - function receives buffer of data read
 * @returns none
 */
function readIndexForKey(key, index, callback) {
  var data = index.fastIndex,
    offset = data.offsets[key][0],
    nextKey = data.offsets[key][1],
    nextOffset = data.offsets[nextKey][0],
    len = nextOffset - offset - 1,
    buffer = new Buffer(len);

  fs.read(index.fd, buffer, 0, len, offset, function(err, count){
     if (err) return console.log(err);
     //console.log('  read %d bytes for <%s>', count, key);
     callback(buffer);
  });
}

/**
 * function that overrides WordNet's IndexFile.find()
 *
 * calls to same bucket are queued for callback.
 *
 * @param search - word to search for
 * @param callback - callback receives found line and tokens
 * @returns none
 */
function find(search, callback) {
  var self = this,
    data = this.fastIndex,
    readCallbacks = this.cache,
    miss = {status: 'miss'},
    args = [search, callback];

  var key = search.slice(0, KEY_LENGTH);
  if (!(key in data.offsets)) return process.nextTick(function(){ callback(miss) });

  // queue up if already reading file for this key
  if (key in readCallbacks){
    readCallbacks[key].push(args);
    return;
  }
  readCallbacks[key] = [args];
  if (!this.fd) {
    //console.log(' ... opening', this.filePath);
    this.fd = fs.openSync(this.filePath, 'r');
  }

  // ref count so we know when to close the main index file
  ++this.refcount;

  readIndexForKey(key, this, function (buffer){
    var lines = buffer.toString().split('\n'),
      keys = lines.map(function(line){
        return line.substring(0,line.indexOf(' '));
      });

    // live access callbacks cache in case nested cb's
    // add to the array.
    while (readCallbacks[key].length) {
      test(readCallbacks[key].shift());
    }

    // now done - delete cb cache
    delete readCallbacks[key];

    if (--self.refcount == 0) {
        //console.log(' ... closing', self.filePath);
        fs.close(self.fd);
        self.fd = null;
    }

    function test(item) {
      var search = item[0],
        callback = item[1],
        ind = _.indexOf(keys, search, /*isSorted*/ true);	// binary search!
      //console.log(' %s is %d', search, ind);
      if (ind == -1) return callback(miss);

      var tokens = lines[ind].split(/\s+/),
        key = tokens[0],
        result = {status: 'hit', key: key, 'line': lines[ind], tokens: tokens};

      callback(result);
    }
  });
}

// cache of fast index data across instances of WordPOS class
var cache = {};

module.exports = {
  /**
   * loads fast index data and return fast index find function
   *
   * @param index is the IndexFile instance
   * @returns function - fast index find or origin find if errors
   */
  find: function(index){

    var key = index.filePath,
      data;

    if (!(key in cache)) {
      data = loadFastIndex(index.dataDir, index.fileName);
      cache[key] = data;
    }

    // if no fast index data was found or was corrupt, use original find
    if (!cache[key]) return index.find;

    index.fastIndex = cache[key];
    index.refcount = 0;
    index.cache = {};

    return find;
  }
};
