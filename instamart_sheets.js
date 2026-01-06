import puppeteer from 'puppeteer';
import fs from 'fs';
import { upsertProducts } from './src/services/productAdminService.js';

function cleanPrice(text) {
  if (!text) return "NA";
  return text.replace(/[^\d]/g, '');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function writeToSupabase(data) {
  try {
    await upsertProducts(data, 'swiggy', 'pepe');
    console.log(`✅ Wrote ${data.length} products to Supabase`);
  } catch (error) {
    console.error("Supabase error:", error.message);
  }
}

async function scrapeCataloguePage(catalogueUrl) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 1200 },
    args: [
      "--disable-blink-features=AutomationControlled",
      '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();

  try {
    console.log("🌐 Opening catalogue page:", catalogueUrl);
    await page.goto(catalogueUrl, { waitUntil: "networkidle2", timeout: 120000 });
    await sleep(8000);

    await page.waitForSelector('[data-testid="item-collection-card-full"]', { timeout: 40000 });
    console.log("✅ Product cards loaded");

    // Scroll to load all products
    console.log("📜 Scrolling to load all items...");
    await page.evaluate(async () => {
      const scroller = document.querySelector('div._2_95H.bottomOffsetPadBottom') ||
        [...document.querySelectorAll("div")].filter(el => el.scrollHeight > el.clientHeight && el.clientHeight > 300)
          .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];

      if (!scroller) return;

      let lastHeight = 0;
      let idleCycles = 0;
      const MAX_IDLE = 8;

      await new Promise(resolve => {
        const interval = setInterval(() => {
          scroller.scrollTop = scroller.scrollHeight;
          if (scroller.scrollHeight === lastHeight) idleCycles++;
          else { idleCycles = 0; lastHeight = scroller.scrollHeight; }

          if (idleCycles >= MAX_IDLE) {
            clearInterval(interval);
            resolve();
          }
        }, 1500);
      });
    });

    await sleep(3000);

    // Extract directly from each card — no hover needed!
    const products = await page.evaluate(() => {
      const clean = t => t ? t.replace(/[^\d]/g, '') : "NA";

      const getByXPath = (root, xpath) => {
        const res = document.evaluate(
          xpath,
          root,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        return res.singleNodeValue;
      };


      const cards = document.querySelectorAll('[data-testid="item-collection-card-full"]');
      console.log(`Found ${cards.length} product cards`);

      const seen = new Set();
      const results = [];

      for (const card of cards) {
        // Name
        const nameEl = card.querySelector('div.sc-gEvEer.iPErou._1lbNR');
        let name = nameEl ? nameEl.innerText.trim() : "NA";
        if (name === "NA" || seen.has(name)) continue;
        seen.add(name);

        /// ================= FINAL, DOM-CORRECT EXTRACTION =================

        // the price/unit block is the NEXT sibling of the card container
        const metaBlock = card.parentElement?.querySelector('div._3dcA8');

        // UNIT
        const unitEl = metaBlock?.querySelector('div._3wq_F');
        const unit = unitEl ? unitEl.innerText.trim() : "NA";

        // SELLING PRICE
        const spEl = metaBlock?.querySelector('div._2enD- div._2jn41');
        const current_price = spEl ? clean(spEl.innerText) : "NA";

        // MRP (second price node if exists)
        let original_price = "NA";
        const priceEls = metaBlock?.querySelectorAll('div._2enD- div._2jn41');
        if (priceEls && priceEls.length > 1) {
          original_price = clean(priceEls[1].innerText);
        }



        // Discount
        let discount = "NA";
        const offerEl = card.querySelector('div.sc-gEvEer.fJqAlq.R-2Yy');
        if (offerEl && offerEl.innerText.trim()) {
          discount = offerEl.innerText.trim().split('\n')[0]; // takes "20% OFF"
        } else if (current_price !== "NA" && original_price !== "NA" && Number(original_price) > Number(current_price)) {
          const pct = Math.round(((Number(original_price) - Number(current_price)) / Number(original_price)) * 100);
          discount = `${pct}% OFF`;
        }

        // Image
        const imgEl = card.querySelector('img._16I1D');
        let image = imgEl && imgEl.src ? imgEl.src : "NA";

        // Stock status
        const soldOutEl = card.querySelector('div._2zIRo._3CyJz');
        const in_stock = soldOutEl && soldOutEl.innerText.toLowerCase().includes('sold out')
          ? "Out of Stock"
          : "In Stock";

        // URL
        const url = card.closest('a')?.href || card.querySelector('a')?.href || "NA";

        results.push({
          name,
          unit,
          current_price,
          original_price,
          discount,
          in_stock,
          image,
          url
        });
      }

      return results;
    });

    console.log(`✅ Successfully extracted ${products.length} unique products`);
    await browser.close();
    return products;

  } catch (err) {
    console.error("❌ Scrape failed:", err.message);
    await browser.close();
    return [];
  }
}

/* -------------------------------------------
  MAIN
------------------------------------------- */
(async () => {
  const CATALOGUE_URL = "https://www.swiggy.com/instamart/collection-listing?collectionId=106463&custom_back=true&brand=Pepe%20Jeans";

  console.log("🚀 Starting Pepe Jeans Instamart Scraper");

  const startTime = Date.now();
  const results = await scrapeCataloguePage(CATALOGUE_URL);

  const endTime = Date.now();
  console.log(`\n⏱️ Done in ${((endTime - startTime) / 1000).toFixed(2)}s`);

  if (results.length === 0) {
    console.log("⚠️ No products extracted — check if location popup blocked loading");
    return;
  }

  const header = ["name", "unit", "current_price", "original_price", "discount", "in_stock", "image"];
  const csv = [
    header.join(","),
    ...results.map(p => header.map(h => `"${(p[h] || "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  fs.writeFileSync("instamart_pepe_jeans_final.csv", csv);
  console.log(`📄 Saved ${results.length} products to instamart_pepe_jeans_final.csv`);

  await writeToSupabase(results);
})();