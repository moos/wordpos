/**
 * browser_test.js
 *
 *   test file for browser-specific  functionality
 *
 * Usage:
 *   npm install mocha -g
 *   mocha browser_test.js -require @babel/register
 *
 *   or
 *
 *   npm test
 *
 * Copyright (c) 2012-2020 mooster@42at.com
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
  wordpos,
  path = require('path'),
  dictPath = browser ? path.resolve('./test/dict') : undefined;

const dictRequired = () => Object.keys(require.cache).filter(p => /\bdict\b/i.test(p));

if (!browser) {
  throw new Error('Not in browser mode!');
}
chai.config.showDiff = true;

describe('options: preload', () => {

  // clear require.cache before each test
  beforeEach(() => {
    dictRequired().forEach((m) => delete require.cache[m]);
  });

  it('preload: false', () => {
    wordpos = new WordPOS({
      preload: false,
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res, undefined);
      assert.equal(dictRequired().length, 0);
    });
  });

  it('preload: true', () => {
    assert.equal(dictRequired().length, 0);
    wordpos = new WordPOS({
      preload: true,
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res.length, 4);
      res.forEach(index => assert.equal(index.type, 'index'));
      res.forEach(index => assert.equal(/\bdict.index\./.test(index.filePath), true));

      let reqs = dictRequired();
      assert.equal(reqs.length, 4);
      reqs.forEach(req => assert.equal(/\bdict.index\./.test(req), true));
      Object.values(WordPOS.POS).forEach(pos => assert.notEqual(reqs.join().indexOf(`index.${pos}.js`), -1));
    });
  });

  it('preload: "r"', () => {
    wordpos = new WordPOS({
      preload: 'r',
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res.type, 'index');
      assert.equal(res.posName, 'adv');
      let reqs = dictRequired();
      assert.equal(reqs.length, 1);
      assert.equal(/index\.adv\.js/.test(reqs[0]), true);
    });
  });

  it('preload: ["r","a"]', () => {
    wordpos = new WordPOS({
      preload: ['r','a'],
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res.length, 2);

      // TODO -- order may NOT be always the same!!!
      assert.equal(res[0].type, 'index');
      assert.equal(res[0].posName, 'adv');
      assert.equal(res[1].type, 'index');
      assert.equal(res[1].posName, 'adj');

      let reqs = dictRequired();
      assert.equal(reqs.length, 2);
      assert.equal(/index\.adv\.js/.test(reqs[0]), true);
      assert.equal(/index\.adj\.js/.test(reqs[1]), true);
    });
  });

  it('preload: "foo"', () => {
    wordpos = new WordPOS({
      preload: 'foo',
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      // shouldn't get here
      assert(false);
    }).catch(err => {
      assert.equal(err, 'RangeError: Unknown POS "foo" for preload.')
    });
  });
});



describe('options: preload with includeData', () => {

  // clear require.cache before each test
  beforeEach(() => {
    dictRequired().forEach((m) => delete require.cache[m]);
  });

  it('preload: false', () => {
    wordpos = new WordPOS({
      preload: false,
      includeData: true,
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res, undefined);
      assert.equal(dictRequired().length, 0);
    });
  });

  it('preload: true', () => {
    assert.equal(dictRequired().length, 0);
    wordpos = new WordPOS({
      preload: true,
      includeData: true,
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res.length, 8);
      assert.equal(res.filter(m => m.type === 'index').length, 4);
      assert.equal(res.filter(m => m.type === 'data').length, 4);
      assert.equal(res.filter(m => /\bdict.index\./.test(m.filePath)).length, 4);
      assert.equal(res.filter(m => /\bdict.data\./.test(m.filePath)).length, 4);

      let reqs = dictRequired();
      assert.equal(reqs.length, 8);
      assert.equal(reqs.filter(m => /\bdict.index\./.test(m)).length, 4);
      assert.equal(reqs.filter(m => /\bdict.data\./.test(m)).length, 4);

      let reqsStr = reqs.join();
      Object.values(WordPOS.POS).forEach(pos => {
        assert.equal(reqs.filter(m => m.indexOf(`index.${pos}.js`) !== -1).length, 1);
        assert.equal(reqs.filter(m => m.indexOf(`data.${pos}.js`) !== -1).length, 1);
      });
    });
  });

  it('preload: "r"', () => {
    wordpos = new WordPOS({
      preload: 'r',
      includeData: true,
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res.length, 2);
      assert.equal(res[0].type, 'index');
      assert.equal(res[0].posName, 'adv');
      assert.equal(res[1].type, 'data');
      assert.equal(res[1].posName, 'adv');
      let reqs = dictRequired();
      assert.equal(reqs.length, 2);
      assert.equal(/index\.adv\.js/.test(reqs[0]), true);
      assert.equal(/data\.adv\.js/.test(reqs[1]), true);
    });
  });

  it('preload: ["r","a"]', () => {
    wordpos = new WordPOS({
      preload: ['r','a'],
      includeData: true,
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      assert.equal(res.length, 4);

      // TODO -- order may NOT be always the same!!!
      assert.equal(res[0].type, 'index');
      assert.equal(res[0].posName, 'adv');
      assert.equal(res[1].type, 'index');
      assert.equal(res[1].posName, 'adj');

      assert.equal(res[2].type, 'data');
      assert.equal(res[2].posName, 'adv');
      assert.equal(res[3].type, 'data');
      assert.equal(res[3].posName, 'adj');

      let reqs = dictRequired();
      assert.equal(reqs.length, 4);
      assert.equal(/index\.adv\.js/.test(reqs[0]), true);
      assert.equal(/index\.adj\.js/.test(reqs[1]), true);
      assert.equal(/data\.adv\.js/.test(reqs[2]), true);
      assert.equal(/data\.adj\.js/.test(reqs[3]), true);
    });
  });

  it('preload: "foo"', () => {
    wordpos = new WordPOS({
      preload: 'foo',
      includeData: true,
      dictPath: dictPath
    });
    return wordpos.ready().then(res => {
      // shouldn't get here
      assert(false);
    }).catch(err => {
      assert.equal(err, 'RangeError: Unknown POS "foo" for preload.')
    });
  });


});
