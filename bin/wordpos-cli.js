#!/usr/bin/env node
/**
 * wordpos.js
 *
 * command-line interface to wordpos
 *
 * Usage:
 *    wordpos [options] <get|parse|def|rand|syn|exp|seek> <stdin|words*>
 *
 * Copyright (c) 2012, 2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var program = require('commander'),
  _ = require('underscore')._,
  fs = require('fs'),
  POS = {noun:'Noun', adj:'Adjective', verb:'Verb', adv:'Adverb'},
  POS_abbr = {noun:'n', adj:'a', verb:'v', adv:'r'},
  version = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version,
  rawCmd = '',
  RAND_PLACEHOLDER = '__',
  nWords;

program
  .version(version)
  .usage('<command> [options] [word ... | -i <file> | <stdin>]')

  .option('-n, --noun', 'get nouns only')
  .option('-a, --adj', 'get adjectives only')
  .option('-v, --verb', 'get verbs only')
  .option('-r, --adv', 'get adverbs only')

  .option('-c, --count', 'get counts only, used with get')
  .option('-b, --brief', 'brief output (all on one line, no headers)')
  .option('-f, --full', 'full results object')
  .option('-j, --json', 'full results object as JSON string')
  .option('-i, --file <file>', 'input file')
  .option('-w, --withStopwords', 'include stopwords (default: stopwords are excluded)')
  ;

program.command('get')
  .description('get list of words for particular POS')
  .action(exec);

program.command('def')
  .description('lookup definitions (use -b for brief definition, less examples)')
  .action(function(){
    rawCmd = 'def';
    _.last(arguments)._name = 'lookup';
    exec.apply(this, arguments);
  });

program.command('syn')
  .description('lookup synonyms')
  .action(function(){
    rawCmd = 'syn';
    _.last(arguments)._name = 'lookup';
    exec.apply(this, arguments);
  });

program.command('exp')
  .description('lookup examples')
  .action(function(){
    rawCmd = 'exp';
    _.last(arguments)._name = 'lookup';
    exec.apply(this, arguments);
  });

program.command('seek')
  .description('get record at synset offset. Must include one of POS -n, -a, -v, -r')
  .action(function(){
    var one = _.chain(program).pick('noun adj adv verb'.split(' ')).countBy().value().true;
    if (!one || one > 1) {
      console.error('Must include one and only one of -n, -a, -v, -r');
      process.exit(-1);
    }
    // force full output mode
    program.full = 1;
    exec.apply(this, arguments);
  });

program.command('rand')
  .description('get random words (starting with [word]). If first arg is a number, returns ' +
    'that many random words. Valid options are -b, -f, -j, -s, -i.')
  .action(function(/* arg, ..., program.command */){
    var args = _.toArray(arguments),
      num = args.length > 1 && Number(args[0]);
    delete program.count;

    // first arg is count?
    if (num) {
      args.shift();
      program.num = num;
    }
    // no startsWith given, add a placeholder
    if (args.length === 1){
      args.unshift(RAND_PLACEHOLDER);
    }
    exec.apply(this, args);
  });

program.command('parse')
  .description('show parsed words, deduped and less stopwords')
  .action(exec);

program.command('stopwords')
  .description('show list of stopwords (valid options are -b and -j)')
  .action(function(){
    cmd = _.last(arguments)._name;
    rawCmd = rawCmd || cmd;
    var stopwords = WordPos.stopwords;

    if (program.json)
      output(stopwords);
    else
      console.log(stopwords.join(program.brief ? ' ' : '\n'))
  });

var
  WordPos = require('../src/wordpos'),
  util = require('util'),
  results = {},
  cmd = null;


program.parse(process.argv);
if (!cmd) console.log(program.helpInformation());


function exec(/* args, ..., program.command */){
  var args = _.initial(arguments);
  cmd = _.last(arguments)._name;
  rawCmd = rawCmd || cmd;

  if (program.file) {
    fs.readFile(program.file, 'utf8', function(err, data){
      if (err) return console.log(err);
      run(data);
    });
  } else if (args.length || cmd == 'rand'){
    run(args.join(' '));
  } else {
    read_stdin(run);
  }
}

function read_stdin(callback) {
  var data = '';
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (chunk) {
    var c = chunk.charCodeAt(0);
    if (c == 4 || c == 26) // ^c or ^d followed by \n
      return process.stdin.emit('end') && process.stdin.pause();
    data += chunk;
  });
  process.stdin.on('end', function () {
    callback(data);
  });
}

function optToFn() {
  var
    map = cmd === 'seek' ? POS_abbr : POS,
    fns = _.reject(map, function(fn, opt) { return !program[opt] });
  if (!fns.length && cmd === 'rand') return fns = ['']; // run rand()
  if (!fns.length) fns = _.values(map); //default to all if no POS given
  return fns;
}

function run(data) {
  var
    opts = {stopwords: !program.withStopwords},
    wordpos = new WordPos(opts),
    seek = cmd === 'seek',
    words = seek ? data.split(' ') : wordpos.parse(data),
    fns = optToFn(),
    plural = (cmd === 'get' ? 's':''),
    results = {},
    finale = _.after(plural ? fns.length : words.length * fns.length,
        _.bind(output, null, results)),
    collect = function(what, result, word){
      if (word) {	// lookup
        results[word] = [].concat(results[word] || [], result);
      } else {		// get
        results[what] = result;
      }
      finale();
    };

  nWords = words.length;
  if (cmd == 'parse') return output({words: words});

  // loop over desired POS
  _(fns).each(function(fn){
    var method = cmd + fn + plural,
      cb = _.bind(collect, null, fn);
    if (cmd === 'get') {
      wordpos[method](words, cb);
    } else if (cmd === 'rand') {
      if (words[0] === RAND_PLACEHOLDER) words[0] = '';
      words.forEach(function(word){
        wordpos[method]({startsWith: word, count: program.num || 1}, cb);
      });
    } else if (seek) {
      words.forEach(function(offset){
        wordpos.seek(offset, fn, function(err, result){
          results[offset.trim()] = result;
          finale();
        });
      });
    } else {
      words.forEach(function(word){
        wordpos[method](word, cb);
      });
    }
  });
}

function output(results) {
  var str;
  if (program.count && cmd != 'lookup') {
    var label = program.brief ? '' : _.flatten(['#', _.values(POS), 'Parsed\n']).join(' ');
    str = (cmd == 'get' && (label + _.reduce(POS, function(memo, v){
      return memo + ((results[v] && results[v].length) || 0) +" ";
    },''))) + nWords;
  } else {
    str = sprint(results);
  }
  console.log(str);
}

function sprint(results) {
  if (program.json) {
    return util.format('%j',results);
  } else if (program.full) {
    return util.inspect(results,false,10, true);
  }
  var sep = program.brief ? ' ' : '\n';

  switch (cmd) {
  case 'lookup':
    return _.reduce(results, function(memo, v, k){
      return memo + (v.length && util.format('%s (%s)\n%s\n', k, rawCmd, print_def(v)) || '');
    }, '');
  default:
    return _.reduce(results, function(memo, v, k){
      var pre = program.brief ? '' : util.format('# %s %d:%s', k,  v.length, sep),
        res = v.length ? v.join(sep) : '';
      return memo + (v.length && util.format('%s%s%s\n', pre, res, sep) || '');
    }, '');
  }

  function print_def(defs) {
    var proc = {
      def: _.property(program.brief ? 'def' : 'gloss'),
      syn: function(res){
        return res.synonyms.join(', ');
      },
      exp: function(res) {
        return '"' + res.exp.join('", "') + '"';
      }
    }[ rawCmd ];

    return _.reduce(defs, function(memo, v, k){
      return memo + util.format('  %s: %s\n', v.pos, proc(v));
    },'');
  }
}
