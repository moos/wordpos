wordpos
=======

## Usage:
```bash
$ wordpos

  Usage: wordpos <command> [options] [word ... | -i <file> | <stdin>]

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
    -f, --full         full result object
    -j, --json         full result object as JSON
    -i, --file <file>  input file
    -s, --withStopwords  include stopwords (default: stopwords are excluded)
    -N, --num <num>    number of random words to get
```

## Command-line: CLI

Version 0.1.6 introduces the command-line interface (./bin/wordpos-cli.js), available as 'wordpos' if installed globally
`npm install -g wordpos`, otherwise as `node_modules/.bin/wordpos` if installed without the -g.

### Examples:

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
Just the counts: (nouns, adjectives, verbs, adverbs, total parsed words)
```bash
$ wordpos get -c The angry bear chased the frightened little squirrel
4 3 1 1 7
```
Just the adjective count: (0, adjectives, 0, 0, total parsed words)
```bash
$ wordpos get --adj -c The angry bear chased the frightened little squirrel
0 3 0 0 7
```

Get definitions:
```bash
$ wordpos def git
git
  n: a person who is deemed to be despicable or contemptible; "only a rotter would do that"; "kill the rat"; "throw the bum out"; "you cowardly little pukes!"; "the British call a contemptible persona `git'"
```
Get full result object:
```bash
$ wordpos def git -f
{ git:
   [ { synsetOffset: 10539715,
       lexFilenum: 18,
       pos: 'n',
       wCnt: 0,
       lemma: 'rotter',
       synonyms: [],
       lexId: '0',
       ptrs: [],
       gloss: 'a person who is deemed to be despicable or contemptible; "only a rotter would do that
"; "kill the rat"; "throw the bum out"; "you cowardly little pukes!"; "the British call a contemptib
le person a `git\'"  ' } ] }
```
As JSON:
```bash
$ wordpos def git -j
{"git":[{"synsetOffset":10539715,"lexFilenum":18,"pos":"n","wCnt":0,"lemma":"rotter","synonyms":[],"
lexId":"0","ptrs":[],"gloss":"a person who is deemed to be despicable or contemptible; \"only a rotter
would do that\"; \"kill the rat\"; \"throw the bum out\"; \"you cowardly little pukes!\"; \"the British
call a contemptible person a `git'\"  "}]}
```

Get random words:
```bash
$ wordpos rand
#  1:
hopelessly

$ wordpos rand -N 2 foot
# foot 2:
footprint
footlights

$ wordpos rand -N 2 foot hand
# foot 2:
footlocker
footmark

# hand 2:
hand-hewn
handstitched

$ wordpos rand --adj foot
# foot 1:
foot-shaped

$ wordpos stopwords -b
about after all also am an and another any are as at be because ...
```
