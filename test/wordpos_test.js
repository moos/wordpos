/**
 * wordpos_test.js
 *
 *   test file for main wordpos functionality
 *
 * Usage:
 *   npm install mocha -g
 *   mocha wordpos_test.js
 *
 *   or
 *
 *   npm test
 *
 * Copyright (c) 2012-2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

//import {describe, it} from 'mocha/lib/mocha.js';

var
  chai = require('chai'),
  _ = require('underscore'),
  assert = chai.assert,
  WordPOS = require('../src/wordpos'),
  wordpos = new WordPOS({profile: false});

chai.config.showDiff = true;

var str = "The angry bear chased the frightened little squirrel",
  expected = {
    nouns: [ 'bear', 'squirrel', 'little', 'chased' ],
    verbs: [ 'bear' ],
    adjectives: [ 'little', 'angry', 'frightened' ],
    adverbs: [ 'little' ],
    rest: [ 'The' ]
  },
  garble = 'garblegarble',	// expect not to find word
  offset = 1285602;



describe('lookup', function() {
  it('with callback', function (done) {
    wordpos.lookup('hegemony', function (result) {
      assert.equal(result.length, 1);
      assert.equal(result[0].pos, 'n');
      assert.equal(result[0].lemma, 'hegemony');
      assert.equal(result[0].synonyms.length, 1);
      done();
    });
  });

  it('with Promise', function (done) {
    wordpos.lookup('hegemony').then(function (result) {
      assert.equal(result.length, 1);
      assert.equal(result[0].pos, 'n');
      assert.equal(result[0].lemma, 'hegemony');
      assert.equal(result[0].synonyms.length, 1);
      done();
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
  it('should get all POS', function(done) {
    wordpos.getPOS(str, function(result) {
      assert.sameMembers(result.nouns, expected.nouns);
      assert.sameMembers(result.verbs, expected.verbs);
      assert.sameMembers(result.adjectives, expected.adjectives);
      assert.sameMembers(result.adverbs, expected.adverbs);
      assert.sameMembers(result.rest, expected.rest);
      done();
    });
  });

  it('should get nouns', function(done) {
    wordpos.getNouns(str, function(result) {
      assert.sameMembers(result, expected.nouns);
      done();
    });
  });

  it('should get verbs', function(done) {
    wordpos.getVerbs(str, function(result) {
      assert.sameMembers(result, expected.verbs);
      done();
    });
  });

  it('should get adjectives', function(done) {
    wordpos.getAdjectives(str, function(result) {
      assert.sameMembers(result, expected.adjectives);
      done();
    });
  });

  it('should get adverbs', function(done) {
    wordpos.getAdverbs(str, function(result) {
      assert.sameMembers(result, expected.adverbs);
      done();
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
  var wp = new WordPOS({profile : true});

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
    var wp = new WordPOS({stopwords : false}),
      strWithStopwords = 'about after all';  // 3 adjective stopwords
    wp.getAdjectives(strWithStopwords, function(result){
      assert.equal(result.length, 3);
      done();
    });
  });

  it('should use custom stopwords', function(done){
    var wp = new WordPOS({stopwords : ['all']}),
      strWithStopwords = 'about after all';  // 3 adjective stopwords
    // 'all' should be filtered
    wp.getAdjectives(strWithStopwords, function(result){
      assert.equal(result.length, 2);
      done();
    });
  });
});


describe('nested callbacks on same index key', function() {
  var wp = new WordPOS(),
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
  it('should get random word', function(done) {
    wordpos.rand(function(result) {
      assert.equal(result.length, 1);
      done();
    });
  });

  it('should get N random words', function(done) {
    wordpos.rand({count: 3}, function(result) {
      assert.equal(result.length, 3);
      done();
    });
  });

  it('should get random word starting with', function(done) {
    wordpos.rand({startsWith: 'foo'}, function(result, startsWith) {
      assert.equal(result[0].indexOf('foo'), 0);
      assert.equal(startsWith, 'foo');
      done();
    });
  });

  it('should get nothing starting with not found', function(done) {
    wordpos.rand({startsWith: 'zzzz'}, function(result) {
      assert.equal(result.length, 0);
      done();
    });
  });
});


describe('randX()...', function() {
  it('should get random noun', function(done) {
    wordpos.randNoun(function(result) {
      assert.equal(result.length, 1);
      done();
    });
  });

  it('should get random verb', function(done) {
    wordpos.randVerb(function(result) {
      assert.equal(result.length, 1);
      done();
    });
  });

  it('should get random adjective', function(done) {
    wordpos.randAdjective(function(result) {
      assert.equal(result.length, 1);
      done();
    });
  });

  it('should get random adverb', function(done) {
    wordpos.randAdverb(function(result) {
      assert.equal(result.length, 1);
      done();
    });
  });

  // not found
  it('should NOT get random noun starting with', function(done) {
    wordpos.randNoun({startsWith: 'zzzz'},function(result, startsWith) {
      assert.equal(result.length, 0);
      done();
    });
  });
});


describe('seek()...', function() {

  it('should seek offset', function(done) {
    wordpos.seek(offset, 'a', function(err, result) {
      assert.equal(result.synsetOffset, offset);
      assert.equal(result.pos, 's');
      assert.equal(result.lemma, 'amazing');
      done();
    });
  });

  it('should handle bad offset', function(done) {
      wordpos.seek('foobar', 'a', function(err, result){
        assert(err instanceof Error);
        assert.equal(err.message, 'offset must be valid positive number.');
        done();
      }).catch(_.noop); // UnhandledPromiseRejectionWarning
  });

  it('should handle wrong offset', function(done) {
    var bad_offset = offset + 1;
    wordpos.seek(bad_offset, 'a', function(err, result) {
      assert(err instanceof Error);
      assert.equal(err.message, 'Bad data at location ' + bad_offset);
      assert.deepEqual(result, {});
      done();
    }).catch(_.noop); // UnhandledPromiseRejectionWarning;
  });

  it('should handle very large offset', function(done) {
    var bad_offset = offset + 100000000;
    wordpos.seek(bad_offset, 'a', function(err, result) {
      assert(err instanceof Error);
      assert.equal(err.message, 'no data at offset ' + bad_offset);
      assert.deepEqual(result, {});
      done();
    }).catch(_.noop); // UnhandledPromiseRejectionWarning;
  });

  it('should handle bad POS', function(done) {
    wordpos.seek(offset, 'g', function(err, result) {
      assert(err instanceof Error);
      assert(/Incorrect POS/.test(err.message));
      done();
    }).catch(_.noop); // UnhandledPromiseRejectionWarning;
  });

  it('should handle wrong POS', function(done) {
    wordpos.seek(offset, 'v', function(err, result){
      assert.equal(err.message, 'Bad data at location ' + offset);
    }).catch(_.noop); // UnhandledPromiseRejectionWarning;
    done();
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
    return wordpos.seek(offset + 1, 'a').catch(function (err) {
      assert(err instanceof Error);
      assert.equal(err.message, 'Bad data at location ' + (offset+1));
    });
  });

  it('seek() - bad offset', function () {
    return wordpos.seek('foobar', 'a').catch(function (err) {
      assert(err instanceof Error);
      assert.equal(err.message, 'offset must be valid positive number.');
    });
  });

});