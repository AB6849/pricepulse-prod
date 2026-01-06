export function processBenchmarks(data, platformIndex = 1) {
  const b = {};
  data.slice(1).forEach(r => {
    const key = (r[0] || '').toLowerCase().trim();
    if (!key) return;
    const val = parseFloat(r[platformIndex]);
    b[key] = Number.isFinite(val) ? val : '';
  });
  return b;
}

export function fuzzyBenchmark(name, benchmarks) {
  if (!name || !benchmarks) return '';
  const lower = name.toLowerCase().trim();
  if (benchmarks[lower] !== undefined) return benchmarks[lower];
  
  const pWords = lower.split(/\s+/).filter(Boolean);
  for (const k of Object.keys(benchmarks)) {
    if (!benchmarks[k]) continue;
    const sWords = k.split(/\s+/).filter(Boolean);
    let matches = 0;
    pWords.forEach(w => {
      if (sWords.some(s => s.includes(w) || w.includes(s))) matches++;
    });
    if (matches >= 2) return benchmarks[k];
  }
  return '';
}

export function getBenchmarkStatus(price, benchmark) {
  if (benchmark === '' || benchmark === undefined) return 'at';
  const diff = price - benchmark;
  return diff > 0 ? 'above' : diff < 0 ? 'below' : 'at';
}

export function getStatusColor(status) {
  switch (status) {
    case 'above':
      return 'bg-red-500/20 text-red-400';
    case 'below':
      return 'bg-green-500/20 text-green-400';
    case 'at':
      return 'bg-yellow-500/30 text-yellow-300 font-bold border-2 border-yellow-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}



