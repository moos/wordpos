/**
* rand.js
*
* Copyright (c) 2012-2019 mooster@42at.com
* https://github.com/moos/wordpos
*
* Released under MIT license
*/

var { uniq, sample } = require('./util');

/**
 * factory function for randX()
 *
 * @param pos {string} - a,r,n,v
 * @returns {Function} - rand function bound to an index file
 * @this WordPOS
 */
function randX(pos){
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
 * rand() - for all Index files
 *
 * @param [opts] {object} options
 * @param opts.startsWith {string} string random words should start with
 * @param opts.count {integer} number of random words to return
 * @param callback {function} - callback receives (results, startsWith, profile)
 * @returns {Promise} receives results
 * @this WordPOS
 */
function rand(opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else {
    opts = Object.assign({
      startsWith: '',
      count: 1
    }, opts);
  }

  var
    profile = this.options.profile,
    start = profile && new Date(),
    results = [],
    count = opts.count,
    args = [null, opts.startsWith],
    parts = 'Noun Verb Adjective Adverb'.split(' '),
    self = this;

  return new Promise(function(resolve, reject) {
    // select at random a POS to look at
    var doParts = sample(parts, parts.length);
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
        results = uniq(results.concat(result));  // make sure it's unique!
      }

      if (results.length < count && doParts.length) {
        return tryPart();
      }

      // final random and trim excess
      results = sample(results, count);
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


// relative weight of each POS word count (DB 3.1 numbers)
const POS_factor = {
  Noun: 26,
  Verb: 3,
  Adjective: 5,
  Adverb: 1,
  Total: 37
};

module.exports = {
  randX,
  rand
};
