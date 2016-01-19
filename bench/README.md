## Benchmark

```bash
    cd bench
    node wordpos-bench.js
```

### Version 1.0 Benchmark

The following benchmarks were run on a Win8.1/Core i7/3.5GHz machine on a Seagate 500GB SATA II, 7200 RPM disk.  The corpus was a 512-word text, with stopwords and duplicates removed, resulting in 220 words looked-up. 

#### Pre v0.14 (comparable to Natural)
```
  getPOS : 1 ops/s { iterations: 1, elapsed: 1514 }
  getNouns : 2 ops/s { iterations: 1, elapsed: 409 }
  getVerbs : 2 ops/s { iterations: 1, elapsed: 418 }
  getAdjectives : 3 ops/s { iterations: 1, elapsed: 332 }
  getAdverbs : 4 ops/s { iterations: 1, elapsed: 272 }
  lookup : 1 ops/s { iterations: 1, elapsed: 1981 }
  lookupNoun : 0 ops/s { iterations: 1, elapsed: 2016 }

looked up 220 words
done in 7770 msecs
```

#### v0.1.16 (with fastIndex):
```
  getPOS : 11 ops/s { iterations: 1, elapsed: 90 }
  getNouns : 21 ops/s { iterations: 1, elapsed: 47 }
  getVerbs : 53 ops/s { iterations: 1, elapsed: 19 }
  getAdjectives : 29 ops/s { iterations: 1, elapsed: 34 }
  getAdverbs : 83 ops/s { iterations: 1, elapsed: 12 }
  lookup : 1 ops/s { iterations: 1, elapsed: 720 }
  lookupNoun : 1 ops/s { iterations: 1, elapsed: 676 }

looked up 220 words
done in 2459 msecs
```

#### v1.0:
```
  getPOS : 14 ops/s { iterations: 1, elapsed: 73 }
  getNouns : 26 ops/s { iterations: 1, elapsed: 38 }
  getVerbs : 42 ops/s { iterations: 1, elapsed: 24 }
  getAdjectives : 24 ops/s { iterations: 1, elapsed: 42 }
  getAdverbs : 26 ops/s { iterations: 1, elapsed: 38 }
  lookup : 6 ops/s { iterations: 1, elapsed: 159 }
  lookupNoun : 13 ops/s { iterations: 1, elapsed: 77 }

looked up 221 words
done in 1274 msecs
```

These are **3.5x** better compared to v0.1.16 and **15x** better compared to pre v0.14, overall.  Functions that read the data files see much improved performance: `lookup` about **13x** and `lookupNoun` **26x** compared to pre v0.14. 


### Old benchmark

512-word corpus (< v0.1.4, comparable to Natural) :
```
  getPOS : 0 ops/s { iterations: 1, elapsed: 9039 }
  getNouns : 0 ops/s { iterations: 1, elapsed: 2347 }
  getVerbs : 0 ops/s { iterations: 1, elapsed: 2434 }
  getAdjectives : 1 ops/s { iterations: 1, elapsed: 1698 }
  getAdverbs : 0 ops/s { iterations: 1, elapsed: 2698 }
done in 20359 msecs
```

512-word corpus (as of v0.1.4, with fastIndex) :
```
  getPOS : 18 ops/s { iterations: 1, elapsed: 57 }
  getNouns : 48 ops/s { iterations: 1, elapsed: 21 }
  getVerbs : 125 ops/s { iterations: 1, elapsed: 8 }
  getAdjectives : 111 ops/s { iterations: 1, elapsed: 9 }
  getAdverbs : 143 ops/s { iterations: 1, elapsed: 7 }
done in 1375 msecs
```

220 words are looked-up (less stopwords and duplicates) on a win7/64-bit/dual-core/3GHz.  getPOS() is slowest as it searches through all four index files.

