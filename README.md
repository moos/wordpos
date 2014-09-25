wordpos
=======

wordpos is a set of part-of-speech (POS) utilities for Node.js using [natural's](http://github.com/NaturalNode/natural) WordNet module.

*Update*: get random word(s).

## Quick usage
Command-line:
```bash
$ wordpos def git
git
  n: a person who is deemed to be despicable or contemptible; "only a rotter would do that"; "kill the rat"; "throw the bum out"; "you cowardly little pukes!"; "the British call a contemptible person a `git'"  

$ wordpos def git | wordpos get --adj
# Adjective 6:
despicable
contemptible
bum
cowardly
little
British

```

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

See `wordpos_spec.js` for full usage.

## Installation

     npm install wordpos

Note: `wordpos-bench.js` requires a [forked uubench](https://github.com/moos/uubench) module.  To use the CLI (see below), install globally with the `-g` option.

To run spec:

    npm install jasmine-node -g
    cd spec
    jasmine-node wordpos_spec.js --verbose
    jasmine-node validate_spec.js --verbose

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
  fastIndex: true,

  /**
   * if true, exclude standard stopwords.
   * if array, stopwords to exclude, eg, ['all','of','this',...]
   * if false, do not filter any stopwords.
   */
  stopwords: true
};
```
To override, pass an options hash to the constructor. With the `profile` option, all callbacks receive a second argument that is the execution time in msec of the call.

```js
    wordpos = new WordPOS({profile: true});
    wordpos.isAdjective('fast', console.log);
    // true 'fast' 29
```

## API

Please note: all API are async since the underlying WordNet library is async. WordPOS is a subclass of natural's [WordNet class](https://github.com/NaturalNode/natural#wordnet) and inherits all its methods.


### getX()...

Get POS from text.

```
wordpos.getPOS(text, callback) -- callback receives a result object:
    {
      nouns:[],       Array of text words that are nouns
      verbs:[],       Array of text words that are verbs
      adjectives:[],  Array of text words that are adjectives
      adverbs:[],     Array of text words that are adverbs
      rest:[]         Array of text words that are not in dict or could not be categorized as a POS
    }
    Note: a word may appear in multiple POS (eg, 'great' is both a noun and an adjective)

wordpos.getNouns(text, callback) -- callback receives an array of nouns in text

wordpos.getVerbs(text, callback) -- callback receives an array of verbs in text

wordpos.getAdjectives(text, callback) -- callback receives an array of adjectives in text

wordpos.getAdverbs(text, callback) -- callback receives an array of adverbs in text
```

If you're only interested in a certain POS (say, adjectives), using the particular getX() is faster
than getPOS() which looks up the word in all index files. [stopwords] (https://github.com/NaturalNode/natural/blob/master/lib/natural/util/stopwords.js)
are stripped out from text before lookup.

If text is an *array*, all words are looked-up -- no deduplication, stopword filter or tokenization is applied.

getX() functions return the number of parsed words that will be looked up (less duplicates and stopwords).

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
wordpos.isNoun(word, callback) -- callback receives true/false if word is a noun.

wordpos.isVerb(word, callback) -- callback receives true/false if word is a verb.

wordpos.isAdjective(word, callback) -- callback receives true/false if word is an adjective.

wordpos.isAdverb(word, callback) -- callback receives true/false if word is an adverb.
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

lookupX() methods return the looked-up word as the second argument to the callback.

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
oul beneath"- Melville; "Westminster Hall\'s awing majesty, so vast, so high, so silent"  ' } ], 'awesome'
```
In this case only one lookup was found.  But there could be several.


Or use WordNet's inherited method:

```js
wordpos.lookup('great', console.log);
// ...
```

### randX()

Get random word(s).  (Introduced in version 0.1.10)

```js
wordpos.rand(options, callback)

wordpos.randNoun(options, callback)

wordpos.randVerb(options, callback)

wordpos.randAdjective(options, callback)

wordpos.randAdverb(options, callback)
```
Callback receives array of random words and the `startsWith` option.
`options`, if given, is:
```
{
  startsWith : <string> -- get random words starting with string
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

Note on performance: random lookups could involve heavy disk reads.  It is better to use the 'count' option to get words
in batches.  This may benefit from the cached reads of similarly keyed entries as well as shared open/close of the index files.

Getting random POS (randNoun, etc.) is generally faster than rand(), which may look at multiple POS files until 'count' requirement
is met.


### Other methods/properties

```
WordPOS.WNdb -- access to the WNdb object

WordPOS.natural -- access to underlying 'natural' module

wordpos.parse(str) -- returns tokenized array of words, less duplicates and stopwords.  
   This method is called on all getX() calls internally.
```
E.g., WordPOS.natural.stopwords is the list of stopwords.



### Fast Index

Version 0.1.4 introduces `fastIndex` option.  This uses a secondary index on the index files and is much faster. It is on by default.  Secondary index files are generated at install time and placed in the same directory as WNdb.path.  Details can be found in tools/stat.js.

See blog article [Optimizing WordPos](http://blog.42at.com/optimizing-wordpos).

## Command-line: CLI

Usage:
```bash
$ wordpos

  Usage: wordpos [options] <command> [word ... | -i <file> | <stdin>]

  Commands:

    get      get list of words for particular POS
 
    def      lookup definitions

    rand     get random words (optionally starting with 'word' ...)

    parse    show parsed words, deduped and less stopwords

    stopwords  show list of stopwords (valid options are -b and -j)
    
  Options:

    -h, --help         output usage information
    -V, --version      output the version number
    -n, --noun         Get nouns
    -a, --adj          Get adjectives
    -v, --verb         Get verbs
    -r, --adv          Get adverbs
    -c, --count        get counts only (noun, adj, verb, adv, total parsed words)
    -b, --brief        brief output (all on one line, no headers)
    -f, --full         full results object
    -j, --json         full results object as JSON
    -i, --file <file>  input file
    -s, --withStopwords  include stopwords (default: stopwords are excluded)
    -N, --num <num>    number of random words to get
```

For CLI examples, see [bin/README](bin/README.md). 

## Benchmark

    node wordpos-bench.js


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

## Changes

v0.1.11 
- fix stopwords not getting excluded when running with CLI
- added 'stopwords' CLI *command* to show list of stopwords
- CLI *option* --stopword now renamed to --withStopwords

v0.1.10 
- rand functionality added

v0.1.6
- added command line tool

v0.1.4
- added fast index 

License
-------

(The MIT License)

Copyright (c) 2012, 2014 mooster@42at.com
