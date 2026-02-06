import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import { upsertProducts } from './src/services/productAdminService.js';

puppeteer.use(StealthPlugin());

const LINKS = [
  "https://www.amazon.in/PetCrux-Friendly-Lavender-Essential-Multiple/dp/B07MJC2KYJ/ref=sr_1_5",
  "https://www.amazon.in/PetCruxTM-Exclusive-Scoopable-Bentonite-Litter/dp/B07NZVG8SC/ref=sr_1_6",
  "https://www.amazon.in/Petcrux-Exclusive-Scoopable-Equivalent-Pack/dp/B08XM1QHF1/ref=sr_1_7",
  "https://www.amazon.in/Petcrux-Exclusive-Scoopable-Bentonite-Equivalent/dp/B08VGKS3TG/ref=sr_1_8",
  "https://www.amazon.in/Petcrux-Adult-Chicken-Complete-Balanced/dp/B0DHL887MF/ref=sr_1_9",
  "https://www.amazon.in/PetCrux-Friendly-Lavender-Essential-Multiple/dp/B07MQ65HG5/ref=sr_1_10",
  "https://www.amazon.in/Litter-Unscented-Fragrance-Absorbent-Eco-Friendly/dp/B09X7CZ83B/ref=sr_1_11",
  "https://www.amazon.in/Petcrux-Exclusive-Scoopable-Bentonite-Equivalent/dp/B08XM8PQ9N/ref=sr_1_12",
  "https://www.amazon.in/Litter-Unscented-Fragrance-Absorbent-Eco-Friendly/dp/B09X7G1SMN/ref=sr_1_13",
  "https://www.amazon.in/Bentonite-Lavender-Superior-Scoopable-Multiple/dp/B0C2PZQ5RT/ref=sr_1_14",
  "https://www.amazon.in/Bentonite-Trial-Travel-Pack-Eco-Friendly/dp/B08V8JN3DW/ref=sr_1_15",
  "https://www.amazon.in/Biodegradable-Corn-Absorbent-Eco-Friendly-Flushable/dp/B08JM77FBZ/ref=sr_1_16",
  "https://www.amazon.in/Exclusive-Bentonite-Litter-Absorbent-Eco-Friendly/dp/B082Z5RX5S/ref=sr_1_17",
  "https://www.amazon.in/PetCrux-Absorbent-Biodegradable-Superior-Multiple/dp/B07NS31G48/ref=sr_1_18",
  "https://www.amazon.in/Exclusive-Lavender-Superior-Scoopable-Multiple/dp/B0F1XZBBBV/ref=sr_1_19",
  "https://www.amazon.in/PetCrux-Absorbent-Biodegradable-Superior-Multiple/dp/B07NS44Q6C/ref=sr_1_20",
  "https://www.amazon.in/Petcrux-Puppy-Chicken-Complete-Nutrition/dp/B0DHL7XBNK/ref=sr_1_25",
  "https://www.amazon.in/PetCruxTM-Exclusive-Scoopable-Activated-Carbon/dp/B07RBCNW7F/ref=sr_1_26",
  "https://www.amazon.in/Litter-Bentonite-Friendly-Essential-Scoopable/dp/B0CJJ7C5TF/ref=sr_1_27",
  "https://www.amazon.in/PetCrux-Fragrance-Bentonite-Superior-Scoopable/dp/B0CTHRYZ84/ref=sr_1_28",
  "https://www.amazon.in/Activated-Litter-Bentonite-Unscented-Eco-Friendly/dp/B07NRSZC6V/ref=sr_1_29",
  "https://www.amazon.in/Petcrux-Friend-Fresh-Silica-Litter/dp/B07ZZD96FL/ref=sr_1_30",
  "https://www.amazon.in/Petcrux-Bird-Food-Mixed-Seeds/dp/B0D8J6WVTZ/ref=sr_1_31",
  "https://www.amazon.in/Petcrux-Friend-Fresh-Silica-Litter/dp/B07ZZ81GSP/ref=sr_1_32",
  "https://www.amazon.in/Petcrux-Exclusive-Organic-Litter-Lavender/dp/B085HY2T1N/ref=sr_1_33",
  "https://www.amazon.in/Petcrux-Exclusive-Scoopable-Litter-Scooper/dp/B08NJWMFKL/ref=sr_1_34",
  "https://www.amazon.in/Petcrux-Venus-Aquarium-Filter-Oxygen/dp/B0D8JMCHXG/ref=sr_1_35",
  "https://www.amazon.in/Petcrux-Cleaning-Slicker-Grooming-Shedding/dp/B0D9BQCGNJ/ref=sr_1_36",
  "https://www.amazon.in/Petcrux-Chicken-Apple-Beetroot-Treats/dp/B0CZRW2P2X/ref=sr_1_37",
  "https://www.amazon.in/Petcrux-Mini-Pellet-Complete-Nutrition/dp/B0CHWFP72X/ref=sr_1_38",
  "https://www.amazon.in/Petcrux-Exclusive-Scoopable-Starter-Bentonite/dp/B08NK2B34C/ref=sr_1_39",
  "https://www.amazon.in/Petcrux-Diagnosing-Implants-Eco-Friendly-bentonite/dp/B09LSB87GS/ref=sr_1_40",
  "https://www.amazon.in/Petcrux-Chicken-Parsley-Mint-Treats/dp/B0D4KFRCCB/ref=sr_1_41",
  "https://www.amazon.in/Petcrux-Flushable-Clumping-Biodegradable-Tracking/dp/B0FXXG5N4Y/ref=sr_1_42",
  "https://www.amazon.in/Petcrux-Flushable-Clumping-Biodegradable-Tracking/dp/B0FXXDSCTB/ref=sr_1_43",
  "https://www.amazon.in/Petcrux-Mutton-Pumpkin-Foods-Treats/dp/B0CZRYLF13/ref=sr_1_44",
  "https://www.amazon.in/PetCrux-Litter-Natural-Bentonite-Lavender/dp/B0FXXG536G/ref=sr_1_45",
  "https://www.amazon.in/Petcrux-Exclusive-Scoopable-Scooper-Multicolor/dp/B08NK264RY/ref=sr_1_46",
  "https://www.amazon.in/PetCrux-Exclusive-Cat-Litter-Tray/dp/B084DKGQTT/ref=sr_1_47",
  "https://www.amazon.in/Petcrux-Waterproof-Material-Durable-Washable/dp/B0D98GGQXX/ref=sr_1_48",
  "https://www.amazon.in/Petcrux-Chicken-Liver-Turmeric-Treats/dp/B0CZRXC358/ref=sr_1_50",
  "https://www.amazon.in/Petcrux-Adult-Chicken-Complete-Balanced/dp/B0FXXJ8KWL/ref=sr_1_51",
  "https://www.amazon.in/Petcrux-Oatmeal-Dog-Shampoo-200ml/dp/B0FBRW5FJT/ref=sr_1_52",
  "https://www.amazon.in/PetCrux-Complete-Earthy-Natural-Bentonite/dp/B0F38G2R86/ref=sr_1_53",
  "https://www.amazon.in/PetCrux-Complete-Unscented-Bentonite-Ingredients/dp/B0F3CQSK1Y/ref=sr_1_54",
  "https://www.amazon.in/PetCrux-Complete-Lavender-Essential-Bentonite/dp/B0F39L9C9W/ref=sr_1_55",
  "https://www.amazon.in/PetCrux-Litter-Natural-Bentonite-Breeds/dp/B0F31FSJ7Q/ref=sr_1_56",
  "https://www.amazon.in/PetCrux-Complete-Natural-Bentonite-Scented/dp/B0F38DL27V/ref=sr_1_53",
  "https://www.amazon.in/PetCrux-Lavender-Litter-Natural-Bentonite/dp/B0F31C9H6X/ref=sr_1_54",
  "https://www.amazon.in/Petcrux-Canaries-Waxbills-Lovebirds-Cockatiels/dp/B08Z8D8T61/ref=sr_1_55",
  "https://www.amazon.in/PetCrux-Essential-Natural-Bentonite-Scented/dp/B0F38H3YPN/ref=sr_1_56",
  "https://www.amazon.in/PetCrux-Friendly-Lavender-Essential-Multiple/dp/B0FN5WV5Y2/ref=sr_1_57",
  "https://www.amazon.in/Petcrux-Premium-Pellet-Turtle-Contains/dp/B0CHWDB49D/ref=sr_1_58",
  "https://www.amazon.in/PetCrux-Essential-Unscented-Bentonite-Ingredients/dp/B0F393VN6W/ref=sr_1_59",
  "https://www.amazon.in/Bentonite-Lavender-Superior-Scoopable-Multiple/dp/B0FXXDLJHP/ref=sr_1_60",
  "https://www.amazon.in/Petcrux-Steam-Steamy-Steaming-Grooming/dp/B0D9BPYZ5W/ref=sr_1_61",
  "https://www.amazon.in/Petcrux-Aquarium-Air-Hydroponic-Systems/dp/B0D8BP54TS/ref=sr_1_62",
  "https://www.amazon.in/Bentonite-Lavender-Superior-Scoopable-Multiple/dp/B0FXXFVSSD/ref=sr_1_63",
  "https://www.amazon.in/PetCrux-Essentials-Natural-Bentonite-Scooper/dp/B0F38GSBKS/ref=sr_1_64",
  "https://www.amazon.in/Petcrux-Scratching-Corrugated-Cardboard-Reversible/dp/B0CBPQLNL8/ref=sr_1_65",
  "https://www.amazon.in/PetCrux-Earthy-Litter-Natural-Bentonite/dp/B0F31FQW7N/ref=sr_1_66",
  "https://www.amazon.in/Petcrux-Premium-Scooper-Strength-Material/dp/B0CRB53CQ9/ref=sr_1_67",
  "https://www.amazon.in/Petcrux-Premium-Pellet-Turtle-Contains/dp/B0CHWCDR6Y/ref=sr_1_68",
  "https://www.amazon.in/Petcrux-Multicolor-Glass-Aquarium-Fluorescent/dp/B0D8BMCD2V/ref=sr_1_73",
  "https://www.amazon.in/Litter-Biodegradable-Absorbent-Eco-Friendly-Flushable/dp/B08JM791Q8/ref=sr_1_74",
  "https://www.amazon.in/Petcrux-Aquarium-Changer-Siphon-Pump/dp/B0D8BJ3VNW/ref=sr_1_75",
  "https://www.amazon.in/Petcrux-Bird-Feeder-Holding-Green/dp/B0CQFH66BB/ref=sr_1_76",
  "https://www.amazon.in/Petcrux-Transparent-Backpack-Breathable-Carriers/dp/B09K5MDBLP/ref=sr_1_77",
  "https://www.amazon.in/Petcrux-Plastic-Biodegradable-Unscented-Outdoor/dp/B0CR6JCXMS/ref=sr_1_78",
  "https://www.amazon.in/Bentonite-Lavender-Superior-Scoopable-Multiple/dp/B0FXXJC3WD/ref=sr_1_79",
  "https://www.amazon.in/Petcrux-Shovel-Dispenser-Multi-Color/dp/B08NYM9BKC/ref=sr_1_80",
  "https://www.amazon.in/Petcrux-Shovel-Dispenser-Multi-Color/dp/B08NYFJYW7/ref=sr_1_81",
  "https://www.amazon.in/Petcrux-Nutritious-Delicious-Turmeric-Ingredients/dp/B0CZRX81YP/ref=sr_1_82",
  "https://www.amazon.in/Petcrux-Starter-Hanging-Sparrow-Balcony/dp/B0CQG3WQ3F/ref=sr_1_83",
  "https://www.amazon.in/Petcrux-Happy-Circle-Teasing-Stick/dp/B0D8J5ZRKX/ref=sr_1_84",
  "https://www.amazon.in/PetCrux-Essential-Lavender-Bentonite-Scooper/dp/B0F39CNMF6/ref=sr_1_85",
  "https://www.amazon.in/PetCrux-Litter-Natural-Bentonite-Lavender/dp/B0FXXGR42W/ref=sr_1_86",
  "https://www.amazon.in/Petcrux-Canaries-Waxbills-Lovebirds-Cockatiels/dp/B0CRR8PNX7/ref=sr_1_87",
  "https://www.amazon.in/Petcrux-Sunflower-Lovebirds-Cockatiels-Cockatoo/dp/B09Z6YHXLF/ref=sr_1_88",
  "https://www.amazon.in/Petcrux-Flushable-Clumping-Biodegradable-Tracking/dp/B0FXXH98TL/ref=sr_1_89",
  "https://www.amazon.in/Petcrux-Flushable-Clumping-Biodegradable-Tracking/dp/B0FXXDWDJ9/ref=sr_1_90",
  "https://www.amazon.in/PetCrux-Natural-Bentonite-Absorbent-Eco-Friendly/dp/B0FXXG9FNJ/ref=sr_1_91",
  "https://www.amazon.in/Petcrux-Medium-Bird-Feeder-Green/dp/B0CQG31BR8/ref=sr_1_92",
  "https://www.amazon.in/Petcrux-Flushable-Clumping-Biodegradable-Tracking/dp/B0FXXHZW29/ref=sr_1_93",
  "https://www.amazon.in/Petcrux-Chicken-Cranberry-Dog-Treats/dp/B0CZRXXVHX/ref=sr_1_94",
  "https://www.amazon.in/Petcrux-Reusable-Remover-Clothes-Furniture/dp/B0D9GVLVPF/ref=sr_1_97",
  "https://www.amazon.in/PetCrux-Natural-Bentonite-Absorbent-Eco-Friendly/dp/B0FXXH939J/ref=sr_1_98",
  "https://www.amazon.in/Petcrux-Flushable-Clumping-Biodegradable-Tracking/dp/B0FXXHH4SN/ref=sr_1_99",
  "https://www.amazon.in/PetCrux-Premium-Acrylic-Mounted-Aquarium/dp/B09LSF297B/ref=sr_1_100",
  "https://www.amazon.in/PetCrux-Natural-Bentonite-Absorbent-Eco-Friendly/dp/B0FXXGJGPT/ref=sr_1_102",
  "https://www.amazon.in/Petcrux-Nutritious-Delicious-Training-Ingredients/dp/B0D66J1HPT/ref=sr_1_103",
  "https://www.amazon.in/Petcrux-Interactive-Toy-Cats-Dogs/dp/B0D8J4YV76/ref=sr_1_104",
  "https://www.amazon.in/Petcrux-Adult-Chicken-Complete-Balanced/dp/B0FXXKBTQQ/ref=sr_1_101",
  "https://www.amazon.in/Petcrux-Adult-Chicken-Complete-Balanced/dp/B0FXXHHLGN/ref=sr_1_102",
  "https://www.amazon.in/Petcrux-Premium-Scooper-Strength-Material/dp/B0CR69GWRR/ref=sr_1_106",
  "https://www.amazon.in/Petcrux-Bird-Foxtail-Millets-0-5kg/dp/B0D8J8JQ8J/ref=sr_1_107",
  "https://www.amazon.in/Petcrux-Chicken-Breast-Jerkey-Treats/dp/B0CZRWH8W5/ref=sr_1_108",
  "https://www.amazon.in/Petcrux-Premium-Pellet-Turtle-Contains/dp/B0CHWD42XY/ref=sr_1_109",
  "https://www.amazon.in/Petcrux-Waterproof-Material-Durable-Washable/dp/B0D98JZTW7/ref=sr_1_110",
  "https://www.amazon.in/Petcrux-Tetrabits-Fish-Complete-Nourishment/dp/B0CHWBM3M6/ref=sr_1_113",
  "https://www.amazon.in/Petcrux-Venus-Magnetic-Aquarium-Cleaner/dp/B0D8BQJM7K/ref=sr_1_114",
  "https://www.amazon.in/Petcrux-Rakhi-Gift-Box-Dogs/dp/B0D83XVLV5/ref=sr_1_116",
  "https://www.amazon.in/Petcrux-Delicious-Biscuits-Digestible-Enriched/dp/B0CVXTFMTL/ref=sr_1_124",
  "https://www.amazon.in/Petcrux-Munchy-Flavour-Suitable-Healthy/dp/B0CR3ZP61X/ref=sr_1_128"
];

const TOTAL = LINKS.length;
const CONCURRENCY = 5;
const RETRIES = 2; // ✅ retry count

const sleep = ms => new Promise(r => setTimeout(r, ms));

const clean = x => {
  if (!x) return "NA";
  const n = x.replace(/[^\d.]/g, "");
  return n === "" ? "NA" : n;
};

// Extract ASIN from Amazon URL
const extractASIN = (url) => {
  if (!url) return "NA";
  // Match ASIN in /dp/ASIN/ or /gp/product/ASIN/ format
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
  return match ? match[1] : "NA";
};


// ===================== SCRAPER =====================

async function scrapeProduct(page, url, index) {

  const product_id = extractASIN(url);

  if (!product_id || product_id === "NA") {
    throw new Error(`ASIN not found for URL: ${url}`);
  }

  let row = {
    product_id, // ✅ REQUIRED
    url: `https://www.amazon.in/dp/${product_id}`,
    name: "NA",
    price: "NA",
    original_price: "NA",
    image: "NA",
    unit: "NA",
    in_stock: "Out of Stock"
  };

  console.log(`📦 ${index + 1}/${TOTAL} | ${url}`);

  try {

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2500);

    if (page.url().includes("captcha")) {
      console.log("⚠️ CAPTCHA detected. Retrying...");
      await page.reload({ waitUntil: "networkidle2" });
      await sleep(4000);
    }

    await page.waitForSelector("#productTitle", { timeout: 12000 }).catch(() => { });
    await sleep(1500);


    // ------------ SINGLE SCRAPE ATTEMPT ---------------
    const scrapeOnce = async () => {
      return await page.evaluate(() => {

        const get = s => {
          const el = document.querySelector(s);
          return el ? el.innerText.trim() : "NA";
        };

        const img = (selectors) => {
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (!el) continue;

            const src =
              el.getAttribute("src") ||
              el.getAttribute("data-src") ||
              el.getAttribute("data-old-hires");

            if (!src || src.includes("sprite") || src.includes("grey-pixel")) continue;

            return src;
          }

          return "NA";
        };


        // ✅ UNIVERSAL PRICE
        const price = (() => {
          const selectors = [
            "#corePriceDisplay_desktop_feature_div span.a-offscreen",
            ".a-price .a-offscreen",
            "#priceblock_dealprice",
            "#priceblock_ourprice"
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim()) return el.innerText.trim();
          }
          return "NA";
        })();

        const original_price = get(
          "#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-small.aok-align-center > span > span.aok-relative > span.a-size-small.a-color-secondary.aok-align-center.basisPrice > span > span:nth-child(2)"
        );

        // ✅ UNIT FROM TABLE
        const unit = (() => {
          const rows = document.querySelectorAll("#productDetails_detailBullets_sections1 tr");

          for (const row of rows) {
            const label = row.querySelector("th")?.innerText.toLowerCase();
            const value = row.querySelector("td")?.innerText.trim();

            if (!label || !value) continue;

            if (
              label.includes("item weight") ||
              label.includes("net quantity") ||
              label.includes("weight") ||
              label.includes("size")
            ) {
              return value;
            }
          }
          return "NA";
        })();


        return {
          name: get("#productTitle"),
          price,
          original_price,
          stock: get("#availability > span"),
          image: img([
            "#main-image-container img",
            "#landingImage"
          ]),
          unit
        };

      });
    };


    // ------------ RETRY LOGIC ---------------
    let data;

    for (let attempt = 0; attempt <= RETRIES; attempt++) {

      if (attempt > 0) {
        console.log(`🔁 Retry ${attempt}/${RETRIES} → ${url}`);
        await page.reload({ waitUntil: "networkidle2" });
        await sleep(4000);
      }

      data = await scrapeOnce();

      // ✅ stop retry if we successfully got name + price
      if (data.name !== "NA" && data.price !== "NA") break;
    }


    // ----------- APPLY RESULTS ------------
    row.name = data.name;
    row.price = clean(data.price);

    // ✅ fallback MRP
    const mrp = clean(data.original_price);
    row.original_price = (mrp !== "NA" && mrp !== "") ? mrp : row.price;

    row.image = data.image !== "NA" ? data.image : "NA";
    row.unit = data.unit || "NA";


    // ✅ STOCK
    const stockText = (data.stock || "").toLowerCase();

    if (
      stockText.includes("in stock") ||
      stockText.includes("available") ||
      stockText.includes("usually dispatched")
    ) {
      row.in_stock = "In Stock";
    } else {
      row.in_stock = "Out of Stock";
    }


    // ❌ Final failure logging
    if (row.name === "NA") {
      console.log(`❌ Still NA after retry: ${url}`);
    }

    console.log(`✅ ${row.name} | ₹${row.price} | ₹${row.original_price} | ${row.unit} | ${row.in_stock}`);

  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
  }

  return row;
}


// ===================== BATCH =====================

async function processBatch(browser, urls, startIndex) {

  const pages = [];

  for (let i = 0; i < urls.length; i++) {

    const page = await browser.newPage();

    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({ "accept-language": "en-IN,en;q=0.9" });

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await sleep(500);
    pages.push(page);
  }

  const data = await Promise.all(
    urls.map((url, i) => scrapeProduct(pages[i], url, startIndex + i))
  );

  await Promise.all(pages.map(p => p.close()));

  return data;
}



// ===================== RUN =====================

async function scrape() {

  let browser;

  try {

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const rows = [];
    const batchSize = CONCURRENCY;

    console.log("🚀 Amazon scraper with 2-retry system started\n");

    for (let i = 0; i < TOTAL; i += batchSize) {
      const batch = LINKS.slice(i, i + batchSize);
      const result = await processBatch(browser, batch, i);
      rows.push(...result);
      await sleep(1500);
    }


    // ✅ CSV
    const headers = ["product_id", "url", "name", "price", "original_price", "image", "unit", "in_stock"];
    const csv = [
      headers.join(","),
      ...rows.map(r =>
        headers.map(h => `"${(r[h] || "").replace(/"/g, '""')}"`).join(",")
      )
    ];

    fs.writeFileSync("petcrux_amazon.csv", csv.join("\n"));
    console.log("📁 CSV saved");

const safeRows = rows.map(r => {
  let price = r.price;

  if (price === "NA" || price === "") {
    price = r.in_stock === "Out of Stock" ? "0" : price;
  }

  return {
    ...r,
    price: price,
    original_price:
      r.original_price !== "NA" && r.original_price !== ""
        ? r.original_price
        : price
  };
});

    // ✅ SUPABASE
await upsertProducts(safeRows, 'amazon', 'petcrux');
    console.log(`✅ Supabase updated: ${rows.length} products`);


  } catch (e) {
    console.error("❌ Fatal error:", e.message);
  }

  finally {
    if (browser) await browser.close();
  }
}

scrape();