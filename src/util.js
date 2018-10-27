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
  return stopwordsStr.indexOf(' '+word+' ') >= 0;
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
  flat
};
