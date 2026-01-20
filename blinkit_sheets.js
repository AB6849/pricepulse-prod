import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { upsertProducts } from "./src/services/productAdminService.js";

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================================================
  LOCATION SETTER (DOM SAFE)
========================================================= */
async function setLocation(page, pincode) {
  console.log(`📍 Setting location to ${pincode}`);

  try {
    const PIN_INPUT =
      "#app > div > div > div.containers__HeaderContainer-sc-1t9i1pe-0.hzuVdo > " +
      "header > div.LocationDropDown__LocationModalContainer-sc-bx29pc-0.DeWG > " +
      "div.location__shake-container-v1.animated > div > div > div > div > div > " +
      "div:nth-child(2) > div:nth-child(2) > div > div:nth-child(3) > " +
      "div > div > div > input";

    const FIRST_RESULT =
      "#app > div > div > div.containers__HeaderContainer-sc-1t9i1pe-0.hzuVdo > " +
      "header > div.LocationDropDown__LocationModalContainer-sc-bx29pc-0.DeWG > " +
      "div.location__shake-container-v1.animated > div > div > " +
      "div.location-footer > div > div > div:nth-child(1) > " +
      "div.LocationSearchList__LocationDetailContainer-sc-93rfr7-1.fjUUbA";

    await page.waitForSelector(PIN_INPUT, { timeout: 30000 });

    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error("PIN input not found");
      el.focus();
      el.value = "";
    }, PIN_INPUT);

    await sleep(300);
    await page.keyboard.type(pincode, { delay: 120 });

    await page.waitForSelector(FIRST_RESULT, { timeout: 30000 });

    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error("Location result not found");
      el.click();
    }, FIRST_RESULT);

    await sleep(4000);
    console.log("✅ Location set successfully");
    return true;
  } catch (err) {
    console.error("❌ Location set failed:", err.message);
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
    args: ["--start-maximized", "--no-sandbox"],
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

  await page.reload({ waitUntil: "networkidle2", timeout: 60000 });
  await sleep(2000);

  /* =========================================================
     SCROLL + DOM EXTRACT
  ========================================================= */
  const products = await page.evaluate(
    async (MAX_SCROLLS, SCROLL_DELAY) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      const normalizeText = (s) =>
        s?.toLowerCase().replace(/\s+/g, " ").trim() || null;

      const toNumber = (s) =>
        s ? Number(s.replace(/[₹,]/g, "")) : null;

      const scrollContainer = [...document.querySelectorAll("div")]
        .filter(
          (el) =>
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
          behavior: "smooth",
        });
        await sleep(SCROLL_DELAY);
        if (scrollContainer.scrollHeight === lastHeight) break;
        lastHeight = scrollContainer.scrollHeight;
      }

      const cards = [
        ...scrollContainer.querySelectorAll('[role="button"][id]'),
      ];

      const out = [];

      for (const card of cards) {
        const text = card.innerText.toLowerCase();
        const product_id = card.id;

        const name =
          card.querySelector(".tw-text-300, .tw-font-semibold")
            ?.innerText?.trim();

        if (!name) continue;

        const slug = name
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "-");

        out.push({
          product_id: String(product_id),
          name: normalizeText(name),
          unit: normalizeText(
            card.querySelector(".tw-text-200")?.innerText
          ),
          price: toNumber(
            card.querySelector(".tw-font-semibold.tw-text-200")
              ?.innerText
          ),
          original_price: toNumber(
            card.querySelector(".tw-line-through span")
              ?.innerText
          ),
          in_stock: text.includes("out of stock")
            ? "Out of Stock"
            : "In Stock",
          image: card.querySelector("img")?.src || null,
          url: `https://blinkit.com/prn/${slug}/prid/${product_id}`,
        });
      }

      return out;
    },
    MAX_SCROLLS,
    SCROLL_DELAY
  );

  console.log(`✅ Extracted ${products.length} products`);

  /* =========================================================
     CSV BACKUP
  ========================================================= */
  const headers = [
    "product_id",
    "name",
    "unit",
    "price",
    "original_price",
    "in_stock",
    "image",
    "url",
  ];

  const rows = [headers.join(",")];

  for (const p of products) {
    rows.push(
      headers
        .map(
          (h) =>
            `"${(p[h] ?? "").toString().replace(/"/g, '""')}"`
        )
        .join(",")
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
    console.log(
      `✅ Wrote ${products.length} products to Supabase for brand: ${BRAND}, platform: ${PLATFORM}`
    );
  } catch (error) {
    console.error("❌ Supabase error:", error.message);
    throw error;
  }

  await browser.close();
}

/* =========================================================
  RUN
========================================================= */
(async () => {
  try {
    await scrapePLP();
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
})();
