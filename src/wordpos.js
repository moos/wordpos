/*!
* wordpos.js
*
*    Node.js part-of-speech utilities using WordNet database.
*
* Copyright (c) 2012-2016 mooster@42at.com
* https://github.com/moos/wordpos
*
* Released under MIT license
*/

var _ = require('underscore')._,
  util = require('util'),
  stopwords = require('../lib/natural/util/stopwords').words,
  stopwordsStr = makeStopwordString(stopwords),
  WNdb = require('wordnet-db'),
  DataFile = require('./dataFile'),
  IndexFile = require('./indexFile');


function normalize(word) {
  return word.toLowerCase().replace(/\s+/g, '_');
}

function makeStopwordString(stopwords) {
  return ' '+ stopwords.join(' ') +' ';
}

function isStopword(stopwords, word) {
  return stopwords.indexOf(' '+word+' ') >= 0;
}

function tokenizer(str) {
  return str.split(/\W+/); //_.without(results,'',' ')
}

function prepText(text) {
  if (_.isArray(text)) return text;
  var deduped = _.uniq(tokenizer(text));
  if (!this.options.stopwords) return deduped;
  return _.reject(deduped, _.bind(isStopword, null,
    _.isString(this.options.stopwords) ? this.options.stopwords : stopwordsStr
  ));
}

/**
 * factory for main lookup function
 *
 * @param pos {string} - n/v/a/r
 * @returns {Function} - lookup function bound to POS
 */
function lookup(pos) {
  return function(word, callback) {
    var profile = this.options.profile,
      start = profile && new Date(),
      files = this.getFilesFor(pos),
      args = [];

    word = normalize(word);

    // lookup index
    return files.index.lookup(word)
      .then(function(result) {
        if (result) {
          // lookup data
          return files.data.lookup(result.synsetOffset).then(done);
        } else {
          // not found in index
          return done([]);
        }
      })
      .catch(done);

    function done(results) {
      if (results instanceof Error) {
        args.push([], word);
      } else {
        args.push(results, word);
      }
      //console.log(3333, args)
      profile && args.push(new Date() - start);
      nextTick(callback, args);
      return results;
    }
  };
}

/**
 * isX() factory function
 *
 * @param pos {string} - n/v/a/r
 * @returns {Function}
 */
function is(pos){
  return function(word, callback, _noprofile) {
    // disable profiling when isX() used internally
    var profile = this.options.profile && !_noprofile,
      start = profile && new Date(),
      args = [],
      index = this.getFilesFor(pos).index;
    word = normalize(word);

    return index
      .lookup(word)
      .then(function(record) {
        var result = !!record;
        args.push(result, word);
        profile && args.push(new Date() - start);
        nextTick(callback, args);
        return result;
      });
  };
}


/**
 * getX() factory function
 *
 * @param isFn {function} - an isX() function
 * @returns {Function}
 */
function get(isFn) {
  return function(text, callback, _noprofile) {
    var profile = this.options.profile && !_noprofile,
      start = profile && new Date(),
      words = this.parse(text),
      results = [],
      self = this;

    //if (!n) return (process.nextTick(done),0);
    return Promise
      .all(words.map(exec))
      .then(done);

    function exec(word) {
      return self[isFn]
        .call(self, word, null, /*_noprofile*/ true)
        .then(function collect(result) {
          result && results.push(word);
        });
    }

    function done(){
      var args = [results];
      profile && args.push(new Date() - start);
      nextTick(callback, args);
      return results;
    }
  };
}

// setImmediate executes callback AFTER promise handlers.
// Without it, exceptions in callback may be caught by Promise.
function nextTick(fn, args) {
  if (fn) {
    fn.apply(null, args);
  }
}


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
wordposProto.lookup = function(word, callback) {
  var self = this,
    results = [],
    profile = this.options.profile,
    start = profile && new Date(),
    methods = ['lookupAdverb', 'lookupAdjective', 'lookupVerb', 'lookupNoun'];

  return Promise
    .all(methods.map(exec))
    .then(done)
    .catch(error);

  function exec(method) {
    return self[ method ]
      .call(self, word)
      .then(function collect(result){
        results = results.concat(result);
      });
  }

  function done() {
    var args = [results, word];
    profile && args.push(new Date() - start);
    nextTick(callback, args);
    return results;
  }

  function error(err) {
    nextTick(callback, [[], word]);
    throw err;
  }
};


/**
 * getPOS() - Find all POS for all words in given string
 *
 * @param text {string} - words to lookup for POS
 * @param callback {function} (optional) - receives object with words broken into POS or 'rest', ie,
 * 	    Object: {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]}
 * @return Promise - resolve function receives data object
 */
wordposProto.getPOS = function(text, callback) {
  var self = this,
    data = {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]},
    profile = this.options.profile,
    start = profile && new Date(),
    words = this.parse(text),
    methods = ['getAdverbs', 'getAdjectives', 'getVerbs', 'getNouns'];

  return Promise
    .all(methods.map(exec))
    .then(done)
    .catch(error);

  function exec(method) {
    return self[ method ]
      .call(self, text, null, true)
      .then(function collect(results) {
        // getAdjectives --> adjectives
        var pos = method.replace('get','').toLowerCase();
        data[ pos ] =  results;
      });
  }

  function done() {
    var matches = _(data).chain()
      .values()
      .flatten()
      .uniq()
      .value(),
      args = [data];

    data.rest =  _(words).difference(matches);

    profile && args.push(new Date() - start);
    nextTick(callback, args);
    return data;
  }

  function error(err) {
    nextTick(callback, []);
    throw err;
  }
};

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
wordposProto.seek = function(offset, pos, callback){
  offset = Number(offset);
  if (_.isNaN(offset) || offset <= 0) return error('offset must be valid positive number.');

  var data = this.getFilesFor(pos).data;
  if (!data) return error('Incorrect POS - 2nd argument must be a, r, n or v.');

  return data.lookup(offset, callback);

  function error(msg) {
    var err = new Error(msg);
    callback && callback(err, {});
    return Promise.reject(err);
  }
};


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
