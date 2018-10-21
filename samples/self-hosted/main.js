let wordpos = window.wordpos = new WordPOS({
  // preload: true,
  dictPath: '../samples/self-hosted/dict',
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
    let expect = {lately: 1, likely: 1};
    console.log('getAdverbs:', res);
    console.assert(res[0] in expect);  // NOTE: order is NOT gauranteed!
    console.assert(res[1] in expect);
  });

wordpos.lookupAdverb('likely')
  .then(res => {
    console.log('lookupAdverb:', res[0]);
    assertLikely(res[0]);
  });
// wordpos.lookup('likely').then(res, console.log('lookup ===', res))

wordpos.seek('00139421', 'r')
  .then(res => {
    console.log('seek:', res);
    assertLikely(res);
  });

setTimeout(() => console.groupEnd('Likely'), 1000);
