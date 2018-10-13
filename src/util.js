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

function normalize(word) {
  return word.toLowerCase().replace(/\s+/g, '_');
}

function isStopword(stopwords, word) {
  return stopwords.indexOf(' '+word+' ') >= 0;
}

function tokenizer(str) {
  return str.split(/\W+/);
}

function uniq(arr) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
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

export {
  nextTick,
  normalize,
  tokenizer,
  prepText,
  makeStopwordString
}
