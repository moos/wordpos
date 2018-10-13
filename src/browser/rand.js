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

    return index.rand(startsWith, count, function (record) {
      args.push(record, startsWith);
      profile && args.push(new Date() - start);
      callback && callback.apply(null, args);
    });
  };
}

/**
 * rand function (bound to index)
 *
 * @param startsWith {string} - get random word(s) that start with this, or ''
 * @param num {number} - number of words to return
 * @param callback {function} - callback function, receives words array and startsWith
 * @returns Promise
 */
function rand(startsWith, num, callback){
  var self = this,
    nextKey = null,
    trie = this.fastIndex.trie,
    key, keys;

  return new Promise(function(resolve, reject) {

    //console.log('-- ', startsWith, num, self.fastIndex.indexKeys.length);
    if (startsWith) {
      key = startsWith.slice(0, KEY_LENGTH);

      /**
       * if key is 'a' or 'ab' (<3 chars), search for ALL keys starting with that.
       */
      if (key.length < KEY_LENGTH) {

        // calc trie if haven't done so yet
        if (!trie) {
          trie = new Trie();
          trie.addStrings(self.fastIndex.indexKeys);
          self.fastIndex.trie = trie;
          //console.log(' +++ Trie calc ');
        }

        try {
          // trie throws if not found!!!!!
          keys = trie.keysWithPrefix(startsWith);
        } catch (e) {
          keys = [];
        }

        // read all keys then select random word.
        // May be large disk read!
        key = keys[0];
        nextKey = _.last(keys);
      }

      if (!key || !(key in self.fastIndex.offsets))  {
        callback && callback([], startsWith);
        resolve([]);
      }

    } else {
      // no startWith given - random select among keys
      keys = _.sample(self.fastIndex.indexKeys, num);

      // if num > 1, run each key independently and collect results
      if (num > 1) {
        var results = [], ii = 0;
        _(keys).each(function (startsWith) {
          self.rand(startsWith, 1, function (result) {
            results.push(result[0]);
            if (++ii == num) {
              callback && callback(results, '');
              resolve(results);
            }
          });
        });
        return;
      }
      key = keys;
    }

    // prepare the piper
    var args = [key, nextKey, self],
      task = 'rand:' + key + nextKey,
      context = [startsWith, num, callback]; // last arg MUST be callback

    // pay the piper
    self.piper(task, IndexFile.readIndexBetweenKeys, args, context, collector);

    function collector(key, nextKey, index, startsWith, num, callback, buffer) {
      var lines = buffer.toString().split('\n'),
        matches = lines.map(function (line) {
          return line.substring(0, line.indexOf(' '));
        });
      //console.log(' got lines for key ', key, lines.length);

      // we got bunch of matches for key - now search within for startsWith
      if (startsWith !== key) {
        // binary search for startsWith within set of matches
        var ind = _.sortedIndex(matches, startsWith);
        if (ind >= lines.length || matches[ind].indexOf(startsWith) === -1) {
          callback && callback([], startsWith);
          resolve([]);
          return;
        }

        var trie = new Trie();
        trie.addStrings(matches);
        //console.log('Trie > ', trie.matchesWithPrefix( startsWith ));
        matches = trie.keysWithPrefix(startsWith);
      }

      var words = _.sample(matches, num);
      callback && callback(words, startsWith);
      resolve(words);
    }

  }); // Promise
}

// relative weight of each POS word count (DB 3.1 numbers)
var POS_factor = {
  Noun: 26,
  Verb: 3,
  Adjective: 5,
  Adverb: 1,
  Total: 37
};

/**
 * rand() - for all Index files
 * @returns Promise
 */
function randAll(opts, callback) {

  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else {
    opts = _.clone(opts || {});
  }

  var
    profile = this.options.profile,
    start = profile && new Date(),
    results = [],
    startsWith = opts && opts.startsWith || '',
    count = opts && opts.count || 1,
    args = [null, startsWith],
    parts = 'Noun Verb Adjective Adverb'.split(' '),
    self = this;



  return new Promise(function(resolve, reject) {
    // select at random a POS to look at
    var doParts = _.sample(parts, parts.length);
    tryPart();

    function tryPart() {
      var part = doParts.pop(),
        rand = 'rand' + part,
        factor = POS_factor[part],
        weight = factor / POS_factor.Total;

      // pick count according to relative weight
      opts.count = Math.ceil(count * weight * 1.1); // guard against dupes
      self[rand](opts, partCallback);
    }

    function partCallback(result) {
      if (result) {
        results = _.uniq(results.concat(result));  // make sure it's unique!
      }

      if (results.length < count && doParts.length) {
        return tryPart();
      }

      // final random and trim excess
      results = _.sample(results, count);
      done();
    }

    function done() {
      profile && (args.push(new Date() - start));
      args[0] = results;
      callback && callback.apply(null, args);
      resolve(results);
    }

  }); // Promise
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

