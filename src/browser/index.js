/**
* browser/index.js
*
* Copyright (c) 2012-2019 mooster@42at.com
* https://github.com/moos/wordpos
*
* Released under MIT license
*/

const { stopwords, prepText, makeStopwordString, flat } = require('../util');
const { is, get, getPOS, lookup, seek, lookupPOS } = require('../common');
const { randX, rand } = require('../rand');
const IndexFile = require('./indexFile');
const DataFile = require('./dataFile');

const POS = {
  n: 'noun',
  v: 'verb',
  a: 'adj',
  r: 'adv'
};


class WordPOS {

  options = {};

  constructor(config) {
    this.options = Object.assign({}, WordPOS.defaults, config);

    this.initFiles();
    if (Array.isArray(this.options.stopwords)) {
      this.options.stopwords = makeStopwordString(this.options.stopwords);
    }
  }

  ready() {
    return this.loaded || Promise.resolve();
  }

  initFiles() {
    const keys = Object.keys(POS);
    const loadOne = (Comp, pos) => new Comp(this.options.dictPath, POS[pos], this.options);
    const loader = (Comp) => keys.map(loadOne.bind(null, Comp));
    const reducer = (arr) => arr.reduce((coll, item, i) => (coll[keys[i]] = item, coll), {});

    this.indexFiles = reducer(loader(IndexFile));
    this.dataFiles = reducer(loader(DataFile));

    if (this.options.preload) {
      this.loaded = this.preloadFiles(this.options.preload);
    }
  }

  getFilesFor(pos) {
    return {
      index: this.indexFiles[pos],
      data: this.dataFiles[pos]
    };
  }

  /**
   * loads index files
   *
   * @param  {string|Array} [pos] POS to load (default: all)
   * @return {Promise.<index data>}
   */
  preloadFiles(pos) {
    let promise = this._preload(this.indexFiles, pos);
    if (this.options.includeData) {
      promise = Promise.all([].concat(promise, this._preload(this.dataFiles, pos)))
        .then(res => flat(res));
    }
    return promise;
  }

  _preload(files, pos) {
    let load = p => files[p].load();
    let promise;

    if (!pos || pos === true) { // preload all
      promise = Promise.all(Object.keys(POS).map(load));
    }
    else if (typeof pos === 'string' && files[pos]) {
      promise = load(pos);
    }
    else if (pos instanceof Array) {
      promise = Promise.all(pos.map(load));
    }
    return promise || Promise.reject(new RangeError(`Unknown POS "${pos}" for preload.`));
  }

  parse = prepText;

  seek = seek;

  /**
   * isX() - Test if word is given POS
   * @see is
   */
  isAdjective = is('a');
  isAdverb = is('r');
  isNoun = is('n');
  isVerb = is('v');

  /**
   * getX() - Find all words in string that are given POS
   * @see get
   */
  getPOS = getPOS;
  getAdjectives = get('isAdjective');
  getAdverbs = get('isAdverb');
  getNouns = get('isNoun');
  getVerbs = get('isVerb');

  /**
   * lookupX() - Lookup word definition if already know POS
   * @see lookup
   */
  lookup = lookupPOS;
  lookupAdjective = lookup('a');
  lookupAdverb = lookup('r');
  lookupNoun = lookup('n');
  lookupVerb = lookup('v');

  /**
   * define randX()
   * @see makeRandX
   */
  rand = rand;
  randAdjective = randX('a');
  randAdverb = randX('r');
  randNoun = randX('n');
  randVerb = randX('v');

}

WordPOS.defaults = {
  /**
   * path to WordNet data (override only if not using wordnet-db)
   * @type {string}
   */
  dictPath: '',

  /**
   * enable profiling, time in msec returned as second argument in callback
   * @type {boolean}
   */
  profile: false,

  /**
   * if true, exclude standard stopwords.
   * if array, stopwords to exclude, eg, ['all','of','this',...]
   * if false, do not filter any stopwords.
   * @type {boolean}
   */
  stopwords: true,

  /**
   * preload files.
   *    true - preload all POS
   *    false - do not preload any POS
   *    'a' - preload adj
   *    ['a','v'] - preload adj & verb
   * @type {boolean|string|Array}
   */
  preload: false,

  /**
   * include data files in preload
   * @type {boolean}
   */
  includeData: false,

  /**
   * set to true to enable debug logging
   * @type {boolean}
   */
  debug: false

};

/**
 * access to WordNet DB
 * @type {object}
 */
// WordPOS.WNdb = WNdb;  // FIXME

/**
 * access to stopwords
 * @type {Array}
 */
WordPOS.stopwords = stopwords;

WordPOS.POS = POS;

// Export as CJS handled by Parcel, otherwise will get WordPOS.default
// if use: export default WordPOS;
module.exports = WordPOS;
