var
    WordPOS       = require('./src/wordpos'),
    wordpos       = new WordPOS({profile: true}),
	getAllPOS = wordpos.getPOS
	;


console.log(1111,
  wordpos.lookup('foot')
  //wordpos.getPOS('was doing the work the ashtray closer Also known as inject and foldl, reduce boils down a list of values into a single value', console.log
  .then(function(result){
    console.log(' xxx - ', result)
  })
  .catch(function(result){
    console.log(' error xxx - ', result)
  }));

//wordpos.rand({count: 3},console.log)

return;


//getAllPOS('se', console.log)
wordpos.getPOS('se', console.log)




 a=wordpos.getPOS('se', function(res) {
    console.log(1, res)
    wordpos.getPOS('sea hey who work', function(res) {
      console.log(2, res)
      wordpos.getPOS('sear done work ', function(res) {
        console.log(3, res)
        console.log('all done');
      });
    });
  });

  console.log(a)