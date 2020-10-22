wordpos
=======

[![NPM version](https://img.shields.io/npm/v/wordpos.svg)](https://www.npmjs.com/package/wordpos)
[![Build Status](https://img.shields.io/travis/moos/wordpos/master.svg)](https://travis-ci.org/moos/wordpos)

wordpos is a set of *fast* part-of-speech (POS) utilities for Node.js **and** browser using fast lookup in the WordNet database.

Version 1.x is a major update with no direct dependence on [natural's](https://github.com/NaturalNode/natural#wordnet) WordNet module, with support for [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), and roughly 5x speed improvement over previous version.

> ~~**CAUTION** The WordNet database [wordnet-db](https://github.com/moos/wordnet-db) comprises [155,287 words](https://wordnet.princeton.edu/documentation/wnstats7wn) (3.0 numbers) which uncompress to over **30 MB** of data in several *un*[browserify](https://github.com/substack/node-browserify)-able files.  It is *not* meant for the browser environment.~~

🔥 Version 2.x is totally refactored and **works in browsers** also -- see [wordpos-web](https://github.com/moos/wordpos-web).

## Installation

     npm install -g wordpos

To run test: (or just: npm test)

    npm install -g mocha
    mocha test

## Quick usage

Node.js:
```js
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

wordpos.getAdjectives('The angry bear chased the frightened little squirrel.', function(result){
    console.log(result);
});
// [ 'little', 'angry', 'frightened' ]

wordpos.isAdjective('awesome', function(result){
    console.log(result);
});
// true 'awesome'
```

Command-line: (see [CLI](bin) for full command list)
```bash
$ wordpos def git
git
  n: a person who is deemed to be despicable or contemptible; "only a rotter would do that"; "kill the rat"; "throw the bum out"; "you cowardly little pukes!"; "the British call a contemptible person a 'git'"  

$ wordpos def git | wordpos get --adj
# Adjective 6:
despicable
contemptible
bum
cowardly
little
British
```


## Options

```js
WordPOS.defaults = {
  /**
   * enable profiling, time in msec returned as last argument in callback
   */
  profile: false,

  /**
   * if true, exclude standard stopwords.
   * if array, stopwords to exclude, eg, ['all','of','this',...]
   * if false, do not filter any stopwords.
   */
  stopwords: true,

  /**
   * preload files (in browser only)
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
```
To override, pass an options hash to the constructor. With the `profile` option, most callbacks receive a last argument that is the execution time in msec of the call.

```js
    wordpos = new WordPOS({profile: true});
    wordpos.isAdjective('fast', console.log);
    // true 'fast' 29
```

## API

Please note: all API are *async* since the underlying WordNet library is async.

#### getPOS(text, callback)
#### getNouns(text, callback)
#### getVerbs(text, callback)
#### getAdjectives(text, callback)
#### getAdverbs(text, callback)

Get part-of-speech from `text`.  `callback(results)` receives an array of words for specified POS, or a hash for `getPOS()`:

```
wordpos.getPOS(text, callback) -- callback receives a result object:
    {
      nouns:[],       Array of words that are nouns
      verbs:[],       Array of words that are verbs
      adjectives:[],  Array of words that are adjectives
      adverbs:[],     Array of words that are adverbs
      rest:[]         Array of words that are not in dict or could not be categorized as a POS
    }
    Note: a word may appear in multiple POS (eg, 'great' is both a noun and an adjective)
```

If you're only interested in a certain POS (say, adjectives), using the particular getX() is faster
than getPOS() which looks up the word in all index files. [stopwords](lib/natural/util/stopwords.js) are stripped out from text before lookup.

If `text` is an *array*, all words are looked-up -- no deduplication, stopword filtering or tokenization is applied.

getX() functions return a Promise.

Example:

```js
wordpos.getNouns('The angry bear chased the frightened little squirrel.', console.log)
// [ 'bear', 'squirrel', 'little', 'chased' ]

wordpos.getPOS('The angry bear chased the frightened little squirrel.', console.log)
// output:
  {
    nouns: [ 'bear', 'squirrel', 'little', 'chased' ],
    verbs: [ 'bear' ],
    adjectives: [ 'little', 'angry', 'frightened' ],
    adverbs: [ 'little' ],
    rest: [ 'the' ]
  }

```
This has no relation to correct grammar of given sentence, where here only 'bear' and 'squirrel' would be considered nouns.

#### isNoun(word, callback)
#### isVerb(word, callback)
#### isAdjective(word, callback)
#### isAdverb(word, callback)

Determine if `word` is a particular POS.  `callback(result, word)` receives true/false as first argument and the looked-up word as the second argument. The resolved Promise receives true/false.

Examples:

```js
wordpos.isVerb('fish', console.log);
// true 'fish'

wordpos.isNoun('fish', console.log);
// true 'fish'

wordpos.isAdjective('fishy', console.log);
// true 'fishy'

wordpos.isAdverb('fishly', console.log);
// false 'fishly'
```

#### lookup(word, callback)
#### lookupNoun(word, callback)
#### lookupVerb(word, callback)
#### lookupAdjective(word, callback)
#### lookupAdverb(word, callback)

Get complete definition object for `word`.  The lookupX() variants can be faster if you already know the POS of the word.  Signature of the callback is `callback(result, word)` where `result` is an *array* of lookup object(s).

Example:

```js
wordpos.lookupAdjective('awesome', console.log);
// output:
[ { synsetOffset: 1285602,
    lexFilenum: 0,
    lexName: 'adj.all',
    pos: 's',
    wCnt: 5,
    lemma: 'amazing',
    synonyms: [ 'amazing', 'awe-inspiring', 'awesome', 'awful', 'awing' ],
    lexId: '0',
    ptrs: [],
    gloss: 'inspiring awe or admiration or wonder; [...] awing majesty, so vast, so high, so silent"  '
    def: 'inspiring awe or admiration or wonder',     
    ...
} ], 'awesome'
```
In this case only one lookup was found, but there could be several.  

Version 1.1 adds the `lexName` parameter, which maps the lexFilenum to one of [45 lexicographer domains](https://wordnet.princeton.edu/documentation/lexnames5wn).


#### seek(offset, pos, callback)
Version 1.1 introduces the seek method to lookup a record directly from the synsetOffset for a given POS.  Unlike other methods, callback (if provided) receives `(err, result)` arguments.

Examples:
```js
wordpos.seek(1285602, 'a').then(console.log)
// same result as wordpos.lookupAdjective('awesome', console.log);
```

#### rand(options, callback)
#### randNoun(options, callback)
#### randVerb(options, callback)
#### randAdjective(options, callback)
#### randAdverb(options, callback)

Get random word(s).  (Introduced in version 0.1.10)  `callback(results, startsWith)` receives array of random words and the `startsWith` option, if one was  given. `options`, if given, is:
```
{
  startsWith : <string> -- get random words starting with this
  count : <number> -- number of words to return (default = 1)
}
```
Examples:
```js
wordpos.rand(console.log)
// ['wulfila'] ''

wordpos.randNoun(console.log)
// ['bamboo_palm'] ''

wordpos.rand({starstWith: 'foo'}, console.log)
// ['foot'] 'foo'

wordpos.randVerb({starstWith: 'bar', count: 3}, console.log)
// ['barge', 'barf', 'barter_away'] 'bar'

wordpos.rand({starsWith: 'zzz'}, console.log)
// [] 'zzz'
```

**Note on performance**: (node only) random lookups could involve heavy disk reads.  It is better to use the `count` option to get words in batches.  This may benefit from the cached reads of similarly keyed entries as well as shared open/close of the index files.

Getting random POS (`randNoun()`, etc.) is generally faster than `rand()`, which may look at multiple POS files until `count` requirement is met.


#### parse(text)
Returns tokenized array of words in `text`, less duplicates and stopwords. This method is called on all getX() calls internally.


#### WordPOS.WNdb
Access to the [wordnet-db](https://github.com/moos/wordnet-db) object containing the dictionary & index files.

#### WordPOS.stopwords
Access the array of [stopwords](lib/natural/util/stopwords.js).


## Promises

As of v1.0, all `get`, `is`, `rand`, and `lookup`  methods return a standard ES6 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

```js
wordpos.isVerb('fish').then(console.log);
// true
```

Compound, with error handler:

```js
wordpos.isVerb('fish')
  .then(console.log)
  .then(doSomethingElse)
  .catch(console.error);
```

Callbacks, if given, are executed _before_ the Promise is resolved.

```js
wordpos.isVerb('fish', console.log)
  .then(console.log)
  .catch(console.error);
// true 'fish' 13
// true
```
Note that callback receives full arguments (including profile, if enabled), while the Promise receives only the result of the call.  Also, beware that exceptions in the _callback_ will result in the Promise being _rejected_ and caught by `catch()`, if provided.

## Running inside the browsers?

See [wordpos-web](https://github.com/moos/wordpos-web).

## Fast Index (node)

Version 0.1.4 introduces `fastIndex` option.  This uses a secondary index on the index files and is much faster. It is on by default.  Secondary index files are generated at install time and placed in the same directory as WNdb.path.  Details can be found in tools/stat.js.

Fast index improves performance **30x** over Natural's native methods. See blog article [Optimizing WordPos](http://blog.42at.com/optimizing-wordpos).

As of version 1.0, fast index is always on and cannot be turned off.

## Command-line (CLI) usage

For CLI usage and examples, see [bin/README](bin).


## Benchmark

See [bench/README](bench).


## Changes
See [CHANGELOG](./CHANGELOG.md).

License
-------

https://github.com/moos/wordpos
Copyright (c) 2012-2020 mooster@42at.com
(The MIT License)
