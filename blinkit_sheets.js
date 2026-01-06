import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { upsertProducts } from './src/services/productAdminService.js';

puppeteer.use(StealthPlugin());

/* =========================================================
  CONFIG
========================================================= */
const PLP_URL =
  "https://blinkit.com/dc/?collection_filters=W3siYnJhbmRfaWQiOlsxNjIyOF19XQ%3D%3D&collection_name=Pepe+Jeans+Innerfashion&boost_collection_filters=%5B%7B%22filters%22%3A+%5B%7B%22type%22%3A+%22leaf_cat_id%22%2C+%22values%22%3A+%5B%225344%22%5D%7D%5D%7D%5D";

const BRAND = "pepe";
const PLATFORM = "blinkit";
const PINCODE = "560102";

const MAX_SCROLLS = 10;
const SCROLL_DELAY = 1200;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* =========================================================
  LOCATION SETTER (DOM SAFE)
========================================================= */
async function setLocation(page, pincode) {
  console.log(`📍 Setting location to ${pincode}`);

  try {
    // 1️⃣ Open location modal
    const LOCATION_BTN =
      "#app header [class*='LocationBar__ArrowContainer']";

    await page.waitForSelector(LOCATION_BTN, {
      visible: true,
      timeout: 20000
    });

    await page.click(LOCATION_BTN);
    await sleep(2000);


    // 2️⃣ Pincode input (your exact selector)
    const PIN_INPUT =
      "#app > div > div > div.containers__HeaderContainer-sc-1t9i1pe-0.jNcsdt > " +
      "header > div.LocationDropDown__LocationModalContainer-sc-bx29pc-0.hxA-Dsy > " +
      "div.location__shake-container-v1.animated > div > div > div > div > div > " +
      "div:nth-child(2) > div:nth-child(2) > div > div:nth-child(3) > " +
      "div > div > div > input";

    // 🔑 wait for input to be visible & attached
    await page.waitForSelector(PIN_INPUT, {
      visible: true,
      timeout: 20000
    });

    // 🔑 Click via Puppeteer (not evaluate)
    await page.click(PIN_INPUT, { clickCount: 3 });
    await sleep(500);

    // 🔑 Clear using keyboard
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");

    await sleep(300);

    // 🔑 Type slowly
    await page.type(PIN_INPUT, pincode, { delay: 120 });
    await sleep(2500);


    // 3️⃣ Select first suggestion
    const FIRST_RESULT =
      "#app header [class*='LocationSearchList__LocationDetailContainer']";


    await page.waitForSelector(FIRST_RESULT, {
      visible: true,
      timeout: 20000
    });


    await page.click(FIRST_RESULT);
    await sleep(4000);


    console.log("✅ Location set successfully");
    return true;
  } catch (err) {
    console.error("❌ Location set failed:", err);
    return false;
  }
}

/* =========================================================
  MAIN SCRAPER
========================================================= */
async function scrapePLP() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--start-maximized", "--no-sandbox"]
  });


  const page = await browser.newPage();


  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/120.0.0.0 Safari/537.36"
  );


  console.log("🔗 Opening PLP:", PLP_URL);
  await page.goto(PLP_URL, { waitUntil: "networkidle2", timeout: 60000 });


  await sleep(2000);


  await setLocation(page, PINCODE);


  // Reload to refresh inventory
  await page.reload({ waitUntil: "networkidle2", timeout: 60000 });
  await sleep(2000);


  /* =========================================================
     SCROLL + DOM EXTRACT
  ========================================================= */
  const products = await page.evaluate(
    async (MAX_SCROLLS, SCROLL_DELAY) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));


      const scrollContainer = [...document.querySelectorAll("div")]
        .filter(el =>
          el.scrollHeight > el.clientHeight &&
          el.clientHeight > 300 &&
          el.querySelector('[role="button"][id]')
        )
        .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];


      if (!scrollContainer) return [];


      let lastHeight = 0;
      for (let i = 0; i < MAX_SCROLLS; i++) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth"
        });
        await sleep(SCROLL_DELAY);
        if (scrollContainer.scrollHeight === lastHeight) break;
        lastHeight = scrollContainer.scrollHeight;
      }


      const cards = [...scrollContainer.querySelectorAll('[role="button"][id]')];
      const out = [];


      for (const card of cards) {
        const text = card.innerText.toLowerCase();
        const product_id = card.id;

        const name =
          card.querySelector(".tw-text-300, .tw-font-semibold")
            ?.innerText?.trim();
        if (!name) continue;

        // 🔑 slug from name
        const slug = name
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "-");

        out.push({
          product_id,
          asin: product_id.replace(/\D/g, ""), // ✅ numeric only for Supabase
          name,
          unit: card.querySelector(".tw-text-200")?.innerText?.trim() || "NA",
          current_price:
            card.querySelector(".tw-font-semibold.tw-text-200")
              ?.innerText?.replace(/[₹,]/g, "") || null,
          original_price:
            card.querySelector(".tw-line-through span")
              ?.innerText?.replace(/[₹,]/g, "") || null,
          in_stock: text.includes("out of stock")
            ? "Out of Stock"
            : "In Stock",
          image: card.querySelector("img")?.src || "NA",
          url: `https://blinkit.com/prn/${slug}/prid/${product_id}`
        });
      }

      return out;
    },
    MAX_SCROLLS,
    SCROLL_DELAY
  );


  console.log(`✅ Extracted ${products.length} products`);


  /* =========================================================
     CSV BACKUP (OPTIONAL)
  ========================================================= */
  const headers = Object.keys(products[0] || {});
  const rows = [headers.join(",")];


  for (const p of products) {
    rows.push(
      headers.map(h => `"${(p[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    );
  }


  const csvName = `${BRAND}_${PLATFORM}_pepe_plp.csv`;
  fs.writeFileSync(csvName, rows.join("\n"));


  console.log(`📁 CSV backup written: ${csvName}`);


  /* =========================================================
     WRITE TO SUPABASE
  ========================================================= */
  try {
    await upsertProducts(products, PLATFORM, BRAND);
    console.log(`✅ Wrote ${products.length} products to Supabase for brand: ${BRAND}, platform: ${PLATFORM}`);
  } catch (error) {
    console.error("❌ Supabase error:", error.message);
    if (error.details) {
      console.error("Error details:", error.details);
    }
    console.error("\n⚠️  Note: Products were saved to CSV backup file.");
    console.error("Please check your network connection and Supabase credentials in .env file.");
    throw error;
  }


  await browser.close();
}


// Wrap in async IIFE to handle errors properly
(async () => {
  try {
    await scrapePLP();
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
    process.exit(1);
  }
})();



