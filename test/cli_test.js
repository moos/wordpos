/**
 * cli_test.js
 *
 *     Test CLI script
 *
 * Copyright (c) 2012-2020 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var
  chai = require('chai'),
  assert = chai.assert,
  exec = require('child_process').exec,
  testStr = 'The angry bear chased the frightened little squirrel',
  cmd = 'node ' + __dirname + '/../bin/wordpos-cli ',
  gDone;

// compare two list of words independent of word order
function cmp(act, exp) {
  assert.equal(act.trim().split(' ').sort().join(), exp.split(' ').sort().join());
}


describe('CLI tests', function() {
  this.slow(300);

  describe('Test CLI get', function() {
    it('should get nouns', done => {
      exec(cmd + '-n -b get ' + testStr, (error, stdout) => {
        assert.isNull(error);
        cmp(stdout, 'bear chased squirrel little');
        done();
      });
    });

    it('should get adjectives', done => {
      exec(cmd + '-a -b get ' + testStr, (error, stdout) => {
        assert.isNull(error);
        cmp(stdout, 'angry frightened little');
        done();
      });
    });

    it('should get verbs', done => {
      exec(cmd + '-v -b get ' + testStr, (error, stdout) => {
        assert.isNull(error);
        cmp(stdout, 'bear');
        done();
      });
    });

    it('should get adverbs', done => {
      exec(cmd + '-r -b get ' + testStr, (error, stdout) => {
        assert.isNull(error);
        cmp(stdout, 'little');
        done();
      });
    });

    it('should get POS', done => {
      exec(cmd + '-b get ' + testStr, (error, stdout, stderr) => {
        assert.isNull(error);
        cmp(stdout, 'bear chased squirrel little \n' +
        'angry frightened little \n' +
        'bear \n' +
        'little');
        done();
      });
    });

    it('should get POS (single word)', done => {
      exec(cmd + '-b get angry', (error, stdout, stderr) => {
        assert.isNull(error);
        assert.equal(stdout.trim(), 'angry');
        done();
      });
    });

    it('should get counts', done => {
      exec(cmd + '-b -c get ' + testStr, (error, stdout, stderr) => {
        assert.isNull(error);
        assert.equal(stdout.trim(), '4 3 1 1 6');
        done();
      });
    });
  });

  describe('Test CLI def', function() {
    it('should define word', done => {
      exec(cmd + 'def angry', (error, stdout) => {
        assert.isNull(error);
        assert(stdout.trim().startsWith('angry (def)\n  a: feeling or showing anger;'));
        done();
      });
    });
  });

  describe('Test CLI syn', function() {
    it('should get synonyms', done => {
      exec(cmd + 'syn angry', (error, stdout) => {
        assert.isNull(error);
        assert(stdout.trim().startsWith('angry (syn)\n  a: angry'));
        done();
      });
    });
  });

  describe('Test CLI exp', function() {
    it('should get exmpale', done => {
      exec(cmd + 'exp angry', (error, stdout) => {
        assert.isNull(error);
        assert(stdout.trim().startsWith('angry (exp)\n  a: "angry at the weather"'));
        done();
      });
    });
  });

  describe('Test CLI seek', function() {
    it('should seek by offset', done => {
      exec(cmd + '-a seek 00114629', (error, stdout) => {
        assert.isNull(error);
        assert(/lemma/.test(stdout), 'found lemma');
        assert(/angry/.test(stdout), 'found angry');
        done();
      });
    });
  });

  describe('Test CLI rand', function() {
    it('should get a random word', done => {
      exec(cmd + 'rand', (error, stdout) => {
        assert.isNull(error);
        assert(stdout.length > 1, 'got answer')
        done();
      });
    });

    it('should get a random word starting with...', done => {
      exec(cmd + '-b rand angr', (error, stdout) => {
        assert.isNull(error);
        assert.equal(stdout.substr(0,4), 'angr');
        done();
      });
    });
  });

  describe('Test CLI parse', function() {
    it('should parse input', done => {
      exec(cmd + '-b parse ' + testStr, (error, stdout) => {
        assert.isNull(error);
        assert.equal(stdout.trim(), 'angry bear chased frightened little squirrel');
        done();
      });
    });
  });

  describe('Test CLI stopwords', function() {
    let WordPOS = require('../src/wordpos');

    it('should list stopwords', done => {
      exec(cmd + '-j stopwords ' + testStr, (error, stdout) => {
        assert.isNull(error);
        assert.equal(stdout.trim(), JSON.stringify(WordPOS.stopwords));
        done();
      });
    });
  });

});
