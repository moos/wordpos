/**
 * fastIndex.js
 *
 * 		override natural.WordNet's IndexFile to use fast index data
 *
 */

var _ = require('underscore')._,
  util = require('util'),
  path = require('path'),
  fs = require('fs'),
  KEY_LENGTH = 3;

// load fast index bucket data
function loadFastIndex(dir, name) {
  var jsonFile = path.join(dir, 'fast-' + name + '.json'),
    data = null;
  try{
    data = JSON.parse( fs.readFileSync(jsonFile,'utf8') );
    //console.log('loaded %d buckets for %s', data.stats.buckets, data.name);
  } catch(e) {
    console.error('Error with fast index file %s\n  ', jsonFile, e);
  }
  return data;
}

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

function find(search, callback) {
  var self = this,
    data = this.fastIndex,
    readCallbacks = this.cache,
    miss = {status: 'miss'},
    args = [search, callback];

  var key = search.slice(0, KEY_LENGTH);
  if (!(key in data.offsets)) return callback(miss);

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

    readCallbacks[key].forEach( test );
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

function find____(search, callback) {
//  console.log('   >> ', search, this.fileName, this.fd);
  var self = this,
    data = this.fastIndex,
    miss = {status: 'miss'};

  var key = search.slice(0, KEY_LENGTH);
  if (!(key in data.offsets)) return callback(miss);

  if (!this.fd) {
//    console.log(' ... opening', this.filePath);
    this.fd = fs.openSync(this.filePath, 'r');
  }

  // ref count so we know when to close the main index file
  ++this.refcount;

  var offset = data.offsets[key][0],
    nextKey = data.offsets[key][1],
    nextOffset = data.offsets[nextKey][0],
    len = nextOffset - offset - 1,
    buffer = new Buffer(len),
    pos = Math.ceil(len / 2) - 0;

  console.log('--', offset, len, offset+len, offset+pos);

  // call base class's _findAt to search only relevant portion
  this._findAt(this.fd, // fd
      offset+len * 1,	// size (more like 'end' of buffer)
      offset+pos, 	// pos
      null, 		// lastPos
      pos * 1, 		// adjustment
      search, 		// key
      done);		// callback

  function done(result) {
    //console.log(self.refcount, search, result && result.line);
    if (--self.refcount == 0) {
      //console.log(' ... closing', self.filePath);
      fs.close(self.fd);
      self.fd = null;
    }
    callback(result);
  }
}

// cache of fast index data across instances of WordPOS class
var cache = {};

module.exports = {
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
