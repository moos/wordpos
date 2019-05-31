/*!
* node/index.js
*
*    Node.js part-of-speech utilities using WordNet database.
*
* Copyright (c) 2012-2019 mooster@42at.com
* https://github.com/moos/wordpos
*
* Released under MIT license
*/

var
  _ = require('underscore')._,
  util = require('util'),
  stopwordsStr,
  WNdb = require('wordnet-db'),
  DataFile = require('./dataFile'),
  IndexFile = require('./indexFile'),
  {
    nextTick,
    normalize,
    tokenizer,
    prepText,
    makeStopwordString,
    stopwords
  } = require('../util'),
  {
    is,
    get,
    getPOS,
    seek,
    lookup,
    lookupPOS
  } = require('../common');

stopwordsStr = makeStopwordString(stopwords);

/**
 * @class WordPOS
 * @param options {object} -- @see WordPOS.defaults
 * @constructor
 */
var WordPOS = function(options) {
  var dictPath;

  this.options = _.defaults({}, _.isObject(options) && options || {}, {
    dictPath: WNdb.path
  }, WordPOS.defaults);

  dictPath = this.options.dictPath;

  this.nounIndex = new IndexFile(dictPath, 'noun');
  this.verbIndex = new IndexFile(dictPath, 'verb');
  this.adjIndex = new IndexFile(dictPath, 'adj');
  this.advIndex = new IndexFile(dictPath, 'adv');

  this.nounData = new DataFile(dictPath, 'noun');
  this.verbData = new DataFile(dictPath, 'verb');
  this.adjData = new DataFile(dictPath, 'adj');
  this.advData = new DataFile(dictPath, 'adv');

  // define randX() functions
  require('./rand').init(this);

  if (_.isArray(this.options.stopwords)) {
    this.options.stopwords = makeStopwordString(this.options.stopwords);
  }
};


WordPOS.defaults = {
  /**
   * path to WordNet data (override only if not using wordnet-db)
   */
  dictPath: '',

  /**
   * enable profiling, time in msec returned as second argument in callback
   */
  profile: false,

  /**
   * if true, exclude standard stopwords.
   * if array, stopwords to exclude, eg, ['all','of','this',...]
   * if false, do not filter any stopwords.
   */
  stopwords: true
};

var wordposProto = WordPOS.prototype;

/**
 * lookup a word in all indexes
 *
 * @param word {string} - search word
 * @param callback {Function} (optional) - callback with (results, word) signature
 * @returns {Promise}
 */
wordposProto.lookup = lookupPOS;

/**
 * getPOS() - Find all POS for all words in given string
 *
 * @param text {string} - words to lookup for POS
 * @param callback {function} (optional) - receives object with words broken into POS or 'rest', ie,
 * 	    Object: {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]}
 * @return Promise - resolve function receives data object
 */
wordposProto.getPOS = getPOS;

/**
 * get index and data files for given pos
 *
 * @param pos {string} - n/v/a/r
 * @returns {object} - keys {index, data}
 */
wordposProto.getFilesFor = function (pos) {
  switch(pos) {
    case 'n':
      return {index: this.nounIndex, data: this.nounData};
    case 'v':
      return {index: this.verbIndex, data: this.verbData};
    case 'a': case 's':
    return {index: this.adjIndex, data: this.adjData};
    case 'r':
      return {index: this.advIndex, data: this.advData};
  }
  return {};
};


/**
 * lookupX() - Lookup word definition if already know POS
 * @see lookup
 */
wordposProto.lookupAdjective = lookup('a');
wordposProto.lookupAdverb = lookup('r');
wordposProto.lookupNoun = lookup('n');
wordposProto.lookupVerb = lookup('v');

/**
 * isX() - Test if word is given POS
 * @see is
 */
wordposProto.isAdjective = is('a');
wordposProto.isAdverb = is('r');
wordposProto.isNoun = is('n');
wordposProto.isVerb = is('v');

/**
 * getX() - Find all words in string that are given POS
 * @see get
 */
wordposProto.getAdjectives = get('isAdjective');
wordposProto.getAdverbs = get('isAdverb');
wordposProto.getNouns = get('isNoun');
wordposProto.getVerbs = get('isVerb');

/**
 * parse - get deduped, less stopwords
 *
 * @param text {string|array} - string of words to parse.  If array is given, it is left in tact.
 * @returns {array}
 */
wordposProto.parse = prepText;

/**
 * seek - get record at offset for pos
 *
 * @param offset {number} - synset offset
 * @param pos {string} - POS a/r/n/v
 * @param callback {function} - optional callback
 * @returns Promise
 */
wordposProto.seek = seek;

/**
 * access to WordNet DB
 * @type {object}
 */
WordPOS.WNdb = WNdb;

/**
 * access to stopwords
 * @type {Array}
 */
WordPOS.stopwords = stopwords;


module.exports = WordPOS;
