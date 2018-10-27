#!/usr/bin/env node

/**
 * takes original WordNet index & data files and converts to
 * exported JSON format with lemma as the key.
 */

let fs = require('fs');
let path = require('path');

let outPath = './dict';
let testPath = './test/dict';
let posExt = ['adj', 'adv', 'noun', 'verb'];
let dictRoot = './node_modules/wordnet-db/dict/';
const fileTypes = {
  data: true,
  index: true
};
const [,, ...args] = process.argv;

if (!args.length || args.filter(p => !(p in fileTypes)).length) {
  console.log('Converts wordnet-db index & data files to JSON format for use in the browser.');
  console.log('\nUsage:  makeJsonDict.js index|data');
  process.exit(1);
}

function uniq(arr) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
}

console.time('Done');

// create out directory
const ensurePath = (path) => {
  try {
    fs.statSync(path);
  } catch (e) {
    fs.mkdirSync(path);
  }
};

ensurePath(outPath);
ensurePath(testPath);

function processFile(name) {

  // read the file as text
  function loadFile(pos) {
    console.time('  load');
    let inPath = path.resolve(dictRoot, name + '.' + pos);
    let text = fs.readFileSync(inPath, 'utf8');
    console.timeEnd('  load');
    return text;
  }

  // convert raw text to JSON and write to file
  function processText(pos, text) {
    let obj = {};
    let sp = ' ';
    console.time('  process');
    text.split('\n').forEach(line => {
      if (!line || line[0] === sp) return;
      let spi = line.indexOf(sp);
      let key = line.substr(0, spi);
      line = line.substring(1 + spi, line.lastIndexOf(sp + sp))
      obj[key] = line;
    });
    console.timeEnd('  process');
    return obj;
  }

  function writeFile(pos, obj) {
    console.time('  write');
    let text = JSON.stringify(obj);
    fs.writeFileSync(path.resolve(outPath, name + '.' + pos + '.js'),
      'export default ' + text);

    // also write for mocha tests
    fs.writeFileSync(path.resolve(testPath, name + '.' + pos + '.js'),
      'module.exports.default = ' + text);

    console.timeEnd('  write');
  }

  posExt.forEach(pos => {
    console.log('\n', name, pos, ':');
    let text = loadFile(pos);
    let obj = processText(pos, text);
    writeFile(pos, obj);
  });
}

uniq(args).forEach(processFile);

console.log('\nWritten to', path.resolve(outPath));
console.timeEnd('Done');
