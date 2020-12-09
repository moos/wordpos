/**
* common.js
*
* Copyright (c) 2012-2019 mooster@42at.com
* https://github.com/moos/wordpos
*
* Portions: Copyright (c) 2011, Chris Umbel
*
* Released under MIT license
*/

var { normalize, nextTick, isString, uniq, sample, diff, flat } = require('./util');

function error(err, callback) {
  if (isString(err)) err = new RangeError(err);
  callback && callback(err, {});
  return Promise.reject(err);
}

/**
 * factory for main lookup function
 *
 * @param pos {string} - n/v/a/r
 * @returns {Function} - lookup function bound to POS
 * @this WordPOS
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
 * find a word and prepare its lexical record
 *
 * @param word {string} - search word
 * @param callback {function} - callback function receives result
 * @returns {Promise.<IndexRecord>}
 * @this IndexFile
 *
 * Credit for this routine to https://github.com/NaturalNode/natural
 */
function indexLookup(word, callback) {
  var self = this;
  return new Promise(function(resolve, reject){
    self.find(word, function (record) {
      var indexRecord = null,
        i;

      if (record.status == 'hit') {
        var ptrs = [], offsets = [];
        let n = parseInt(record.tokens[3]);

        for (i = 0; i < n; i++) {
          ptrs.push(record.tokens[i]);
        }

        n = parseInt(record.tokens[2]);
        for (i = 0; i < n; i++) {
          offsets.push(record.tokens[ptrs.length + 6 + i]);
        }

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
 * lookup a word in all indexes
 *
 * @param word {string} - search word
 * @param callback {Function} (optional) - callback with (results, word) signature
 * @returns {Promise}
 * @this WordPOS
 */
function lookupPOS(word, callback) {
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
}

/**
 * getX() factory function
 *
 * @param isFn {function} - an isX() function
 * @returns {Function}
 * @this IndexFile
 */
function get(isFn) {
  return function(text, callback, _noprofile) {
    var profile = this.options.profile && !_noprofile,
      start = profile && new Date(),
      words = this.parse(text),
      results = [],
      self = this,
      first = words[0];

    // test one first & check for error, otherwise
    // map is inoccuous to errors!
    return exec(first)
      .then(() => Promise.all(words.slice(1).map(exec)))
      .then(done)
      .catch(err => {
        // done(); // callback signature is same!  // FIXME
        return Promise.reject(err);
      });

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

/**
 * getPOS() - Find all POS for all words in given string
 *
 * @param text {string} - words to lookup for POS
 * @param callback {function} (optional) - receives object with words broken into POS or 'rest', ie,
 * 	    Object: {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]}
 * @return Promise - resolve function receives data object
 */
function getPOS(text, callback) {
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
    var args = [data];
    var matches = uniq(flat(Object.values(data)));
    data.rest = diff(words, matches);
    profile && args.push(new Date() - start);
    nextTick(callback, args);
    return data;
  }

  function error(err) {
    console.log('Error >>> ', err);
    nextTick(callback, []);
    throw err;
  }
}

/**
 * isX() factory function
 *
 * @param pos {string} - n/v/a/r
 * @returns {Function}
 * @this WordPOS
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
 * parse a single data file line, returning data object
 *
 * @param line {string} - a single line from WordNet data file
 * @returns {object}
 *
 * Credit for this routine to https://github.com/NaturalNode/natural
 */
function lineDataToJSON(line, location) {
  var data = line.split('| '),
    tokens = data[0].split(/\s+/),
    ptrs = [],
    wCnt = parseInt(tokens[3], 16),
    synonyms = [],
    i;

  for(i = 0; i < wCnt; i++) {
    synonyms.push(tokens[4 + i * 2]);
  }

  var ptrOffset = (wCnt - 1) * 2 + 6;
  let n = parseInt(tokens[ptrOffset], 10);
  for(i = 0; i < n; i++) {
    ptrs.push({
      pointerSymbol: tokens[ptrOffset + 1 + i * 4],
      synsetOffset: tokens[ptrOffset + 2 + i * 4],
      pos: tokens[ptrOffset + 3 + i * 4],
      sourceTarget: tokens[ptrOffset + 4 + i * 4]
    });
  }

  // break "gloss" into definition vs. examples
  var glossArray = data[1].split('; ');
  var definition = glossArray[0];
  var examples = glossArray.slice(1);
  var lexFilenum = parseInt(tokens[1], 10);

  for (var k = 0; k < examples.length; k++) {
    examples[k] = examples[k].replace(/\"/g,'').replace(/\s\s+/g,'');
  }

  return {
    synsetOffset: tokens[0],
    lexFilenum: lexFilenum,
    lexName: LEX_NAMES[ lexFilenum ],
    pos: tokens[2],
    wCnt: wCnt,
    lemma: tokens[4],
    synonyms: synonyms,
    lexId: tokens[5],
    ptrs: ptrs,
    gloss: data[1],
    def: definition,
    exp: examples
  };
}


/**
 * seek - get record at offset for pos
 *
 * @param offset {number} - synset offset
 * @param pos {string} - POS a/r/n/v
 * @param callback {function} - optional callback
 * @returns Promise
 * @this WordPOS
 */
function seek(offset, pos, callback){
  var offsetTmp = Number(offset);
  if (isNaN(offsetTmp) || offsetTmp <= 0) return error('Offset must be valid positive number: ' + offset, callback);

  var data = this.getFilesFor(pos).data;
  if (!data) return error('Incorrect POS - 2nd argument must be a, r, n or v.', callback);

  return data.lookup(offset, callback);
}

const LEX_NAMES = [
 'adj.all',
 'adj.pert',
 'adv.all',
 'noun.Tops',
 'noun.act',
 'noun.animal',
 'noun.artifact',
 'noun.attribute',
 'noun.body',
 'noun.cognition',
 'noun.communication',
 'noun.event',
 'noun.feeling',
 'noun.food',
 'noun.group',
 'noun.location',
 'noun.motive',
 'noun.object',
 'noun.person',
 'noun.phenomenon',
 'noun.plant',
 'noun.possession',
 'noun.process',
 'noun.quantity',
 'noun.relation',
 'noun.shape',
 'noun.state',
 'noun.substance',
 'noun.time',
 'verb.body',
 'verb.change',
 'verb.cognition',
 'verb.communication',
 'verb.competition',
 'verb.consumption',
 'verb.contact',
 'verb.creation',
 'verb.emotion',
 'verb.motion',
 'verb.perception',
 'verb.possession',
 'verb.social',
 'verb.stative',
 'verb.weather',
 'adj.ppl'
];

module.exports= {
  indexLookup,
  is,
  get,
  seek,
  getPOS,

  lineDataToJSON,
  LEX_NAMES,
  lookup,
  lookupPOS
}
