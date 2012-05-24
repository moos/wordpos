wordpos
=======

wordpos is a set of part-of-speech utilities for Node.js using [natural's](http://github.com/NaturalNode/natural) WordNet module.


## Usage

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
// true
```

See `wordpos_spec.js` for full usage.

## Installation

     npm install wordpos

Note: `wordpos-bench.js` requires a [forked uubench](https://github.com/moos/uubench) module.

To run spec:

    npm install jasmine-node -g
    jasmine-node wordpos_spec.js --verbose
    jasmine-node validate_spec.js --verbose


## API

Please note: all API are async since the underlying WordNet library is async.

WordPOS is a subclass of natural's [WordNet class](https://github.com/NaturalNode/natural#wordnet) and inherits all its methods.


### getX()...

Get POS from text.

```
wordpos.getPOS(str, callback) -- callback receives a result object:
    {
      nouns:[],       Array of str words that are nouns
      verbs:[],       Array of str words that are verbs
      adjectives:[],  Array of str words that are adjectives
      adverbs:[],     Array of str words that are adverbs
      rest:[]         Array of str words that are not in dict or could not be categorized as a POS
    }

    Note: a word may appear in multiple POS (eg, 'great' is both a noun and an adjective)

wordpos.getNouns(str, callback) -- callback receives an array of nouns in str

wordpos.getVerbs(str, callback) -- callback receives an array of verbs in str

wordpos.getAdjectives(str, callback) -- callback receives an array of adjectives in str

wordpos.getAdverbs(str, callback) -- callback receives an array of adverbs in str
```

NB: If you're only interested in a certain POS (say, adjectives), using the particular getX() is faster
than getPOS() which looks up the word in all index files.

NB: [stopwords] (https://github.com/NaturalNode/natural/blob/master/lib/natural/util/stopwords.js)
are stripped out from str before lookup.

All getX() functions return the number of parsed words that will be looked up (less duplicates and stopwords).

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
This has no relation to correct grammer of given sentence, where here only 'bear' and 'squirrel'
would be considered nouns.  (see http://nltk.googlecode.com/svn/trunk/doc/book/ch08.html#ex-recnominals)

[pos-js](https://github.com/fortnightlabs/pos-js), e.g., shows only 'squirrel' as noun:

    The / DT
    angry / JJ
    bear / VB
    chased / VBN
    the / DT
    frightened / VBN
    little / JJ
    squirrel / NN


### isX()...

Determine if a word is a particular POS.

```
wordpos.isNoun(word, callback) -- callback receives result (true/false) if word is a noun.

wordpos.isVerb(word, callback) -- callback receives result (true/false) if word is a verb.

wordpos.isAdjective(word, callback) -- callback receives result (true/false) if word is an adjective.

wordpos.isAdverb(word, callback) -- callback receives result (true/false) if word is an adverb.
```

isX() methods return the looked-up word as the second argument to the callback.

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

### lookupX()...

These calls are similar to natural's [lookup()](https://github.com/NaturalNode/natural#wordnet) call, except they can be faster if you
already know the POS of the word.

```
wordpos.lookupNoun(word, callback) -- callback receives array of lookup objects for a noun

wordpos.lookupVerb(word, callback) -- callback receives array of lookup objects for a verb

wordpos.lookupAdjective(word, callback) -- callback receives array of lookup objects for an adjective

wordpos.lookupAdverb(word, callback) -- callback receives array of lookup objects for an adverb
```

Example:

```js
wordpos.lookupAdjective('awesome', console.log);
// output:
[ { synsetOffset: 1282510,
    lexFilenum: 0,
    pos: 's',
    wCnt: 5,
    lemma: 'amazing',
    synonyms: [ 'amazing', 'awe-inspiring', 'awesome', 'awful', 'awing' ],
    lexId: '0',
    ptrs: [],
    gloss: 'inspiring awe or admiration or wonder; "New York is an amazing city"; "the Grand Canyon is an awe-inspiring
sight"; "the awesome complexity of the universe"; "this sea, whose gently awful stirrings seem to speak of some hidden s
oul beneath"- Melville; "Westminster Hall\'s awing majesty, so vast, so high, so silent"  ' } ]
```
In this case only one lookup was found.  But there could be several.


Or use WordNet's inherited method:

```js
wordpos.lookup('great', console.log);
// ...
```

### Other methods/properties

```
WordPOS.WNdb -- access to the WNdb object

wordpos.parse(str) -- returns tokenized array of words, less duplicates and stopwords.  This method is called on all getX() calls internally.
```

### Options

```js
WordPOS.defaults = {
  /**
   * enable profiling, time in msec returned as last argument in callback
   */
  profile: false,

  /**
   * use fast index if available
   */
  fastIndex: true
};
```
To override, pass an options hash to the constructor. With the `profile` option, all callbacks receive a second argument that is the execution time in msec of the call.

```js
    wordpos = new WordPOS({profile: true});
    wordpos.isAdjective('fast', console.log);
    // true 'fast' 29
```

## Fast Index

Version 0.1.4 introduces `fastIndex` option.  This uses a secondary index on the index files and is much faster. It is on by default.  Secondary index files are generated at install time and placed in the same directory as WNdb.path.  Details can be found in tools/stat.js.

See blog article [Optimizing WordPos](http://blog.42at.com/optimizing-wordpos).

## Benchmark

    node wordpos-bench.js

Generally slow as it requires loading and searching large WordNet index files.

512-word corpus (< v0.1.4) :
```
  getPOS : 0 ops/s { iterations: 1, elapsed: 9039 }
  getNouns : 0 ops/s { iterations: 1, elapsed: 2347 }
  getVerbs : 0 ops/s { iterations: 1, elapsed: 2434 }
  getAdjectives : 1 ops/s { iterations: 1, elapsed: 1698 }
  getAdverbs : 0 ops/s { iterations: 1, elapsed: 2698 }
done in 20359 msecs
```

512-word corpus (as of v0.1.4, with fastIndex) :
```
  getPOS : 18 ops/s { iterations: 1, elapsed: 57 }
  getNouns : 48 ops/s { iterations: 1, elapsed: 21 }
  getVerbs : 125 ops/s { iterations: 1, elapsed: 8 }
  getAdjectives : 111 ops/s { iterations: 1, elapsed: 9 }
  getAdverbs : 143 ops/s { iterations: 1, elapsed: 7 }
done in 1375 msecs
```

220 words are looked-up (less stopwords and duplicates) on a win7/64-bit/dual-core/3GHz.  getPOS() is slowest as it searches through all four index files.


License
-------

(The MIT License)

Copyright (c) 2012, mooster@42at.com
