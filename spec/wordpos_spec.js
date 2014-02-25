/**
 * wordpos_spec.js
 *
 * spec file for main wordpos functionality
 *
 * Usage:
 *   npm install jasmine-node -g
 *   jasmine-node wordpos_spec.js --verbose
 *
 * Copyright (c) 2012 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */
var WordPOS = require('../src/wordpos'),
  wordpos = new WordPOS();

var str = "The angry bear chased the frightened little squirrel",
  expected = {
    nouns: [ 'bear', 'squirrel', 'little', 'chased' ],
    verbs: [ 'bear' ],
    adjectives: [ 'little', 'angry', 'frightened' ],
    adverbs: [ 'little' ],
    rest: [ 'the' ]
  },
  garble = 'garblegarble';	// expect not to find word


describe('getX()...', function() {

  beforeEach(function() {
    this.addMatchers({
    // unordered (multiset) comparison -- NOTE: doesn't handle deep!
    toEqualUnordered: function(expected) {
      var mismatchKeys=[],
        mismatchValues=[],
        result = this.env.compareObjects_(this.actual, expected, mismatchKeys, mismatchValues);
        return result || (mismatchKeys.length == 0 && mismatchValues.length > 0);
      }
    });
  });

  it('should get all POS', function(done) {
    wordpos.getPOS(str, function(result) {
      expect(result.nouns).toEqualUnordered(expected.nouns);
      expect(result.verbs).toEqualUnordered(expected.verbs);
      expect(result.adjectives).toEqualUnordered(expected.adjectives);
      expect(result.adverbs).toEqualUnordered(expected.adverbs);
      expect(result.rest).toEqualUnordered(expected.rest);
      done();
    });
  });

  it('should get nouns', function(done) {
    wordpos.getNouns(str, function(result) {
      expect(result).toEqualUnordered(expected.nouns);
      done();
    });
  });

  it('should get verbs', function(done) {
    wordpos.getVerbs(str, function(result) {
      expect(result).toEqualUnordered(expected.verbs);
      done();
    });
  });

  it('should get adjectives', function(done) {
    wordpos.getAdjectives(str, function(result) {
      expect(result).toEqualUnordered(expected.adjectives);
      done();
    });
  });

  it('should get adverbs', function(done) {
    wordpos.getAdverbs(str, function(result) {
      expect(result).toEqualUnordered(expected.adverbs);
      done();
    });
  });
});

describe('isX()...', function() {
  it('should check if noun', function(done) {
    wordpos.isNoun(expected.nouns[0], function(result) {
      expect(result).toBeTruthy();
      done();
    });
  });
  it('should check if verb', function(done) {
    wordpos.isVerb(expected.verbs[0], function(result) {
      expect(result).toBeTruthy();
      done();
    });
  });
  it('should check if adjective', function(done) {
    wordpos.isAdjective(expected.adjectives[0], function(result) {
      expect(result).toBeTruthy();
      done();
    });
  });
  it('should check if adverb', function(done) {
    wordpos.isAdverb(expected.adverbs[0], function(result) {
      expect(result).toBeTruthy();
      done();
    });
  });
});

describe('!isX()...', function() {
  it('should check if !noun', function(done) {
    wordpos.isNoun(garble, function(result) {
      expect(result).not.toBeTruthy();
      done();
    });
  });
  it('should check if !verb', function(done) {
    wordpos.isVerb(garble, function(result) {
      expect(result).not.toBeTruthy();
      done();
    });
  });
  it('should check if !adjective', function(done) {
    wordpos.isAdjective(garble, function(result) {
      expect(result).not.toBeTruthy();
      done();
    });
  });
  it('should check if !adverb', function(done) {
    wordpos.isAdverb(garble, function(result) {
      expect(result).not.toBeTruthy();
      done();
    });
  });
});

describe('lookupX()...', function() {
  it('should lookup noun', function(done) {
    wordpos.lookupNoun('squirrel', function(result) {
      expect(result[0].pos).toBe('n');
      expect(result[0].lemma).toBe('squirrel');
      done();
    });
  });
  it('should lookup verb', function(done) {
    wordpos.lookupVerb('bear', function(result) {
      expect(result[0].pos).toBe('v');
      expect(result[0].lemma).toBe('have_a_bun_in_the_oven');
      done();
    });
  });
  it('should lookup adjective', function(done) {
    wordpos.lookupAdjective('angry', function(result) {
      expect(result[0].pos).toBe('s');
      expect(result[0].lemma).toBe('angry');
      done();
    });
  });
  it('should lookup adverb', function(done) {
    wordpos.lookupAdverb('little', function(result) {
      expect(result[0].pos).toBe('r');
      expect(result[0].lemma).toBe('little');
      done();
    });
  });
});

describe('options passed to constructor', function() {
    var wp, origProfile = WordPOS.defaults.profile;

    it('should override default option', function(){
      wp = new WordPOS({profile:123});
      expect(wp.options.profile).toEqual(123);
      expect(WordPOS.defaults.profile).toEqual(origProfile);
    });

    it('should not erase default option', function(){
      wp = new WordPOS({aaa:123});
      expect(wp.options.aaa).toEqual(123);
      expect(wp.options.profile).toEqual(WordPOS.defaults.profile);
    });
});

describe('profile option', function() {
  var wp = new WordPOS({profile : true});

  it('should return time argument for isX()', function(done){
    wp.isNoun(garble, function(result, word, time) {
      expect(word).toEqual(garble);
      expect(time).toBeDefined();
      done();
    });
  });

  it('should return time argument for getX()', function(done){
    wp.getNouns(garble, function(result, time) {
      expect(time).toBeDefined();
      done();
    });
  });

  it('should return time argument for lookupX()', function(done){
    wp.isNoun(garble, function(result, time) {
      expect(time).toBeDefined();
      done();
    });
  });

  it('should disable stopword filtering', function(){
    var wp = new WordPOS({stopwords : false}),
      strWithStopwords = 'about after all';  // 3 adjective stopwords
    expect(wp.getAdjectives(strWithStopwords, noop)).toBe(3);
  });

  it('should use custom stopwords', function(){
    var wp = new WordPOS({stopwords : ['all']}),
      strWithStopwords = 'about after all';  // 3 adjective stopwords
    // 'all' should be filtered
    expect(wp.getAdjectives(strWithStopwords, noop)).toBe(2);
  });

});


describe('nested callbacks on same index key', function() {
  var wp = new WordPOS(),
    word1 = 'head',
    word2 =  word1 + 'er';

  it('should call inner callback', function(done){
    wp.getPOS(word1, function(result) {
      expect(result.nouns[0]).toEqual(word1);

      // inner call on word2
      wp.getPOS(word2, function(result) {
        expect(result.nouns[0]).toEqual(word2);
        done();
      });
    });
  });
});

function noop(){}

