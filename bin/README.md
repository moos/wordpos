wordpos Command-line
=======

Version 0.1.6 introduces the command-line interface (./bin/wordpos-cli.js), available as 'wordpos' if installed globally
`npm install -g wordpos`, otherwise as `node_modules/.bin/wordpos` if installed without the -g.

## Usage:
```bash
$ wordpos

  Usage: wordpos <command> [options] [word ... | -i <file> | <stdin>]

  Commands:

    get        get list of words for particular POS
 
    def        lookup definitions (use -b for brief definition, less examples)
    
    syn        lookup synonyms
    
    exp        lookup examples
    
    seek       get record at synset offset. Must include one of POS -n, -a, -v, -r

    rand       get random words (starting with [word]). If first arg is a number, returns
               that many random words. Valid options are -b, -f, -j, -s, -i.

    parse      show parsed words, deduped and less stopwords

    stopwords  show list of stopwords (valid options are -b and -j)
    
  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -n, --noun           get nouns only
    -a, --adj            get adjectives only
    -v, --verb           get verbs only
    -r, --adv            get adverbs only
    -c, --count          get counts only, used with get
    -b, --brief          brief output (all on one line, no headers)
    -f, --full           full result object
    -j, --json           full result object as JSON string
    -i, --file <file>    input file
    -w, --withStopwords  include stopwords (default: stopwords are excluded)
```


### Examples:
#### Get part-of-speech:
```bash
$ wordpos get The angry bear chased the frightened little squirrel
# Noun 4:
bear
chased
little
squirrel

# Adjective 3:
angry
frightened
little

# Verb 1:
bear

# Adverb 1:
little
```
Just the nouns, brief output:
```bash
$ wordpos get --noun -b The angry bear chased the frightened little squirrel
bear chased little squirrel
```
Just the counts:
```bash
$ wordpos get -c The angry bear chased the frightened little squirrel
# Noun Adjective Verb Adverb Parsed
4 3 1 1 7
```
Just the adjective count:
```bash
$ wordpos get --adj -c The angry bear chased the frightened little squirrel
# Noun Adjective Verb Adverb Parsed
0 3 0 0 7
```

#### Get definitions:
```bash
$ wordpos def git
git (def)
  n: a person who is deemed to be despicable or contemptible; "only a rotter would do that"; "kill the rat"; "throw the bum out"; "you cowardly little pukes!"; "the British call a contemptible persona `git'"
```
Brief definition: (excludes examples)
```bash
$ wordpos def -b git
git (def)
  n: a person who is deemed to be despicable or contemptible
```
Multiple definitions:
```sh
$ wordpos def -b git gat
git (def)
  n: a person who is deemed to be despicable or contemptible
  
gat (def)
  n: a gangster's pistol 
```

#### Get full result object:
```bash
$ wordpos def gat -f
{ gat:
   [ { synsetOffset: 3432112,
       lexFilenum: 6,
       pos: 'n',
       wCnt: 2,
       lemma: 'gat',
       synonyms: [ 'gat', 'rod' ],
       lexId: '0',
       ptrs:
        [ { pointerSymbol: '@',
            synsetOffset: 3954735,
            pos: 'n',
            sourceTarget: '0000' },
          { pointerSymbol: ';u',
            synsetOffset: 7171981,
            pos: 'n',
            sourceTarget: '0000' } ],
       gloss: 'a gangster\'s pistol  ',
       def: 'a gangster\'s pistol  ',
       exp: [] } ] }
```

#### As JSON:
```bash
$ wordpos def gat -j
{"gat":[{"synsetOffset":3432112,"lexFilenum":6,"pos":"n","wCnt":2,"lemma":"gat","synonyms":["gat","rod"],
"lexId":"0","ptrs":[{"pointerSymbol":"@","synsetOffset":3954735,"pos":"n","sourceTarget":"0000"},{"pointerSymbol":
";u","synsetOffset":7171981,"pos":"n","sourceTarget":"0000"}],"gloss":"a gangster's pistol  ","def":
"a gangster's pistol  ","exp":[]}]}
```

#### Get synonyms:
```
$ wordpos syn git gat
git (syn)
  n: rotter, dirty_dog, rat, skunk, stinker, stinkpot, bum, puke, crumb, lowlife, scum_bag, so-and-so, git

gat (syn)
  n: gat, rod
```

#### Get examples:
```
$ wordpos exp git
git (exp)
  n: "only a rotter would do that", "kill the rat", "throw the bum out", "you cowardly little pukes!", "the British call a contemptible person a `git'"
```

#### Get random words:
```bash
$ wordpos rand
#  1:
hopelessly
```
Get 5 random words:
```sh
$ wordpos rand 5
#  5:
bemire
swan
dignify
jaunt
daydream
```
Brief:
```sh
$ wordpos rand -b 5
hebrew awake urn-shaped afeard obvious
```
#### Get random POS:
Get a random adjective:
```sh
$ wordpos rand --adj
# Adjective 1:
soaked
```
Get 5 random verbs:
```sh
$ wordpos rand 5 --verb
# Verb 5:
centralise
abduct
kneecap
arise
rate
````

#### Get random words starting with:
Get a word staring with "foot":
```sh
$ wordpos rand foot
# foot 1:
footprint
```
Get 3 random words string with "foot" and "hand" each:
```sh
$ wordpos rand 3 foot hand
# foot 3:
footlocker
footmark
footwall

# hand 3:
hand-hewn
handstitched
handicap
```
Get a random adjective starting with "foot"
```sh
$ wordpos rand --adj foot
# foot 1:
foot-shaped
```

#### Seek a synset offset
Seek offset as adjective:
```sh
$ wordpos seek 1285602 -a
{ '1285602':
   { synsetOffset: 1285602,
       lexFilenum: 0,
       lexName: 'adj.all',
       pos: 's',
       wCnt: 5,
       lemma: 'amazing',
       synonyms: [ 'amazing', 'awe-inspiring', 'awesome', 'awful', 'awing' ],
       lexId: '0',
       ptrs:
        [ { pointerSymbol: '&',
            synsetOffset: 1285124,
            pos: 'a',
...            
```

Same as verb (not found!):
```sh
$ wordpos seek 1285602 -v
{ '1285602': {} }
```

Multiple offsets from same POS:
```sh
$ wordpos seek 1285602 1285124 -a
{ '1285124':
   { synsetOffset: 1285124,
       lexFilenum: 0,
       ...
   },
  '1285602':
    { synsetOffset: 1285602,
        lexFilenum: 0,
        ...
    }
```
Note that results are always returned as `--full` format.  To get compact JSON format, add the `-j` option.


#### Stopwords
List stopwords (brief):
```bash
$ wordpos stopwords -b
about after all also am an and another any are as at be because ...
```

Get definition of a stopword:
```bash
$ wordpos def both -w
both (def)
  s: (used with count nouns) two considered together; the two; "both girls are pretty"

```
