/**
 * browser/indexFile.js
 *
 * Copyright (c) 2012-2019 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

import { indexLookup } from '../common';
import BaseFile from './baseFile';

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
 * IndexFile class
 *
 * @param dictPath {string} - WordNet db dict path
 * @param posName {string} - name of index: noun, verb, adj, adv
 * @constructor
 */
class IndexFile extends BaseFile {

  constructor(dictPath, posName) {
    super('index', dictPath, posName);
  }

  lookup() {
    return this.ready(indexLookup, arguments);
  }

  find() {
    return this.ready(find, arguments);
  }
}

export default IndexFile;
