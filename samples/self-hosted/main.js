import WordPOS from '../../src/wordpos';

console.log(__dirname, WordPOS.defaults)

let wordpos = window.wordpos = new WordPOS({
  // preload: true,
  dictPath: './dict',
  profile: true,
  // stopwords: false
});

let assertLikely = (r) => {
  console.assert(r.def === 'with considerable certainty');
  console.assert(r.pos === 'r');
  console.assert(r.synsetOffset === '00139421');
};

console.group('Likely');
wordpos.isAdverb('likely').then(res => console.assert(res));
wordpos.isAdverb('likely', (res, ...profile) => console.log('callback with profile', res, profile));

wordpos.getAdverbs('this is is lately a likely tricky business this is')
  .then(res => {
    console.log('getAdverbs:', res);
    console.assert(res[0] === 'lately');
    console.assert(res[1] === 'likely');
  });

wordpos.lookupAdverb('likely')
  .then(res => {
    console.log('lookupAdverb:', res);
    assertLikely(res[0]);

  });
// wordpos.lookup('likely').then(res, console.log('lookup ===', res))

wordpos.seek('00139421', 'r')
  .then(res => {
    console.log('seek:', res);
    assertLikely(res);
  });

// console.groupEnd('Likely');
