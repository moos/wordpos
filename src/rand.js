/*!
 * rand.js
 *
 * 		define rand() and randX() functions on wordpos
 *
 * Copyright (c) 2012-2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var _ = require('underscore')._,
  util = require('util'),
  Trie = require('../lib/natural/trie/trie'),
  IndexFile = require('./indexFile'),
  KEY_LENGTH = 3;


/**
 * factory function for randX()
 *
 * @param pos {string} - a,r,n,v
 * @returns {Function} - rand function bound to an index file
 */
function makeRandX(pos){
  return function(opts, callback, _noprofile) {
    // disable profiling when isX() used internally
    var profile = this.options.profile && !_noprofile,
      start = profile && new Date(),
      args = [],
      index = this.getFilesFor(pos).index,
      startsWith = opts && opts.startsWith || '',
      count = opts && opts.count || 1;

    if (typeof opts === 'function') {
      callback = opts;
    }

    index.rand(startsWith, count, function(record) {
      args.push(record, startsWith);
      profile && args.push(new Date() - start);
      callback.apply(null, args);
    });
  };
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
        trie = new Trie();
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
    task = 'rand:' + key + nextKey,
    context = [startsWith, num, callback]; // last arg MUST be callback

  // pay the piper
  this.piper(task, IndexFile.readIndexBetweenKeys, args, context, collector);

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

      var trie = new Trie();

      trie.addStrings(matches);
      //console.log('Trie > ', trie.matchesWithPrefix( startsWith ));

      matches = trie.keysWithPrefix( startsWith );
    }

    var words = _.sample(matches, num);
    callback(words, startsWith);
  }
}

/**
 * rand() - for all Index files
 */
function randAll(opts, callback) {
  var
    profile = this.options.profile,
    start = profile && new Date(),
    results = [],
    startsWith = opts && opts.startsWith || '',
    count = opts && opts.count || 1,
    args = [null, startsWith],
    parts = 'Noun Verb Adjective Adverb'.split(' '),
    self = this,
    done = function(){
      profile && (args.push(new Date() - start));
      args[0] = results;
      callback.apply(null, args)
    };

  if (typeof opts === 'function') {
    callback = opts;
  } else {
    opts = _.clone(opts);
  }

  // TODO -- or loop count times each time getting 1 from random part!!
  // slower but more random.

  // select at random a part to look at
  var doParts = _.sample(parts, parts.length);
  tryPart();

  function tryPart(){
    var rand = 'rand' + doParts.pop();
    self[ rand ](opts, partCallback);
  }

  function partCallback(result){
    if (result) {
      results = _.uniq(results.concat(result));  // make sure it's unique!
    }

    //console.log(result);
    if (results.length < count && doParts.length) {
      // reduce count for next part -- NO! may get duplicates
      // opts.count = count - results.length;
      return tryPart();
    }

    // trim excess
    if (results.length > count) {
      results.length = count;
    }
    done();
  }
}

/**
 * bind rand() to index
 *
 * @param index {object} - the IndexFile instance
 * @returns {function} - bound rand function for index
 */
function randomify(index){
  if (!index.fastIndex) throw 'rand requires fastIndex';
  return _.bind(rand, index);
}



module.exports = {

  init: function(wordposProto) {
    wordposProto.nounIndex.rand = randomify(wordposProto.nounIndex);
    wordposProto.verbIndex.rand = randomify(wordposProto.verbIndex);
    wordposProto.adjIndex.rand = randomify(wordposProto.adjIndex);
    wordposProto.advIndex.rand = randomify(wordposProto.advIndex);

    /**
     * define rand()
     */
    wordposProto.rand = randAll;

    /**
     * define randX()
     */
    wordposProto.randAdjective = makeRandX('a');
    wordposProto.randAdverb = makeRandX('r');
    wordposProto.randNoun = makeRandX('n');
    wordposProto.randVerb = makeRandX('v');
  }
};

