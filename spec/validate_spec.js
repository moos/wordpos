/**
 * validate_spec.js
 *
 * Run validate on all four main index files
 *
 * Usage:
 *   npm install jasmine-node -g
 *   jasmine-node validate_spec.js --verbose
 *
 * Copyright (c) 2012 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */
var
  exec = require('child_process').exec,
  cmd = 'node ' + __dirname + '/../tools/validate ';

describe('validate isX() using fastIndex', function() {

  it('should validate index.noun', function() {
    exec(cmd + 'index.noun', callback);
    asyncSpecWait();
  });

  it('should validate index.verb', function() {
    exec(cmd + 'index.verb', callback);
    asyncSpecWait();
  });

  it('should validate index.adv', function() {
    exec(cmd + 'index.adv', callback);
    asyncSpecWait();
  });

  it('should validate index.adj', function() {
    exec(cmd + 'index.adj', callback);
    asyncSpecWait();
  });

});

function callback(error, stdout, stderr) {
  expect(error).toBe(null);
  console.log(stdout);
  console.error(stderr);
  asyncSpecDone();
}