/*!
 * fastIndex.js
 *
 * 		override natural.WordNet's IndexFile to use fast index data
 *
 * Copyright (c) 2012-2014 mooster@42at.com
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
 * @param key - 3-char key into fast index
 * @param index - index object
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
 * read index file using fast index data at keyStart to keyEnd (inclusive)
 *
 * @param keyStart {string} - 3-char key into fast index to begin at
 * @param keyEnd {string|null} - 3-char key into fast index to end at.  If null, reads to next key.
 * @param index - index object
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
    buffer = new Buffer(len);

  //console.log('### readIndexBetweenKeys', keyStart, keyEnd, nextKey, len)
  fs.read(index.fd, buffer, 0, len, offset, function(err, count){
     if (err) return console.log(err);
     // console.log('  read %d bytes for <%s>', count, keyStart);
     callback(buffer);
  });
}

/**
 * run single 'task' method sharing callbacks.  Method MUST take callback as LAST arg.
 * piper is bound to an index.
 *
 * @param task {string} - task name unique to method!
 * @param method {function} - method to execute, gets (args, ... , callback)
 * @param args {array} - args to pass to method
 * @param context {object} - other params to remember and sent to callback
 * @param callback {function} - result callback
 */
function piper(task, method, args, context, callback){
  var readCallbacks = this.callbackQueue,
    memoArgs = _.rest(arguments, 2),
    wrappedCallback;

  // console.log('piper', task, args[0], context[0]);

  // queue up if already reading file for this task
  if (task in readCallbacks){
    readCallbacks[task].push(memoArgs);
    return;
  }
  readCallbacks[task] = [memoArgs];

  if (!this.fd) {
    //console.log(' ... opening', this.filePath);
    this.fd = fs.openSync(this.filePath, 'r');
  }

  // ref count so we know when to close the main index file
  ++this.refcount;

  wrappedCallback = _.partial(piper.wrapper, this, task);

  // call method -- replace original callback (last arg) with wrapped one
  method.apply(null, [].concat( args, wrappedCallback ));
}

// result is the *same* for same task
piper.wrapper = function(self, task, result){
  var readCallbacks = self.callbackQueue,
    callback, args;

  // live access callbacks cache in case nested cb's
  // add to the array.
  while (args = readCallbacks[task].shift()) {
    callback = args.pop(); // last arg MUST be callback

//    console.log('>>>> pper wrapper', self.fastIndex.name, task, result.toString())
    callback.apply(null, [].concat(_.flatten(args, /*shallow*/true), result));
  }

  // now done - delete cb cache
  delete readCallbacks[task];

  if (--self.refcount === 0) {
    //console.log(' ... closing', self.filePath);
    fs.close(self.fd);
    self.fd = null;
  }
};

/**
 * function that overrides WordNet's IndexFile.find()
 *
 * calls to same bucket are queued for callback.
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
  var task = 'find' + key,
    args = [key, this],
    context = [search, callback]; // last arg MUST be callback

  // pay the piper
  this.piper(task, readIndexForKey, args, context, collector);

  function collector(key, index, search, callback, buffer){
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
 * rand function (bound to index)
 *
 * @param startsWith {string} - get random word(s) that start with this, or ''
 * @param num {number} - number of words to return
 * @param callback {function} - callback function, receives words array and startsWith
 */
function rand(startsWith, num, callback){
  var self = this,
    nextKey = null,
    trie = this.fastIndex.trie,
    key, keys;

  //console.log('-- ', startsWith, num, self.fastIndex.indexKeys.length);
  if (startsWith){
    key = startsWith.slice(0, KEY_LENGTH);

    /**
     * if key is 'a' or 'ab' (<3 chars), search for ALL keys starting with that.
     */
    if (key.length < KEY_LENGTH) {

      // calc trie if haven't done so yet
      if (!trie){
        var natural = require('natural');

        trie = new natural.Trie();
        trie.addStrings(self.fastIndex.indexKeys);
        this.fastIndex.trie = trie;
        //console.log(' +++ Trie calc ');
      }

      try{
        // trie throws if not found!!!!!
        keys = trie.keysWithPrefix( startsWith );
      } catch(e){
        keys = [];
      }

      // read all keys then select random word.
      // May be large disk read!
      key = keys[0];
      nextKey = _.last(keys);
    }

    if (!key || !(key in self.fastIndex.offsets)) return process.nextTick(function(){ callback([], startsWith) });

  } else {
    // no startWith given - random select among keys
    keys = _.sample( this.fastIndex.indexKeys, num );

    // if num > 1, run each key independently and collect results
    if (num > 1){
      var results = [], ii = 0;
      _(keys).each(function(startsWith){
        self.rand(startsWith, 1, function(result){
          results.push(result[0]);
          if (++ii == num) {
            callback(results, '');
          }
        })
      });
      return;
    }
    key = keys;
  }
//  console.log(' using key', key, nextKey);

  // prepare the piper
  var args = [key, nextKey, this],
    task = 'rand' + key + nextKey,
    context = [startsWith, num, callback]; // last arg MUST be callback

  // pay the piper
  this.piper(task, readIndexBetweenKeys, args, context, collector);

  function collector(key, nextKey, index, startsWith, num, callback, buffer){
    var lines = buffer.toString().split('\n'),
      matches = lines.map(function(line){
        return line.substring(0,line.indexOf(' '));
      });

    //console.log(' got lines for key ', key, lines.length);

    // we got bunch of matches for key - now search within for startsWith
    if (startsWith !== key){

      // binary search for startsWith within set of matches
      var ind = _.sortedIndex(matches, startsWith);
      if (ind >= lines.length || matches[ind].indexOf(startsWith) === -1){
        return callback([], startsWith);
      }

      // FIXME --- using Trie's new keysWithPrefix not yet pushed to npm.
      // see https://github.com/NaturalNode/natural/commit/5fc86c42e41c1314bfc6a37384dd14acf5f4bb7b

      var natural = require('natural'),
        trie = new natural.Trie();

      trie.addStrings(matches);
      //console.log('Trie > ', trie.matchesWithPrefix( startsWith ));

      matches = trie.keysWithPrefix( startsWith );
    }

    var words = _.sample(matches, num);
    callback(words, startsWith);
  }
}

// cache of fast index data across instances of WordPOS class
var cache = {};

module.exports = {
  /**
   * loads fast index data and return fast index find function
   *
   * @param index {object} - the IndexFile instance
   * @returns {function} - fast index find or original find if errors
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
    index.fastIndex.indexKeys = Object.keys(index.fastIndex.offsets);
    index.fastIndex.trie = null;  // calc on demand

    index.refcount = 0;
    index.callbackQueue = {};
    index.piper = _.bind(piper, index);

    return find;
  },

  /**
   * bind rand() to index
   *
   * @param index {object} - the IndexFile instance
   * @returns {function} - bound rand function for index
   */
  rand: function(index){
    if (!index.fastIndex) throw 'rand requires fastIndex';
    return _.bind(rand, index);
  }
};

