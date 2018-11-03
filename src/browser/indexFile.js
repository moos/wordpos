/**
 * browser/indexFile.js
 *
 * Copyright (c) 2012-2019 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

const { indexLookup } = require('../common');
const { sample } = require('../util');
const BaseFile = require('./baseFile');
const Trie = require('../../lib/natural/trie/trie');

/**
 * find a search term in an index file (using fast index)
 *
 * Calls to same bucket are queued for callback using the piper.
 *
 * @param search {string} - word to search for
 * @param callback {function} - callback receives found line and tokens
 * @returns none
 * @this IndexFile
 */
function find(search, callback) {
  var miss = {status: 'miss'};

  if (!(search in this.file)) {
    callback(miss);
    return;
  }

  var
    line = this.file[search],
    tokens = line.split(/\s+/),
    result = {
      status: 'hit',
      key: search,
      line: line,
      tokens: tokens
    };

  result.tokens.unshift(search);
  callback(result);
}

/**
 * Select <count> words at random for POS
 *
 * @param  {string} startsWith - string that results should start with
 * @param  {integer} count - number of results to return
 * @param  {Function} callback - receives (results, startsWith)
 * @return {Promise} receives results
 * @this IndexFile
 */
function rand(startsWith, count, callback) {
  const done = (res) => {
    callback(res, startsWith || '');
    return Promise.resolve(res);
  };

  const doSample = (values) => {
    let res = sample(values, count);
    // console.timeEnd('getkeys')
    return done(res);
  };

  const time = (label) => {
    this.options.debug && console.time(label + ' ' + this.posName);
  };

  const timeEnd = (label) => {
    this.options.debug && console.timeEnd(label + ' ' + this.posName);
  };

  if (!startsWith) {
    // console.time('getkeys')
    return doSample(this.getKeys());
  }

  // calc trie if haven't done so yet
  if (!this.trie) {
    time('Trie');
    this.trie = new Trie();
    this.trie.addStrings(this.getKeys());
    timeEnd('Trie');
  }

  let keys = [];
  time('trie-withprefix');
  keys = this.trie.keysWithPrefix(startsWith);
  timeEnd('trie-withprefix');

  // TODO cache results?

  return keys.length ? doSample(keys) : done([]);
}

/**
 * IndexFile class
 */
class IndexFile extends BaseFile {

  keys = null;

  /**
   * @param dictPath {string} - WordNet db dict path
   * @param posName {string} - name of index: noun, verb, adj, adv
   * @param {object} [options] - @see WordPOS options
   * @constructor
   */
  constructor(dictPath, posName, options) {
    super('index', dictPath, posName, options);
    this.options = Object.assign({}, options);
    this.posName = posName;
  }

  getKeys() {
    return this.keys || (this.keys = Object.keys(this.file));
  }

  lookup() {
    return this.ready(indexLookup, arguments);
  }

  find() {
    return this.ready(find, arguments);
  }

  rand() {
    return this.ready(rand, arguments);
  }
}

module.exports = IndexFile;
