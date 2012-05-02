/*!
* wordpos
* 
*    part-of-speech utilities using natural's wordnet module. 
*      
* Copyright (c) 2012 mooster@42at.com
* Released under MIT license
*/

var _ = require('underscore')._,
	util = require('util'),
	natural = require('./lib/natural'),
	WordNet = natural.WordNet,
  	tokenizer = new natural.WordTokenizer(),
	stopwords = ' '+ natural.stopwords.join(' ') +' ';

function normalize(word) {
  return word.toLowerCase().replace(/\s+/g, '_');
}

function isStopword(word) {
	return stopwords.indexOf(' '+word+' ') >= 0;
}

function prepText(text) {
	return _.reject(_.uniq(tokenizer.tokenize(text)), isStopword);
}

function lookup(pos) {
	return function(word, callback) {
		word = normalize(word);
		this.lookupFromFiles([
	      {index: this.getIndexFile(pos), data: this.getDataFile(pos)}
	      ], [], word, callback);
	};
}

function is(pos){
	return function(word, callback) {
		var index = this.getIndexFile(pos);
		word = normalize(word);
		index.lookup(word, function(record) {
			callback(!!record);
		});  
	};
}

function get(isFn) { 
	return function(text, callback) {
	  var words = prepText(text),
	    n = words.length,
	    i = 0,
	    self = this,
  		results = [];
	  	  
	  if (!n) return callback(results);
	  words.forEach(function(word,j){
		  self[isFn](word, function(yes){
			  yes && results.push(word);
			  (++i==n) && callback(results);
		  });
	  });
	};
}


var WordPOS = function() {
	WordPOS.super_.apply(this, arguments);
};
util.inherits(WordPOS, WordNet);

var wordposProto = WordPOS.prototype;

// fast POS lookups (only look in specified file)
/**
 * lookupX()
 * Lookup word definition if already know POS
 * 
 * @param string word - word to lookup in given POS
 * @param function callback receives array of definition objects or empty
 * @return none
 */
wordposProto.lookupAdjective = lookup('a');
wordposProto.lookupAdverb = lookup('r');
wordposProto.lookupNoun = lookup('n');
wordposProto.lookupVerb = lookup('v');
	
/**
 * isX()
 * Test if word is given POS
 * 
 * @param string word - word to test for given POS
 * @param function Callback receives true or false if word is given POS
 * @return none
 */
wordposProto.isAdjective = is('a'); 
wordposProto.isAdverb = is('r'); 
wordposProto.isNoun = is('n'); 
wordposProto.isVerb = is('v'); 

/**
 * getX()
 * Find all words in string that are given POS
 * 
 * @param string Text Words to search
 * @param function callback Receives array of words that are given POS 
 * @return none
 */
wordposProto.getAdjectives = get('isAdjective'); 
wordposProto.getAdverbs = get('isAdverb'); 
wordposProto.getNouns = get('isNoun'); 
wordposProto.getVerbs = get('isVerb'); 

if (!wordposProto.getIndexFile)
  wordposProto.getIndexFile = function getIndexFile(pos) {
	    switch(pos) {
	      case 'n':
	        return this.nounIndex;
	      case 'v':
	        return this.verbIndex;
	      case 'a': case 's':
	        return this.adjIndex;
	      case 'r':
	        return this.advIndex;
	    }
	};

/**
 * getPOS()
 * Find all POS for all words in given string
 * 
 * @param string text - words to lookup for POS
 * @param function callback - receives object with words broken into POS or 'rest':
 * 	    Object: {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]}
 * @return none
 */
wordposProto.getPOS = function(text, callback) {
  var data = {nouns:[], verbs:[], adjectives:[], adverbs:[], rest:[]},
  	testFns = 'isNoun isVerb isAdjective isAdverb'.split(' '),
    parts = 'nouns verbs adjectives adverbs'.split(' '),
    words = prepText(text),
  	nTests = testFns.length,
    nWords = words.length,
    self = this,
    c = 0;

  if (!nWords) return callback(data);
  words.forEach(lookup);
  
  function lookup(word){
	  var any = false,	
	  	t=0;
	  word = normalize(word);
	  testFns.forEach(lookupPOS);
	  
	  function lookupPOS(isFn,i,list){
		  self[isFn](word, function(yes){
			  yes && data[parts[i]].push(word);
			  any |= yes;
			  donePOS();
		  });
	  }
	  
	  function donePOS() {
		  if (++t == nTests) {
			  !any && data['rest'].push(word);
			  done();
		  }
	  }
  }
  
  function done(){
	  if (++c == nWords) {
		  callback(data);
	  }
  }
};

module.exports = WordPOS;
