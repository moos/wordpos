/**
* util.js
*
* Copyright (c) 2012-2019 mooster@42at.com
* https://github.com/moos/wordpos
*
* Released under MIT license
*/

let stopwords = require('../lib/natural/util/stopwords').words;
let stopwordsStr = makeStopwordString(stopwords);

function makeStopwordString(stopwords) {
  return ' ' + stopwords.join(' ') + ' ';
}

// setImmediate executes callback AFTER promise handlers.
// Without it, exceptions in callback may be caught by Promise.
function nextTick(fn, args) {
  if (fn) {
    fn.apply(null, args);
  }
}

// offsets must be zero-padded to 8 chars
function zeroPad(str) {
  var pad = '00000000'; // 8 zeros
  return String(pad + str).slice(-pad.length);
}

function normalize(word) {
  return word.toLowerCase().replace(/\s+/g, '_');
}

function isStopword(stopwordsStr, word) {
  return stopwordsStr.indexOf(' '+ word.toLowerCase() +' ') >= 0;
}

function tokenizer(str) {
  return str.split(/\W+/);
}

function uniq(arr) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
}

function diff(arr, subArr) {
  return arr.filter(x => !subArr.includes(x));
}

// flatten an array - 1-deep only!
function flat(arr) {
  return [].concat.apply([], arr);
}

// get random sample from array (note: count << array.length)
// https://stackoverflow.com/a/37834217
function sample(array, count) {
  var indices = [];
  var result = new Array(count);
  for (let i = 0; i < count; i++ ) {
      let j = Math.floor(Math.random() * (array.length - i) + i);
      let val = array[indices[j] === undefined ? j : indices[j]];
      if (val === undefined) {
        result.length = i;
        break;
      }
      result[i] = val;
      indices[j] = indices[i] === undefined ? i : indices[i];
  }
  return result;
}

function isString(s) {
  return typeof s === 'string';
}

function reject(arr, predicate) {
  return arr.filter(item => !predicate(item))
}

function prepText(text) {
  if (Array.isArray(text)) return text;
  var deduped = uniq(tokenizer(text));
  if (!this.options.stopwords) return deduped;
  return reject(deduped, isStopword.bind(null,
    isString(this.options.stopwords) ? this.options.stopwords : stopwordsStr
  ));
}

// node <= 6 polyfill
// @see https://github.com/tc39/proposal-object-values-entries/blob/master/polyfill.js
const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;
if (!Object.values) {
  Object.values = function values(O) {
    return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
  };
}


module.exports = {
  isString,
  zeroPad,
  stopwords,
  nextTick,
  normalize,
  tokenizer,
  prepText,
  makeStopwordString,
  uniq,
  diff,
  flat,
  sample
};
