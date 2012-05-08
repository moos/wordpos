/**
* wordpos
*
*    Node.js part-of-speech utilities using natural's WordNet module.
*
* Copyright (c) 2012 mooster@42at.com
* Released under MIT license
*/

var _ = require('underscore')._,
  util = require('util'),
  natural = require('natural'),
  WordNet = natural.WordNet,
  tokenizer = new natural.WordTokenizer(),
  stopwords = ' '+ natural.stopwords.join(' ') +' ',
  WNdb = require('WNdb');

function normalize(word) {
  return word.toLowerCase().replace(/\s+/g, '_');
}

function isStopword(word) {
  return stopwords.indexOf(' '+word+' ') >= 0;
}

function prepText(text) {
  return _.reject(_.uniq(tokenizer.tokenize(text)), isStopword);
}

function lookup(pos) {
  return function(word, callback) {
    var profile = this.options.profile,
      start = profile && new Date(),
      args = [];
    word = normalize(word);
    this.lookupFromFiles([
        {index: this.getIndexFile(pos), data: this.getDataFile(pos)}
        ], [], word, function(results){
        args.push(results);
        profile && args.push(new Date() - start);
        callback.apply(null, args);
    });
  };
}

function is(pos){
  return function(word, callback, _noprofile) {
    // disable profiling when isX() used internally
    var profile = this.options.profile && !_noprofile,
      start = profile && new Date(),
      args = [],
      index = this.getIndexFile(pos);
    word = normalize(word);
    index.lookup(word, function(record) {
      args.push(!!record);
      profile && args.push(new Date() - start);
      callback.apply(null, args);
    });
  };
}

function get(isFn) {
  return function(text, callback) {
    var profile = this.options.profile,
      start = profile && new Date(),
      words = prepText(text),
      n = words.length,
      i = 0,
      self = this,
      results = [],
      args = [results];
    profile && args.push(0);
    if (!n) return callback.apply(null, args);
    words.forEach(function(word,j){
      self[isFn](word, function(yes){
        yes && results.push(word);
        if (++i==n) {
          profile && (args[1] = new Date() - start);
          callback.apply(null, args);
        }
      }, /*_noprofile*/ true);
    });
  };
}

/**
 * @class WordPOS
 * @constructor
 */
var WordPOS = function(options) {
  if (arguments.length == 0 || _.isObject(options)) {
    WordPOS.super_.call(this, WNdb.path);
  } else {
    WordPOS.super_.apply(this, arguments);
  }
  this.options = _.defaults({}, _.isObject(options) && options || {}, WordPOS.defaults);
};
util.inherits(WordPOS, WordNet);

WordPOS.defaults = {
  /**
   * enable profiling, time in msec returned as second argument in callback
   */
  profile: false
};

var wordposProto = WordPOS.prototype;

// fast POS lookups (only look in specified file)
/**
 * lookupX()
 * Lookup word definition if already know POS
 *
 * @param string word - word to lookup in given POS
 * @param function callback receives array of definition objects or empty
 * @return none
 */
wordposProto.lookupAdjective = lookup('a');
wordposProto.lookupAdverb = lookup('r');
wordposProto.lookupNoun = lookup('n');
wordposProto.lookupVerb = lookup('v');

/**
 * isX()
 * Test if word is given POS
 *
 * @param string word - word to test for given POS
 * @param function Callback receives true or false if word is given POS
 * @return none
 */
wordposProto.isAdjective = is('a');
wordposProto.isAdverb = is('r');
wordposProto.isNoun = is('n');
wordposProto.isVerb = is('v');

/**
 * getX()
 * Find all words in string that are given POS
 *
 * @param string Text Words to search
 * @param function callback Receives array of words that are given POS
 * @return none
 */
wordposProto.getAdjectives = get('isAdjective');
wordposProto.getAdverbs = get('isAdverb');
wordposProto.getNouns = get('isNoun');
wordposProto.getVerbs = get('isVerb');

if (!wordposProto.getIndexFile) {
    wordposProto.getIndexFile = function getIndexFile(pos) {
      switch(pos) {
        case 'n':
          return this.nounIndex;
        case 'v':
          return this.verbIndex;
        case 'a': case 's':
          return this.adjIndex;
        case 'r':
          return this.advIndex;
      }
  };
}

/**
 * getPOS()
 * Find all POS for all words in given string
 *
 * @param string text - words to lookup for POS
 * @param function callback - receives object with words broken into POS or 'rest':
 * 	    Object: {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]}
 * @return none
 */
wordposProto.getPOS = function(text, callback) {
  var data = {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]},
    profile = this.options.profile,
    start = profile && new Date(),
    args = [data],
    testFns = 'isNoun isVerb isAdjective isAdverb'.split(' '),
    parts = 'nouns verbs adjectives adverbs'.split(' '),
    words = prepText(text),
    nTests = testFns.length,
    nWords = words.length,
    self = this,
    c = 0;

  profile && args.push(0);
  if (!nWords) return callback.apply(null, args);
  words.forEach(lookup);

  function lookup(word){
    var any = false,
      t=0;
    word = normalize(word);
    testFns.forEach(lookupPOS);

    function lookupPOS(isFn,i,list){
      self[isFn](word, function(yes){
        yes && data[parts[i]].push(word);
        any |= yes;
        donePOS();
      });
    }

    function donePOS() {
      if (++t == nTests) {
        !any && data['rest'].push(word);
        done();
      }
    }
  }

  function done(){
    if (++c == nWords) {
      profile && (args[1] = new Date() - start);
      callback.apply(null, args);
    }
  }
};

module.exports = WordPOS;
