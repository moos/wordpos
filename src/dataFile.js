/*!
 * dataFile.js
 *
 * Copyright (c) 2012-2018 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Portions: Copyright (c) 2011, Chris Umbel
 *
 * Released under MIT license
 */

var fs = require('fs'),
  path = require('path'),
  _ = require('underscore');

/**
 * sanity check read data - line must start with zero-padded location
 *
 * @param line {string} - line data read
 * @return {boolean} true if line data is good
 */
function dataCheck(line, location) {
  var pad = '00000000', // 8 zeros
    padded = String(pad + location).slice( - pad.length);
  return line.indexOf(padded) === 0;
}

/**
 * parse a single data file line, returning data object
 *
 * @param line {string} - a single line from WordNet data file
 * @returns {object}
 *
 * Credit for this routine to https://github.com/NaturalNode/natural
 */
function lineDataToJSON(line, location) {
  if (!dataCheck(line, location)) return new Error('Bad data at location ' + location);

  var data = line.split('| '),
    tokens = data[0].split(/\s+/),
    ptrs = [],
    wCnt = parseInt(tokens[3], 16),
    synonyms = [],
    i;

  for(i = 0; i < wCnt; i++) {
    synonyms.push(tokens[4 + i * 2]);
  }

  var ptrOffset = (wCnt - 1) * 2 + 6;
  for(i = 0; i < parseInt(tokens[ptrOffset], 10); i++) {
    ptrs.push({
      pointerSymbol: tokens[ptrOffset + 1 + i * 4],
      synsetOffset: parseInt(tokens[ptrOffset + 2 + i * 4], 10),
      pos: tokens[ptrOffset + 3 + i * 4],
      sourceTarget: tokens[ptrOffset + 4 + i * 4]
    });
  }

  // break "gloss" into definition vs. examples
  var glossArray = data[1].split("; ");
  var definition = glossArray[0];
  var examples = glossArray.slice(1);
  var lexFilenum = parseInt(tokens[1], 10);

  for (var k = 0; k < examples.length; k++) {
    examples[k] = examples[k].replace(/\"/g,'').replace(/\s\s+/g,'');
  }

  return {
    synsetOffset: parseInt(tokens[0], 10),
    lexFilenum: lexFilenum,
    lexName: DataFile.LEX_NAMES[ lexFilenum ],
    pos: tokens[2],
    wCnt: wCnt,
    lemma: tokens[4],
    synonyms: synonyms,
    lexId: tokens[5],
    ptrs: ptrs,
    gloss: data[1],
    def: definition,
    exp: examples
  };
}

/**
 * read data file at location (bound to a data file).
 * Reads nominal length and checks for EOL.  Continue reading until EOL.
 *
 * @param location {Number} - seek location
 * @param callback {function} - callback function
 */
function readLocation(location, callback) {
  //console.log('## read location ', this.fileName, location);
  var
    file = this,
    str = '',
    len = file.nominalLineLength,
    buffer = new Buffer.alloc(len);

  readChunk(location, function(err, count) {
    if (err) {
      //console.log(err);
      callback(err);
      return;
    }
    //console.log('  read %d bytes at <%d>', count, location);
    callback(null, lineDataToJSON(str, location));
  });

  function readChunk(pos, cb) {
    var nonDataErr = new Error('no data at offset ' + pos);

    fs.read(file.fd, buffer, 0, len, pos, function (err, count) {
      if (!count) return cb(nonDataErr, count);

      str += buffer.toString('ascii');
      var eol = str.indexOf('\n');
      //console.log('  -- read %d bytes at <%d>', count, pos, eol);
      if (count && eol === -1 && len < file.maxLineLength) {
        // continue reading
        return readChunk(pos + count, cb);
      }

      str = str.substr(0, eol);
      if (str === '' && !err) err = nonDataErr;
      cb(err, count);
    });
  }
}

/**
 * main lookup function
 *
 * @param offsets {array} - array of offsets to lookup (obtained from index.find())
 * @param callback{function} (optional) - callback function
 * @returns {Promise}
 */
function lookup(offsets, callback) {
  var results = [],
    self = this,
    single = !_.isArray(offsets);

  if (single) offsets = [offsets];
  return new Promise(function(resolve, reject) {
    offsets
      .map(function (offset) {
        return _.partial(readLocation.bind(self), offset);
      })
      .map(promisifyInto(results))
      .reduce(serialize, openFile())
      .then(done)
      .catch(done);

    function done(lastResult) {
      closeFile();
      if (lastResult instanceof Error) {
        callback && callback(lastResult, single ? {} :[]);
        reject(lastResult);
      } else {
        if (single) results = results[0];
        callback && callback(null, results);
        resolve(results);
      }
    }
  });

  function serialize(prev, next) {
    return prev.then(next);
  }

  function openFile() {
    if (!self.fd) {
      // console.log(' ... opening', self.filePath);
      self.fd = fs.openSync(self.filePath, 'r');
    }
    // ref count so we know when to close the main index file
    ++self.refcount;
    return Promise.resolve();
  }

  function closeFile() {
    if (--self.refcount === 0) {
      // console.log(' ... closing', self.filePath);
      fs.closeSync(self.fd);
      self.fd = null;
    }
    return Promise.resolve();
  }
}

/**
 * turn ordinary function into a promising one!
 *
 * @param collect {Array} - used to collect results
 * @returns {Function}
 */
function promisifyInto(collect) {
  return function(fn) {
    return function() {
      return new Promise(function (resolve, reject) {
        fn(function (error, result) {   // Note: callback signature!
          if (error) {
            reject(error);
          }
          else {
            collect && collect.push(result);
            resolve(result);
          }
        });
      });
    };
  }
}


/**
 * DataFile class
 *
 * @param dictPath {string} - path to dict folder
 * @param name {string} - POS name
 * @constructor
 */
var DataFile = function(dictPath, name) {
  this.dictPath = dictPath;
  this.fileName = 'data.' + name;
  this.filePath = path.join(this.dictPath, this.fileName);

  this.maxLineLength = DataFile.MAX_LINE_LENGTH[ name ];
  this.nominalLineLength = MAX_SINGLE_READ_LENGTH;
  this.refcount = 0;
};

/**
 * maximum read length at a time
 * @type {Number}
 */
var MAX_SINGLE_READ_LENGTH = 512;

/**
 * lookup
 */
DataFile.prototype.lookup = lookup;


/**
 * maximum line length in each data file - used to optimize reads
 *
 * wc -L data.adv as of v3.1
 */
DataFile.MAX_LINE_LENGTH = {
  noun: 12972,
  verb: 7713,
  adj: 2794,
  adv: 638
};

/**
 * map of lexFilenum to lex names
 *
 * @see https://wordnet.princeton.edu/wordnet/man/lexnames.5WN.html
 * @type {string[]}
 */
DataFile.LEX_NAMES = [
  'adj.all',
  'adj.pert',
  'adv.all',
  'noun.Tops',
  'noun.act',
  'noun.animal',
  'noun.artifact',
  'noun.attribute',
  'noun.body',
  'noun.cognition',
  'noun.communication',
  'noun.event',
  'noun.feeling',
  'noun.food',
  'noun.group',
  'noun.location',
  'noun.motive',
  'noun.object',
  'noun.person',
  'noun.phenomenon',
  'noun.plant',
  'noun.possession',
  'noun.process',
  'noun.quantity',
  'noun.relation',
  'noun.shape',
  'noun.state',
  'noun.substance',
  'noun.time',
  'verb.body',
  'verb.change',
  'verb.cognition',
  'verb.communication',
  'verb.competition',
  'verb.consumption',
  'verb.contact',
  'verb.creation',
  'verb.emotion',
  'verb.motion',
  'verb.perception',
  'verb.possession',
  'verb.social',
  'verb.stative',
  'verb.weather',
  'adj.ppl'
];

module.exports = DataFile;
