/*!
 * node/rand.js
 *
 * 		define rand() and randX() functions on wordpos
 *
 * Copyright (c) 2012-2019 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var _ = require('underscore')._,
  { randX, rand } = require('../rand'),
  Trie = require('../../lib/natural/trie/trie'),
  IndexFile = require(`./indexFile`),
  KEY_LENGTH = 3;

/**
 * rand function (bound to index)
 *
 * @param startsWith {string} - get random word(s) that start with this, or ''
 * @param num {number} - number of words to return
 * @param callback {function} - callback function, receives words array and startsWith
 * @returns Promise
 * @this IndexFile
 */
function randomizer(startsWith, num, callback){
  var self = this,
    nextKey = null,
    trie = this.fastIndex.trie,
    key, keys;

  return new Promise(function(resolve, reject) {
    // console.log('-- ', startsWith, num, self.fastIndex.indexKeys.length);
    if (startsWith) {
      key = startsWith.slice(0, KEY_LENGTH);

      /**
       * if key is 'a' or 'ab' (<3 chars), search for ALL keys starting with that.
       */
      if (key.length < KEY_LENGTH) {

        // calc trie if haven't done so yet
        if (!trie) {
          // console.time('trie');
          trie = new Trie();
          trie.addStrings(self.fastIndex.indexKeys);
          self.fastIndex.trie = trie;
          //console.log(' +++ Trie calc ');
          // console.timeEnd('trie')
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

/**
 * bind rand() to index
 *
 * @param index {object} - the IndexFile instance
 * @returns {function} - bound rand function for index
 */
function randomify(index){
  if (!index.fastIndex) throw new Error('rand requires fastIndex');
  index.rand = _.bind(randomizer, index);
}


module.exports = {

  init: function(wordposProto) {
    randomify(wordposProto.nounIndex);
    randomify(wordposProto.verbIndex);
    randomify(wordposProto.adjIndex);
    randomify(wordposProto.advIndex);

    /**
     * define rand() (all POS)
     */
    wordposProto.rand = rand;

    /**
     * define randX()
     */
    wordposProto.randAdjective = randX('a');
    wordposProto.randAdverb = randX('r');
    wordposProto.randNoun = randX('n');
    wordposProto.randVerb = randX('v');
  }
};
