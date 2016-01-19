/**
 * wordpos-bench.js
 *
 * Copyright (c) 2012-2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var Bench = require('mini-bench'),
  fs = require('fs'),
  _ = require('underscore')._,
  WordPOS = require('../src/wordpos'),
  wordpos = new WordPOS();


suite = new Bench.Suite({
  type: 'fixed',
  iterations: 1,
  async: false,	// important!

  start: function(tests){
    console.log('starting %d tests', tests.length);
  },

  result: function(name, stats){
    var persec = 1000 / stats.elapsed
      , ops = .5 + stats.iterations * persec;

    console.log('  \033[90m%s : \033[36m%d \033[90mops/s\033[0m', name, ops | 0, stats);
    pos && console.log(out(pos));
  },

  done: function(time){
    console.log('looked up %d words, %d found', nwords, found);
    console.log('done in %d msecs', time );
  },

  section: function(name, stats) {
    console.log('\033[35m%s\033[0m',name);
  }
});


function out(res){
  return _(res).keys().map(function(k){
    return k + ':' + res[k].length
  });
}


var
  text = fs.readFileSync('text-512.txt', 'utf8'),
  parsedText = wordpos.parse(text),
  nwords = parsedText.length,
  pos;


function getPOS(next){
  wordpos.getPOS(text, function(res){
    pos = res;
    next();
  });
}

function getNouns(next){
  wordpos.getNouns(text, function(res){
    pos = {nouns: res};
    next();
  });
}

function getVerbs(next){
  wordpos.getVerbs(text, function(res){
    pos = {verbs: res};
    next();
  });
}

function getAdjectives(next){
  wordpos.getAdjectives(text, function(res){
    pos = {adjectives: res};
    next();
  });
}

function getAdverbs(next){
  wordpos.getAdverbs(text, function(res){
    pos = {adverbs: res};
    next();
  });
}


function lookup(next){
  var count = nwords;
  found = 0;
  parsedText.forEach(function(word) {
    wordpos.lookup(word, function (res) {
      res.length && ++found;
      if (--count === 0) next();
    });
  });
}

function lookupNoun(next){
  var count = nwords;
  found = 0;
  parsedText.forEach(function(word) {
    wordpos.lookupNoun(word, function (res) {
      res.length && ++found;
      if (--count === 0) next();
    });
  });
}

suite.section('--512 words--', function(next){
  suite.options.iterations = 1;
  next();
});

suite.bench('getPOS', getPOS);
suite.bench('getNouns', getNouns);
suite.bench('getVerbs', getVerbs);
suite.bench('getAdjectives', getAdjectives);
suite.bench('getAdverbs', getAdverbs);
suite.bench('lookup', lookup);
suite.bench('lookupNoun', lookupNoun);

suite.run();
