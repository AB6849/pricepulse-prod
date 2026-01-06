export function parseCSV(csv) {
  return csv.split(/\r?\n/).filter(Boolean).map(line => {
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i+1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return cols.map(c => c.replace(/^"|"$/g, '').trim());
  });
}

export function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function decodeHtmlEntities(str) {
  if (!str) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

/**
 * Determines if a product is out of stock based on stock status string
 * @param {string} stockStatus - The stock status string from the data
 * @returns {boolean} - true if out of stock, false if in stock
 */
export function isOutOfStock(stockStatus) {
  if (!stockStatus) return false;
  const normalized = stockStatus.toLowerCase().trim();
  
  // Check for various OOS indicators
  const oosIndicators = [
    'out of stock',
    'out-of-stock',
    'outofstock',
    'oos',
    'unavailable',
    'not available',
    'sold out',
    'stock out'
  ];
  
  // Check if the string contains any OOS indicator
  return oosIndicators.some(indicator => normalized.includes(indicator));
}



