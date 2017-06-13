/**
 * validate_test.js
 *
 *     Run validate on all four main index files
 *
 * Copyright (c) 2012-2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var
  chai = require('chai'),
  assert = chai.assert,
  exec = require('child_process').exec,
  cmd = 'node ' + __dirname + '/../tools/validate ',
  TIMEOUT_SEC = 45 * 1000,
  gDone;


describe('validate isX() using fastIndex', function() {

  this.timeout(TIMEOUT_SEC);
  this.slow(1800);

  it('should validate index.verb', function(done) {
    gDone = done;
    exec(cmd + 'index.verb', callback);
  });

  it('should validate index.adv', function(done) {
    gDone = done;
    exec(cmd + 'index.adv', callback);
  });

  it('should validate index.adj', function(done) {
    gDone = done;
    exec(cmd + 'index.adj', callback);
  });

  it('should validate index.noun', function(done) {
    gDone = done;
    exec(cmd + 'index.noun', callback);
  });

});

function callback(error, stdout, stderr) {
  assert.isNull(error);
  console.log(stdout);
  console.error(stderr);
  gDone();
}