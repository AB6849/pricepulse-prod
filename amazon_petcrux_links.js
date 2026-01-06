import puppeteer from "puppeteer";
import fs from "fs";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const MAX_PAGES = 20;
const BASE = "https://www.amazon.in/s?k=Petcrux";

async function run() {

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120 Safari/537.36"
  );

  const links = new Set();

  for (let i = 1; i <= MAX_PAGES; i++) {

    const url = `${BASE}&page=${i}`;
    console.log("🔍 Page:", i, url);

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(3000 + Math.random() * 2000);

    if (page.url().includes("captcha")) {
      console.log("🚨 CAPTCHA detected, solve & press Enter");
      await new Promise(res => process.stdin.once("data", res));
    }

    const pageLinks = await page.evaluate(() => {

      const results = [];

      document.querySelectorAll("a[href*='/dp/']").forEach(a => {

        // Find closest product container
        const card = a.closest("div");

        const text = card?.innerText?.toLowerCase() || "";

        // ✅ Strict filter
        if (!text.includes("petcrux")) return;

        const clean = a.href.split("?")[0];
        results.push(clean);
      });

      return Array.from(new Set(results));
    });

    console.log("✅ Petcrux links found:", pageLinks.length);

    if (pageLinks.length === 0) break;

    pageLinks.forEach(l => links.add(l));
  }

  fs.writeFileSync("petcrux_amazon_links.txt", [...links].join("\n"));

  console.log("\n✅ FINAL PETCRUX PRODUCTS:", links.size);
  [...links].forEach(x => console.log(x));

  await browser.close();
}

run();