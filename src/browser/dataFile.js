/**
 * browser/dataFile.js
 *
 * Copyright (c) 2012-2019 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Portions: Copyright (c) 2011, Chris Umbel
 *
 * Released under MIT license
 */

const { lineDataToJSON, LEX_NAMES } = require('../common');
const { zeroPad } = require('../util');
const BaseFile = require('./baseFile');

/**
 * get parsed line from data file
 *
 * @param  {string} offset The offset key
 * @return {object} Data record object
 * @this DataFile
 */
function seek(offset) {
  let str = this.file[offset];
  if (!str) return {};
  // offset was extracted for the key - add it back to line data
  return lineDataToJSON(offset + ' ' + str);
}

/**
 * lookup offsets in data file
 *
 * @param offsets {array} - array of offsets to lookup (obtained from index.find())
 * @param callback{function} (optional) - callback function
 * @returns {Promise.[<Object>]} array of or single data record
 * @this DataFile
 */
function lookup(offsets, callback) {
  var results = [],
    self = this,
    readLine = seek.bind(this),
    valid = (item => item.pos),
    single = !Array.isArray(offsets);

  if (single) offsets = [offsets];
  return new Promise(function(resolve, reject) {
    results = offsets
      .map(zeroPad)
      .map(readLine)
      .filter(valid);

    if (!results.length) {
      let err = new RangeError(`No data at offsets ${offsets.join()} in ${self.filePath}.`);
      callback && callback(err, single ? {} :[]);
      reject(err);
    } else {
      if (single) results = results[0];
      callback && callback(null, results);
      resolve(results);
    }
  });
}

/**
 * DataFile class
 *
 * @param dictPath {string} - path to dict folder
 * @param posName {string} - POS name
 * @constructor
 */
class DataFile extends BaseFile {

  constructor(dictPath, posName) {
    super('data', dictPath, posName);
  }

  lookup() {
    return this.ready(lookup, arguments);
  }
}

/**
 * map of lexFilenum to lex names
 *
 * @see https://wordnet.princeton.edu/wordnet/man/lexnames.5WN.html
 * @type {string[]}
 */
DataFile.LEX_NAMES = LEX_NAMES;

module.exports = DataFile;
