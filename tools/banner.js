const pkg = require('../package.json');
const wndb = require('wordnet-db');

const copyright = `/*!
Copyright (c) 2012-2020 mooster@42at.com
https://github.com/moos/wordpos (The MIT License)
Princeton University "About WordNet." WordNet (https://wordnet.princeton.edu/). Princeton University. 2010.

  ${pkg.name} v${pkg.version}
  wordnet-db v${wndb.libVersion}
  WordNet DB version ${wndb.version}

*/
`;

module.exports = {
  copyright
};

if (require.main === module) {
  process.stdout.write(copyright);
}
