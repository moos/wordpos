wordpos
=======

wordpos is a set of part-of-speech utilities for Node.js using [natural's](http://github.com/NaturalNode/natural) WordNet module.

There is no lexigraphical intelligence here (eg, see [pos-js](https://github.com/fortnightlabs/pos-js)).  Only dictionary lookup.

Usage
-------

```js
var WordPOS = require('./wordpos'),
    wordpos = new WordPOS('dict');

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

Installation
------------

Get the script `wordpos.js` and use it.  (npm module may be coming.)

You may also want to manually download [WordNet files](http://wordnet.princeton.edu/wordnet/download/current-version/).  Unpack into folder (say `dict`).  [natural](http://github.com/NaturalNode/natural) will auto-download WordNet files --
but I've found this to be unreliable as some of the files get truncated, leading the program to hang.

Note: `wordpos-bench.js` requires a [forked uubench](https://github.com/moos/uubench) module.


API
-------

Please note: all API are async since the underlying WordNet library is async.

WordPOS is a subclass of natural's [WordNet class](https://github.com/NaturalNode/natural#wordnet) and inherits all its methods.


### getX()

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


### isX()

Determine if a word is a particular POS.

```
wordpos.isNoun(word, callback) -- callback receives result (true/false) if word is a noun.

wordpos.isVerb(word, callback) -- callback receives result (true/false) if word is a verb.

wordpos.isAdjective(word, callback) -- callback receives result (true/false) if word is an adjective.

wordpos.isAdverb(word, callback) -- callback receives result (true/false) if word is an adverb.
```

Examples:

```js
wordpos.isVerb('fish', console.log);
// true

wordpos.isNoun('fish', console.log);
// true

wordpos.isAdjective('fishy', console.log);
// true

wordpos.isAdverb('fishly', console.log);
// false
```

### lookupX()

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

Benchmark
----------

Generally slow as it requires loading and searching large WordNet index files.

Single word lookup:
```
  getPOS : 30 ops/s { iterations: 10, elapsed: 329 }
  getNouns : 106 ops/s { iterations: 10, elapsed: 94 }
  getVerbs : 111 ops/s { iterations: 10, elapsed: 90 }
  getAdjectives : 132 ops/s { iterations: 10, elapsed: 76 }
  getAdverbs : 137 ops/s { iterations: 10, elapsed: 73 }
```

128-word lookup:
```
  getPOS : 0 ops/s { iterations: 1, elapsed: 2210 }
  getNouns : 2 ops/s { iterations: 1, elapsed: 666 }
  getVerbs : 2 ops/s { iterations: 1, elapsed: 638 }
  getAdjectives : 2 ops/s { iterations: 1, elapsed: 489 }
  getAdverbs : 2 ops/s { iterations: 1, elapsed: 407 }
```

On a win7/64-bit/dual-core/3GHz.  getPOS() is slowest as it searches through all four index files.

There is probably room for optimization in the underlying library.

License
-------

(The MIT License)

Copyright (c) 2012, mooster@42at.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
