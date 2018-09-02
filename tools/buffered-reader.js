/**
 * @name BufferedReader.
 * @description Fully configurable buffered reader for node.js.
 *
 * @author Gabriel Llamas
 * @created 10/04/2012
 * @modified 01/05/2012
 * @version 0.2.0
 *
 * Forked: https://github.com/moos/Node-BufferedReader
 * 2018-09-02: use Buffer.alloc()
 */
"use strict";

var EVENTS = require ("events");
var FS = require ("fs");

var BUFFER_SIZE = 16384;

var INVALID_BUFFER_SIZE = "The buffer size must be greater than 0.";
var INVALID_START_OFFSET = "The start offset must be greater than or equals to 0.";
var INVALID_END_OFFSET = "The end offset must be greater than or equals to 0.";
var INVALID_RANGE_OFFSET = "The end offset must be greater than or equals to the start offset.";
var INVALID_BYTES_RANGE_ERROR = "The number of bytes to read must be greater than 0.";
var INVALID_SEEK_OFFSET = "The offset must be greater than or equals to 0.";
var NO_FILE_ERROR = "The source is not a file.";

var BufferedReader = function (fileName, settings){
  EVENTS.EventEmitter.call (this);

  settings = settings || {};

  if (settings.bufferSize === 0) settings.bufferSize = -1;
  this._settings = {
    bufferSize: settings.bufferSize || BUFFER_SIZE,
    encoding: settings.encoding || null,
    start: settings.start || 0,
    end: settings.end
  };

  if (this._settings.bufferSize < 1) throw new Error (INVALID_BUFFER_SIZE);
  if (this._settings.start < 0) throw new Error (INVALID_START_OFFSET);
  if (this._settings.end < 0) throw new Error (INVALID_END_OFFSET);
  if (this._settings.end < this._settings.start) throw new Error (INVALID_RANGE_OFFSET);

  this._fileName = fileName;
  this._fd = null;
  this._buffer = null;

  this._fileOffset = this._settings.start;
  this._bufferOffset = 0;
  this._dataOffset = 0;
  this._realOffset = this._settings.start;

  this._fileSize = null;
  this._initialized = false;
  this._interrupted = false;
  this._isEOF = false;
  this._noMoreBuffers = false;
  this._needRead = false;
};

BufferedReader.prototype = Object.create (EVENTS.EventEmitter.prototype);
BufferedReader.prototype.constructor = BufferedReader;

BufferedReader.prototype.interrupt = function (){
  this._interrupted = true;
};

BufferedReader.prototype.read = function (){
  var stream = FS.createReadStream (this._fileName, this._settings);

  // node version change: stream.encoding no longer exposed
  stream.encoding = this._settings.encoding;

  var lastChunk;
  var buffer;
  var me = this;
  var lineOffset = 0,
    lineCount = 0,
    byteOffset = 0;

  var onChar = this.listeners ("character").length !== 0,
    onLine = this.listeners ("line").length !== 0,
    onByte = this.listeners ("byte").length !== 0,
    loop = onChar || onLine || onByte;

  stream.on ("data", function (data){
    buffer = data;
    var offset = 0;
    var chunk;
    var character;
    var len = data.length;

    if (loop){
      for (var i=0; i<len; i++){
        if (me._interrupted) break;

        character = data[i];
        if (stream.encoding){
          onChar && me.emit ("character", character === "\r" ? "\n" : character, byteOffset + i);
        }else{
          onByte && me.emit ("byte", character, byteOffset + i);
          continue;
        }

        if (!onLine) continue;
        if (character === "\n" || character === "\r"){
          chunk = data.slice (offset, i);

          if (lastChunk){
            chunk = lastChunk.concat (chunk);
          }

          if (i + 1 !== len && character === "\r" && data[i + 1] === "\n"){
            i++;
          }

          me.emit ("line", chunk, lineOffset + offset, ++lineCount);
          offset = i + 1;
          if (lastChunk){
              lineOffset += lastChunk.length;
              lastChunk = null;
            }
        }
      }

      if (stream.encoding && offset !== len){
        var s = offset === 0 ? data : data.slice (offset);
        lastChunk = lastChunk ? lastChunk.concat (s) : s;
      }
      lineOffset += offset;
    }

    me.emit ("buffer", data, byteOffset);
    if (me._interrupted){
      me._interrupted = false;
      stream.destroy ();
      me.emit ("end");
    }
    byteOffset += len;

  });

  stream.on ("end", function (){
    me._interrupted = false;
    if (loop && lastChunk){
      me.emit ("line", lastChunk);
    }
    me.emit ("end");
  });

  stream.on ("error", function (error){
    me._interrupted = false;
    me.emit ("error", error);
  });
};

BufferedReader.prototype._init = function (cb){
  var me = this;
  FS.stat (this._fileName, function (error, stats){
    if (error) return cb (error);
    if (stats.isFile ()){
      if (me._settings.start >= stats.size){
        me._isEOF = true;
        return cb (null);
      }
      if (!me._settings.end && me._settings.end !== 0){
        me._settings.end = stats.size;
      }
      if (me._settings.end >= stats.size){
        me._settings.end = stats.size - 1;
      }
      me._fileSize = stats.size;
      cb (null);
    }else{
      cb (new Error (NO_FILE_ERROR));
    }
  });
};

BufferedReader.prototype._read = function (cb){
  var me = this;
  var size = this._settings.bufferSize;
  FS.read (this._fd, this._buffer, 0, size, this._fileOffset, function (error, bytesRead){
    if (error) return cb (error);

    me._fileOffset += bytesRead;
    if (me._fileOffset === me._fileSize){
      me._noMoreBuffers = true;
    }
    if (bytesRead < size){
      me._buffer = me._buffer.slice (0, bytesRead);
    }
    cb (null);
  });
};

BufferedReader.prototype._readBytes = function (bytes, cb){
  if (this._needRead){
    this._needRead = false;
    var me = this;
    this._read (function (error){
      if (error) return cb (error, null, -1);
      me._readBytes (bytes, cb);
    });
    return;
  }

  var fill = function (){
    var endData = bytes - me._dataOffset;
    var endBuffer = me._buffer.length - me._bufferOffset;
    var end = endBuffer <= endData ? endBuffer : endData;

    me._buffer.copy (data, me._dataOffset, me._bufferOffset, me._bufferOffset + end);
    me._bufferOffset += end;
    me._realOffset += end;

    if (me._bufferOffset === me._buffer.length){
      me._bufferOffset = 0;
      me._needRead = true;
    }
    me._dataOffset += end;

    if (me._dataOffset === bytes){
      me._dataOffset = 0;
      me._isEOF = me._noMoreBuffers;
      cb (null, data, bytes);
    }else{
      if (me._noMoreBuffers){
        me._isEOF = true;
        end = me._dataOffset;
        me._dataOffset = 0;
        cb (null, data.slice (0, end), end);
      }else{
        me._needRead = false;
        me._read (function (error){
          if (error) return cb (error, null, -1);

          fill ();
        });
      }
    }
  };

  var me = this;

  var max = me._settings.end - me._realOffset + 1;
  bytes = max < bytes ? max : bytes;
  if (bytes === 0) return cb (null, null, 0);

  var data = new Buffer.alloc(bytes);
  var len = me._buffer.length;

  if (bytes <= len){
    var end = me._bufferOffset + bytes;

    if (end <= len){
      me._buffer.copy (data, 0, me._bufferOffset, end);
      me._bufferOffset = end;
      me._realOffset += bytes;
      cb (null, data, bytes);
    }else{
      var last = len - me._bufferOffset;
      me._realOffset += last;

      if (last !== 0){
        me._buffer.copy (data, 0, me._bufferOffset, me._bufferOffset + last);
      }
      if (me._noMoreBuffers){
        me._isEOF = true;
        return cb (null, data.slice (0, last), last);
      }

      me._read (function (error){
        if (error) return cb (error, null, -1);

        len = me._buffer.length;
        var remaining = bytes - last;
        if (len <= remaining){
          me._realOffset += len;
          me._isEOF = true;
          me._buffer.copy (data, last, 0, len);
          var lastChunk = last + len;
          cb (null, data.slice (0, lastChunk), lastChunk);
        }else{
          me._realOffset += remaining;
          me._bufferOffset = remaining;
          me._buffer.copy (data, last, 0, me._bufferOffset);
          cb (null, data, bytes);
        }
      });
    }
  }else{
    fill ();
  }
};

BufferedReader.prototype.close = function (cb){
  if (cb) cb = cb.bind (this);
  if (!this._fd){
    if (cb) cb (null);
    return;
  }

  var me = this;
  FS.close (this._fd, function (error){
    me._fd = null;
    me._buffer = null;
    if (cb) cb (error);
  });
};

BufferedReader.prototype.readBytes = function (bytes, cb){
  cb = cb.bind (this);
  if (bytes < 1 || this._isEOF) return cb (null, null, 0);

  var open = function (){
    if (me._isEOF) return cb (null, null, 0);
    FS.open (me._fileName, "r", function (error, fd){
      if (error) return cb (error, null, -1);

      me._fd = fd;
      me._buffer = new Buffer.alloc(me._settings.bufferSize);
      me._read (function (error){
        if (error) return cb (error, null, -1);
        me._readBytes (bytes, cb);
      });
    });
  };

  var me = this;
  if (!this._initialized){
    this._init (function (error){
      if (error) return cb (error, null);
      me._initialized = true;
      open ();
    });
  }else{
    if (!this._fd) return open ();
    this._readBytes (bytes, cb);
  }
};

BufferedReader.prototype.seek = function (offset, cb){
  cb = cb.bind (this);
  if (offset < 0) return cb (new Error (INVALID_SEEK_OFFSET));

  var seek = function (){
    offset += me._settings.start;
    if (offset >= me._settings.end + 1){
      me._isEOF = true;
    }else{
      me._isEOF = false;
      var start = me._fileOffset - (me._buffer ? me._buffer.length : 0);
      if (offset >= start && offset < me._fileOffset){
        me._bufferOffset = offset - start;
        me._realOffset = offset;
      }else{
        me._needRead = me._fd ? true : false;
        me._noMoreBuffers = false;
        me._fileOffset = offset;
        me._bufferOffset = 0;
        me._realOffset = offset;
      }
    }
    cb (null);
  };

  var me = this;
  if (!this._initialized){
    this._init (function (error){
      if (error) return cb (error, null);
      me._initialized = true;
      seek ();
    });
  }else{
    seek ();
  }
};

BufferedReader.prototype.skip = function (bytes, cb){
  cb = cb.bind (this);
  if (bytes < 1 || this._isEOF) return cb (null, 0);

  var skip = function (){
    var remaining = me._settings.end - me._realOffset + 1;
    bytes = bytes <= remaining ? bytes : remaining;
    me.seek (me._realOffset - me._settings.start + bytes, function (){
      cb (null, bytes);
    });
  };

  var me = this;
  if (!this._initialized){
    this._init (function (error){
      if (error) return cb (error, null);
      me._initialized = true;
      skip ();
    });
  }else{
    skip ();
  }
};

module.exports = BufferedReader;
