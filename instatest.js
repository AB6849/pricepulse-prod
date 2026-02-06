import puppeteer from 'puppeteer';
import fs from 'fs';
import { upsertProducts } from './src/services/productAdminService.js';
import { resolveInstamartFromCatalog } from './src/services/resolveInstamartFromCatalog.js';

const normalizeText = (s) =>
  s?.toLowerCase().replace(/\s+/g, ' ').trim() || null;

const toNumber = (s) =>
  s ? Number(s.replace(/[^\d]/g, '')) : null;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// async function writeToSupabase(scrapedProducts) {
//   const resolved = await resolveInstamartFromCatalog(scrapedProducts, 'pepe');
//   await upsertProducts(resolved, 'instamart', 'pepe');
//   console.log(`✅ Wrote ${resolved.length}/${scrapedProducts.length} products`);
// }

async function scrapeCataloguePage(url) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 1200 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
    await sleep(8000);

    await page.waitForSelector('[data-testid="item-collection-card-full"]');

    // scroll
    await page.evaluate(async () => {
      const scroller =
        document.querySelector('div._2_95H.bottomOffsetPadBottom') ||
        [...document.querySelectorAll('div')]
          .filter(d => d.scrollHeight > d.clientHeight && d.clientHeight > 300)
          .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];

      if (!scroller) return;

      let last = 0, idle = 0;
      while (idle < 8) {
        scroller.scrollTop = scroller.scrollHeight;
        await new Promise(r => setTimeout(r, 1500));
        if (scroller.scrollHeight === last) idle++;
        else { idle = 0; last = scroller.scrollHeight; }
      }
    });

    const products = await page.evaluate(() => {
      const clean = s => s ? s.replace(/[^\d]/g, '') : null;
      const normalize = s => s?.toLowerCase().replace(/\s+/g, ' ').trim() || null;

      return [...document.querySelectorAll('[data-testid="item-collection-card-full"]')]
        .map(card => {
          const name = normalize(
            card.querySelector('div.sc-gEvEer.iPErou._1lbNR')?.innerText
          );

          if (!name) return null;

          const meta = card.parentElement?.querySelector('div._3dcA8');

          const unit = normalize(meta?.querySelector('div._3wq_F')?.innerText);

          const prices = meta?.querySelectorAll('div._2enD- div._2jn41') || [];
          const price = prices[0] ? Number(clean(prices[0].innerText)) : null;
          const original_price = prices[1] ? Number(clean(prices[1].innerText)) : null;

          const image = card.querySelector('img._16I1D')?.src || null;

          const soldOut = card.querySelector('div._2zIRo._3CyJz');
          const in_stock =
            soldOut && soldOut.innerText.toLowerCase().includes('sold out')
              ? 'Out of Stock'
              : 'In Stock';

          const url =
            card.closest('a')?.href ||
            card.querySelector('a')?.href ||
            null;

          return {
            name,
            unit,
            price,
            original_price,
            in_stock,
            image,
            url
          };
        })
        .filter(Boolean);
    });

    await browser.close();
    return products;

  } catch (err) {
    console.error('❌ Scrape failed:', err.message);
    await browser.close();
    return [];
  }
}

/* ---------------- MAIN ---------------- */

(async () => {
  const URL =
    'https://www.swiggy.com/instamart/collection-listing?collectionId=106463&custom_back=true&brand=Pepe%20Jeans';

  const products = await scrapeCataloguePage(URL);

  if (!products.length) return;

  fs.writeFileSync(
    'instamart_pepe_jeans.csv',
    [
      ['name','unit','price','original_price','in_stock','image','url'].join(','),
      ...products.map(p =>
        ['name','unit','price','original_price','in_stock','image','url']
          .map(k => `"${(p[k] ?? '').toString().replace(/"/g, '""')}"`)
          .join(',')
      )
    ].join('\n')
  );

//   await writeToSupabase(products);
})();
