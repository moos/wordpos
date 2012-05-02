wordpos
=======

wordpos is a set of part-of-speech utilities using [natrual's](http://github.com/NaturalNode/natural) WordNet module.


Installation
------------

Get the script and use it.  (npm module may be coming.)

Note: wordpos-bench requires customized bench module (forthcoming). 

    
Usage
----------

    var WordPOS = require('./wordpos'),
        wordpos = new WordPOS('dict');
        
    wordpos.getAdjectives('The angry bear chased the frightened little squirrel.', function(results){
        console.log(results);
    });       
    // [ 'little', 'angry', 'frightened' ]
    

See wordpos_spec.js for full usage.    

License
-------

Copyright (c) 2012, mooster@42at.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
