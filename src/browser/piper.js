/*!
 * piper.js
 *
 *     executes multiple async i/o tasks and pools similar callbacks,
 *     calling i/o open/close when all incoming tasks are done.
 *
 * Copyright (c) 2012-2016 mooster@42at.com
 * https://github.com/moos/wordpos
 *
 * Released under MIT license
 */

var _ = require('underscore')._,
  util = require('util'),
  fs = require('fs');

/**
 * run single 'task' method sharing callbacks.  Method MUST take callback as LAST arg.
 * piper is bound to an IndexFile.
 *
 * @param task {string} - task name unique to method!
 * @param method {function} - method to execute, gets (args, ... , callback)
 * @param args {Array} - args to pass to method
 * @param context {object} - other params to remember and sent to callback
 * @param callback {function} - result callback
 */
function piper(task, method, args, context, callback){
  var readCallbacks = this.callbackQueue,
    memoArgs = _.rest(arguments, 2),
    wrappedCallback;

   //console.log('piper', task, [method]);

  // queue up if already reading file for this task
  if (task in readCallbacks){
    readCallbacks[task].push(memoArgs);
    return;
  }
  readCallbacks[task] = [memoArgs];

  if (!this.fd) {
    //console.log(' ... opening', this.filePath);
    this.fd = fs.openSync(this.filePath, 'r');
  }

  // ref count so we know when to close the main index file
  ++this.refcount;

  wrappedCallback = _.partial(piper.wrapper, this, task);

  // call method -- replace original callback (last arg) with wrapped one
  method.apply(null, [].concat( args, wrappedCallback ));
}

// result is the *same* for same task
piper.wrapper = function(self, task /*, result...*/){
  var readCallbacks = self.callbackQueue,
    result = _.rest(arguments, 2),
    callback, args;

  // live access callbacks cache in case nested cb's
  // add to the array.
  while (args = readCallbacks[task].shift()) {
    callback = args.pop(); // last arg MUST be callback

//    console.log('>>>> pper wrapper', self.fastIndex.name, task, result.toString())
    callback.apply(null, [].concat(_.flatten(args, /*shallow*/true), result));
  }

  // now done - delete cb cache
  delete readCallbacks[task];

  if (--self.refcount === 0) {
    //console.log(' ... closing', self.filePath);
    fs.closeSync(self.fd);
    self.fd = null;
  }
};


module.exports = piper;

