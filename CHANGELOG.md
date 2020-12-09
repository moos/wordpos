

2.1.0
  - Fix CLI script when used without specific POS (#41)
  - :boom: Stopwords are now case-insensitive, i.e., "The", "And", "Him", etc. are all filtered out.
    
2.0.0
  - Support for running wordpos in the **browser** (no breaking change for node environment)
  - Dropped support for node 4.x.

1.2.0 (tagged v1.2.0)
 - Fix `new Buffer()` deprecation warning.
 - Fix npm audit vulnerabilities

1.1.6
 - Fix #25 rand().then with no args

1.1.5
 - rollback 1.1.4 changes.  Fix is made in [wordnet-db](https://github.com/moos/wordnet-db).

1.1.4
 - temporary fix for #19 issue with npm@5

1.1.2
 - Fix DeprecationWarning for node 7.x (1.1.1)
 - Fix occasional error for large offsets during seek

1.1.0
 - added seek() method
 - added lexName property

1.0.1
 - Removed npm dependency on Natural.  Certain modules are included in /lib.
 - Add support for ES6 Promises.
 - Improved data file reads for up to **5x** performance increase compared to previous version.
 - Tests are now [mocha](https://mochajs.org/)-based with [chai](http://chaijs.com/) assert interface.

0.1.16
 - Changed dependency to wordnet-db (renamed from WNdb)

0.1.15
- Added `syn` (synonym) and `exp` (example) CLI commands.
- Fixed `rand` CLI command when no start word given.
- Removed -N, --num CLI option.  Use `wordpos rand [N]` to get N random numbers.
- Changed CLI option -s to -w (include stopwords).

0.1.13
- Fix crlf issue for command-line script

0.1.12
- fix stopwords not getting excluded when running with CLI
- added 'stopwords' CLI *command* to show list of stopwords
- CLI *option* --stopword now renamed to --withStopwords

0.1.10
- rand functionality added

0.1.6
- added command line tool

0.1.4
- added fast index
