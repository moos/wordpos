import WordPOS from '../../src/browser';

console.log(__dirname, WordPOS.defaults)

let wordpos = window.wordpos = new WordPOS({
  // preload: true,
  dictPath: './dict',
  profile: true,
  // stopwords: false
});

wordpos.isAdverb('likely').then(res => console.log('likely is adverb:', res));
// wordpos.isAdverb('likely', (res, ...profile) => console.log('likely callback', res, profile));
wordpos.getAdverbs('this is is likely a likely tricky business this is').then(
  res => console.log('getAdverb', res)
);

wordpos.lookupAdverb('likely').then(res => console.log('lookup ===', res))
// wordpos.lookup('likely').then(res, console.log('lookup ===', res))
