import { memo } from 'react';
import { getBenchmarkStatus, getStatusColor } from '../utils/benchmarks';
import { decodeHtmlEntities, isOutOfStock } from '../utils/csvParser';

function ProductCard({ product, benchmark }) {
  const diff = benchmark !== '' && benchmark !== undefined ? product.price - benchmark : 0;
  const status = getBenchmarkStatus(product.price, benchmark);
  const statusColor = getStatusColor(status);
  const statusText = status === 'above' ? 'Above' : status === 'below' ? 'Below' : 'At';
  
  const stockStatus = isOutOfStock(product.in_stock) ? 'oos' : 'instock';
  const stockColor = stockStatus === 'instock' 
    ? 'bg-green-500/30 text-green-300 border-2 border-green-400' 
    : 'bg-red-500/30 text-red-300 border-2 border-red-400';

  const sizePortion = product.unit ? (product.unit.split(',')[0] || '').trim() : '';

  const safeImg = product.image ? (
    <div className="w-full h-40 rounded-lg mb-3 overflow-hidden bg-gray-800 relative">
      <img
        src={product.image}
        alt={decodeHtmlEntities(product.name)}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        style={{ minHeight: '160px' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="%23111"/><text x="50%" y="50%" fill="%23999" font-size="20" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>';
        }}
      />
    </div>
  ) : (
    <div className="w-full h-40 bg-gray-800 rounded-lg mb-3 flex items-center justify-center text-gray-500">
      No Image
    </div>
  );

  return (
    <div className="card p-4 rounded-xl shadow-xl border border-white/10" style={{ minHeight: '400px' }}>
      {safeImg}
      <h3 className="font-semibold text-lg mb-2 text-white">
        {decodeHtmlEntities(product.name)}
        {sizePortion && <span className="text-gray-400 text-sm"> ({decodeHtmlEntities(sizePortion)})</span>}
      </h3>
      <p className="text-indigo-300 text-xl font-bold">₹{product.price.toFixed(2)}</p>
      {product.original && product.original > 0 && (
        <p className="text-gray-400 text-sm line-through mb-2">₹{product.original.toFixed(2)}</p>
      )}
      <p className="text-sm mb-2 text-gray-300">
        Benchmark: <span className="text-gray-200">
          {benchmark !== '' && benchmark !== undefined ? `₹${benchmark.toFixed(2)}` : '—'}
        </span>
      </p>
      <p className="text-sm mb-3 text-gray-300">
        Diff: <span className={diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-gray-400'}>
          ₹{diff.toFixed(2)}
        </span>
      </p>
      <div className="flex gap-2 mt-2">
        <span className={`status-pill ${statusColor}`}>
          {statusText} Benchmark
        </span>
        <span className={`status-pill ${stockColor}`}>
          {decodeHtmlEntities(product.in_stock || '')}
        </span>
      </div>
    </div>
  );
}

export default memo(ProductCard);



