/**
 * wordpos_test.js
 *
 *   test file for main wordpos functionality (both node and browser)
 *
 * Usage:
 *   npm install mocha -g
 *   mocha wordpos_test.js
 *
 *   or
 *
 *   npm test
 *
 * Copyright (c) 2012-2019 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

 // used in src code to signal test mode
global.window = global.window || {};
global.window.__mocha = true;

var
  chai = require('chai'),
  _ = require('underscore'),
  assert = chai.assert,
  browser = process.browser = process.argv.includes('@babel/register'),
  WordPOS = require('../src/wordpos'),
  path = require('path'),
  dictPath = browser ? path.resolve('./test/dict') : undefined,
  wordpos = new WordPOS({
    profile: false,
    dictPath: dictPath,
    // debug: true
  });


const assertNoData = (err) => {
  assert(err instanceof RangeError);
  assert(/No data at offset/.test(err.message));
};

const assertOffsetErr = (err) => {
  assert(err instanceof RangeError);
  assert.equal(err.message, 'Offset must be valid positive number: foobar');
};


console.log('Running', browser ? 'browser' : 'node', 'tests');
chai.config.showDiff = true;

var str = "The angry bear chased the frightened little squirrel",
  expected = {
    nouns: [ 'bear', 'squirrel', 'little', 'chased' ],
    verbs: [ 'bear' ],
    adjectives: [ 'little', 'angry', 'frightened' ],
    adverbs: [ 'little' ],
    rest: []
  },
  garble = 'garblegarble',	// expect not to find word
  offset = 1285602;


describe('lookup', function() {

  it('with callback', function () {
    return wordpos.lookup('hegemony', function (result) {
      assert.equal(result.length, 1);
      assert.equal(result[0].pos, 'n');
      assert.equal(result[0].lemma, 'hegemony');
      assert.equal(result[0].synonyms.length, 1);
    });
  });

  it('with Promise', function () {
    return wordpos.lookup('hegemony').then(function (result) {
      assert.equal(result.length, 1);
      assert.equal(result[0].pos, 'n');
      assert.equal(result[0].lemma, 'hegemony');
      assert.equal(result[0].synonyms.length, 1);
    });
  });
});


describe('options passed to constructor', function() {
  var wp,
    origProfile = WordPOS.defaults.profile;

  it('should override default option', function(){
    wp = new WordPOS({profile:123});
    assert.equal(wp.options.profile, 123);
    assert.equal(WordPOS.defaults.profile, origProfile);
  });

  it('should not erase default option', function(){
    wp = new WordPOS({aaa:123});
    assert.equal(wp.options.aaa, 123);
    assert.equal(wp.options.profile, WordPOS.defaults.profile);
  });
});


describe('getX()...', function() {

  it('should get all POS', function() {
    return wordpos.getPOS(str, function(result) {
      assert.sameMembers(result.nouns, expected.nouns);
      assert.sameMembers(result.verbs, expected.verbs);
      assert.sameMembers(result.adjectives, expected.adjectives);
      assert.sameMembers(result.adverbs, expected.adverbs);
      assert.sameMembers(result.rest, expected.rest);
    });
  });

  it('should get nouns', function() {
    return wordpos.getNouns(str, function(result) {
      assert.sameMembers(result, expected.nouns);
    });
  });

  it('should get verbs', function() {
    return wordpos.getVerbs(str, function(result) {
      assert.sameMembers(result, expected.verbs);
    });
  });

  it('should get adjectives', function() {
    return wordpos.getAdjectives(str, function(result) {
      assert.sameMembers(result, expected.adjectives);
    });
  });

  it('should get adverbs', function() {
    return wordpos.getAdverbs(str, function(result) {
      assert.sameMembers(result, expected.adverbs);
    });
  });
});


describe('isX()...', function() {
  it('should check if noun', function(done) {
    wordpos.isNoun(expected.nouns[0], function(result) {
      assert.ok(result);
      done();
    });
  });
  it('should check if verb', function(done) {
    wordpos.isVerb(expected.verbs[0], function(result) {
      assert.ok(result);
      done();
    });
  });
  it('should check if adjective', function(done) {
    wordpos.isAdjective(expected.adjectives[0], function(result) {
      assert.ok(result);
      done();
    });
  });
  it('should check if adverb', function(done) {
    wordpos.isAdverb(expected.adverbs[0], function(result) {
      assert.ok(result);
      done();
    });
  });
});


describe('!isX()...', function() {
  it('should check if !noun', function(done) {
    wordpos.isNoun(garble, function(result) {
      assert.notOk(result);
      done();
    });
  });

  it('should check if !verb', function(done) {
    wordpos.isVerb(garble, function(result) {
      assert.notOk(result);
      done();
    });
  });

  it('should check if !adjective', function(done) {
    wordpos.isAdjective(garble, function(result) {
      assert.notOk(result);
      done();
    });
  });

  it('should check if !adverb', function(done) {
    wordpos.isAdverb(garble, function(result) {
      assert.notOk(result);
      done();
    });
  });
});


describe('lookupX()...', function() {
  it('should lookup noun', function(done) {
    wordpos.lookupNoun('squirrel', function(result) {
      assert.equal(result.length, 2);
      assert.equal(result[0].pos, 'n');
      assert.equal(result[0].lemma, 'squirrel');
      done();
    });
  });

  it('should lookup verb', function(done) {
    wordpos.lookupVerb('bear', function(result) {
      assert.equal(result.length, 13);
      assert.equal(result[0].pos, 'v');
      assert.equal(result[0].lemma, 'bear');
      done();
    });
  });

  it('should lookup adjective', function(done) {
    wordpos.lookupAdjective('angry', function(result) {
      assert.equal(result.length, 3);
      assert.equal(result[0].pos, 'a');
      assert.equal(result[0].lemma, 'angry');
      done();
    });
  });

  it('should lookup adverb', function(done) {
    wordpos.lookupAdverb('little', function(result) {
      assert.equal(result.length, 1);
      assert.equal(result[0].pos, 'r');
      assert.equal(result[0].lemma, 'little');
      done();
    });
  });
});


describe('profile option', function() {
  var wp = new WordPOS({profile : true, dictPath: dictPath});

  it('should return time argument for isX()', function(done){
    wp.isNoun(garble, function(result, word, time) {
      assert.equal(word, garble);
      assert.isDefined(time);
      done();
    });
  });

  it('should return time argument for getX()', function(done){
    wp.getNouns(garble, function(result, time) {
      assert.isDefined(time);
      done();
    });
  });

  it('should return time argument for lookupX()', function(done){
    wp.isNoun(garble, function(result, time) {
      assert.isDefined(time);
      done();
    });
  });

  it('should disable stopword filtering', function(done){
    var wp = new WordPOS({stopwords : false, dictPath: dictPath}),
      strWithStopwords = 'about after all';  // 3 adjective stopwords
    wp.getAdjectives(strWithStopwords, function(result){
      assert.equal(result.length, 3);
      done();
    });
  });

  it('should use custom stopwords', function(done){
    var wp = new WordPOS({stopwords : ['all'], dictPath: dictPath}),
      strWithStopwords = 'about after all';  // 3 adjective stopwords
    // 'all' should be filtered
    wp.getAdjectives(strWithStopwords, function(result){
      assert.equal(result.length, 2);
      done();
    });
  });
});


describe('nested callbacks on same index key', function() {
  var wp = new WordPOS({dictPath: dictPath}),
    word1 = 'head',
    word2 =  word1 + 'er';

  it('should call inner callback', function(done){
    wp.getPOS(word1, function(result) {
      assert.equal(result.nouns[0], word1);

      // inner call on word2
      wp.getPOS(word2, function(result) {
        assert.equal(result.nouns[0], word2);
        done();
      });
    });
  });
});


describe('rand()...', function() {
  it('should get random word', function() {
    return wordpos.rand(function(result) {
      assert.equal(result.length, 1);
    });
  });

  it('should get N random words', function() {
    return wordpos.rand({count: 3}, function(result) {
      assert.equal(result.length, 3);
    });
  });

  it('should get random word starting with', function() {
    return wordpos.rand({startsWith: 'foo'}, function(result, startsWith) {
      assert.equal(result[0].indexOf('foo'), 0);
      assert.equal(startsWith, 'foo');
    });
  });

  it('should get nothing starting with not found', function() {
    return wordpos.rand({startsWith: 'zzzz'}, function(result) {
      assert.equal(result.length, 0);
    });
  });
});


describe('randX()...', function() {
  let assertOneResult = (res) => {
    assert.equal(res.length, 1);
  };

  it('should get random noun', () => wordpos.randNoun(assertOneResult));
  it('should get random verb', () => wordpos.randVerb(assertOneResult));
  it('should get random adjective', () => wordpos.randAdjective(assertOneResult));
  it('should get random adverb', () => wordpos.randAdverb(assertOneResult));

  // not found
  it('should NOT get random noun starting with', () =>
    wordpos.randNoun({startsWith: 'zzzz'}, (result, startsWith) =>
      assert.equal(result.length, 0)
    )
  );
});


describe('seek()...', function() {

  it('should seek offset', function() {
    return wordpos.seek(offset, 'a', function(err, result) {
      assert.equal(result.synsetOffset, offset);
      assert.equal(result.pos, 's');
      assert.equal(result.lemma, 'amazing');
    });
  });

  it('should handle bad offset', function() {
    return wordpos.seek('foobar', 'a', assertOffsetErr).catch(assertOffsetErr);
  });

  it('should handle wrong offset', function() {
    const bad_offset = offset + 1;
    return wordpos.seek(bad_offset, 'a', assertNoData).catch(assertNoData);
  });

  it('should handle very large offset', function() {
    const bad_offset = offset + 999999999;
    return wordpos.seek(bad_offset, 'a', assertNoData).catch(assertNoData);
  });

  it('should handle bad POS', function() {
    const assertErr = err => {
      assert(err instanceof Error);
      assert(/Incorrect POS/.test(err.message));
    };
    return wordpos.seek(offset, 'g', assertErr).catch(assertErr);
  });

  it('should handle wrong POS', function() {
    return wordpos.seek(offset, 'v', assertNoData).catch(assertNoData);
  });

});



describe('Promise pattern', function() {

  it('lookup()', function () {
    return wordpos.lookup('hegemony').then(function (result) {
      assert.equal(result.length, 1);
    });
  });

  it('lookupX()', function () {
    return wordpos.lookupNoun('hegemony').then(function (result) {
      assert.equal(result.length, 1);
    });
  });

  it('getPOS()', function () {
    return wordpos.getPOS('hegemony').then(function (result) {
      assert.equal(result.nouns.length, 1);
    });
  });

  it('getX()', function () {
    return wordpos.getVerbs('bear').then(function (result) {
      assert.equal(result.length, 1);
    });
  });

  it('isX()', function () {
    return wordpos.isAdjective('little').then(function (result) {
      assert.equal(result, true);
    });
  });

  it('rand()', function () {
    return wordpos.rand().then(function (result) {
      assert.equal(result.length, 1);
    });
  });

  it('rand({count})', function () {
    return wordpos.rand({count: 5}).then(function (result) {
      assert.equal(result.length, 5);
    });
  });

  it('randNoun()', function () {
    return wordpos.randNoun().then(function (result) {
      assert.equal(result.length, 1);
    });
  });

  it('randNoun({count: 3})', function () {
    return wordpos.randNoun({count: 3}).then(function (result) {
      assert.equal(result.length, 3);
    });
  });

  it('randNoun({startsWith: "foo"})', function () {
    return wordpos.randNoun({startsWith: 'foo'}).then(function (result) {
      assert.equal(result.length, 1);
      assert.equal(result[0].indexOf('foo'), 0);
    });
  });

  it('seek()', function () {
    return wordpos.seek(offset, 'a').then(function (result) {
      assert.equal(result.synsetOffset, offset);
      assert.equal(result.pos, 's');
      assert.equal(result.lemma, 'amazing');

    });
  });

  it('seek() - wrong offset', function () {
    return wordpos.seek(offset + 1, 'a').catch(assertNoData);
  });

  it('seek() - bad offset', function () {
    return wordpos.seek('foobar', 'a').catch(assertOffsetErr);
  });

});
