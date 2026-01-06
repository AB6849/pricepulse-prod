import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { upsertProducts } from "./src/services/productAdminService.js";


puppeteer.use(StealthPlugin());


const PRODUCT_LINKS = [
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-track-pant-black-s/pvid/9ae9624f-21c0-4023-8c19-096f386a54c1",
  "https://www.zepto.com/pn/pepe-jeans-premium-cotton-hipsters-pack-of-3-multicolor-l-panty/pvid/df73617a-b090-491e-bedc-aa125c6694d2",
  "https://www.zepto.com/pn/pepe-jeans-mens-lounge-track-pant-navy-m/pvid/44cccbc9-646a-4562-b5fc-a8fce95a0a75",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-track-pant-astral-blue-m/pvid/1548b1fe-cf95-4eac-86d7-6eb8b667ee05",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-black-s/pvid/63f1db85-040c-45aa-b5f1-2474937014d8",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-pink-s/pvid/eec00105-0ca2-486a-9067-c6b4c61a13e7",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-track-pant-astral-blue-l/pvid/09675253-04cd-4795-83ab-456cd963cf89",
  "https://www.zepto.com/pn/pepe-jeans-mens-printed-dark-grey-boxer-xl/pvid/96a64c85-ff53-411b-860b-7ba2715867e2",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-track-pant-phantom-black-l/pvid/045a9023-6b5d-4866-ac53-5e63a2a73f8a",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-vest-m-comfortable-fit/pvid/51fb5652-7e99-4bc8-b1eb-580267820c2d",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-black-brief-xl/pvid/006c6685-b2d8-48d4-9dad-617e77d0a1bc",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-solid-tank-top-lightweight-and-soft-atv02-black-xxl/pvid/e670f6d9-777c-4e28-8d5c-a6a2498e2bec",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-rich-solid-mid-rise-track-pant-blue-melange-s/pvid/c82bd0d1-2ad7-4e6e-907b-5d7faa5769f8",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-lounge-pant-navy-m/pvid/5f432450-770a-4e13-ba82-40eaf0743b22",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-regular-fit-mid-rise-waist-shorts-black-l/pvid/d0dc6020-f0bc-403f-88b6-4c05f588e73b",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-vest-xl-comfortable-fit/pvid/5142b42f-c5c2-4121-b629-bb58444079ba",
  "https://www.zepto.com/pn/pepe-jeans-premium-cotton-hipsters-pack-of-3-multicolor-l-panty/pvid/4d0c47db-2a31-478a-b23c-74a24499b9f9",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-pink-l/pvid/12175017-3bec-4167-a2b6-f2498ec2bee1",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-black-xl/pvid/c3f2f41b-55a2-45f3-8909-6f78fc7b5250",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-regular-fit-mid-rise-waist-shorts-black-m/pvid/06e9111f-d2fb-4981-a86a-269cc2f7fe27",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-track-pant-navy-m/pvid/f0e28fe4-a89a-4ba6-9345-0b28db9a553e",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-black-brief-xxl/pvid/b5e8e0af-657b-41f9-8267-d3df74785e5d",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-boxer-l-breathable-fabric/pvid/62f74366-6311-4606-8a74-decd49027d52",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-lounge-pant-navy-l/pvid/ee6fd2e8-9db6-4dd9-a10b-0cba970ad481",
  "https://www.zepto.com/pn/pepe-jeans-mens-printed-rumba-red-boxer-l/pvid/cfe0f7da-3ef2-4b57-9cee-b16e954a9bc2",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-black-xxl/pvid/28c0471e-3736-4193-a8fe-bb1188e55d59",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-solid-tank-top-lightweight-and-soft-atv02-grey-l/pvid/d9bc8bfa-65a4-4daf-91f2-141550fda810",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-cotton-brief-blue-s/pvid/c951ba4c-673a-4ac0-9a39-a798114d8f71",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-vest-xl-comfortable-fit/pvid/325edb21-b432-4401-9b9c-f1fa009ca3b5",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-track-pant-navy-s/pvid/a76de377-ecdd-403e-afdf-27547e8fe60f",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-solid-tank-top-lightweight-and-soft-atv02-black-s/pvid/e09dd006-ddd5-46d8-be35-23751b4c8987",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-boxer-m-breathable-fabric/pvid/88f0a940-84b1-4a35-beef-44d6b3b82c8b",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-true-blue-brief-l/pvid/f225da8f-6583-49c2-90dd-cda76d0733b6",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-regular-fit-mid-rise-waist-shorts-black-s/pvid/b77ad021-8898-4d9b-b595-31e7312f6677",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-black-brief-m/pvid/09c1cd67-4355-451e-8d9b-bb45c4283a8b",
  "https://www.zepto.com/pn/pepe-jeans-mens-printed-rumba-red-boxer-xl/pvid/ce9340fd-4737-4d45-be2d-735008e5bbb1",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-lounge-pant-black-m/pvid/aef793a8-b701-433c-9b4a-8efeed3e83be",
  "https://www.zepto.com/pn/pepe-jeans-cotton-mens-trunks-l-sweat-resistant-solid-black/pvid/028c69e7-6a52-43c7-b705-8836c4da8eb4",
  "https://www.zepto.com/pn/pepe-jeans-cotton-mens-trunks-s-sweat-resistant-solid-charcoal-melange/pvid/527ff764-0d13-48a5-acba-9477c503319a",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-pink-xxl/pvid/0fb4c6ad-8588-4c6e-ba2c-2e95ba3b5429",
  "https://www.zepto.com/pn/pepe-jeans-mens-printed-dark-grey-boxer-xxl/pvid/b11cc485-1ca1-40bb-956e-6b9dbbe18d17",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-black-l/pvid/8d59f0a8-c892-4a6a-baaf-bbb20abd1010",
  "https://www.zepto.com/pn/pepe-jeans-mens-printed-rumba-red-boxer-m/pvid/f0b170d2-c9b8-4631-8ad3-e138c10559fe",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-charcoal-melange-brief-s/pvid/b2e9c908-161e-4a99-8f31-543e76e09216",
  "https://www.zepto.com/pn/pepe-jeans-mens-trunk-s-cotton-blend-sweat-resistant-blue/pvid/29d8332e-d5aa-45db-bd4f-76959d2ba9b1",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-vest-xxl-comfortable-fit/pvid/a922d34b-fd7b-4ae5-970b-d1f0da682f45",
  "https://www.zepto.com/pn/pepe-jeans-mens-dry-fit-gym-t-shirt-pink-xl/pvid/39817b3a-0713-499b-8855-f15d0339b9ca",
  "https://www.zepto.com/pn/pepe-jeans-womens-premium-track-pant-black-m/pvid/6bac3a7b-35b4-4bb6-adb5-f3f0b1412b7b",
  "https://www.zepto.com/pn/pepe-jeans-mens-cotton-solid-tank-top-lightweight-and-soft-atv02-grey-s/pvid/86e66b63-42e7-45c1-8f31-e110410f91df",
  "https://www.zepto.com/pn/pepe-jeans-premium-cotton-hipsters-pack-of-3-multicolor-s-panty/pvid/5b3218c1-12ae-48a2-b469-b4132d429fde",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-true-blue-brief-s/pvid/a3dcc1ce-5e79-4c61-b3f9-45f63ecf32eb",
  "https://www.zepto.com/pn/pepe-jeans-mens-lounge-track-pants-black-l/pvid/da370467-de31-497e-8048-dfd54b3d0b49",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-lounge-pant-black-l/pvid/ceda2a94-c263-406d-b3b3-08b2d183c2ca",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-vest-m-comfortable-fit/pvid/dc055ce3-6736-4a6b-8021-a284403d1521",
  "https://www.zepto.com/pn/pepe-jeans-mens-printed-rumba-red-boxer-s/pvid/38659f36-7b6e-418b-ab1a-c2c2348b5484",
  "https://www.zepto.com/pn/pepe-jeans-cotton-mens-trunks-l-sweat-resistant-solid-charcoal-melange/pvid/00648cee-6b5a-4470-9301-5ea1829afbda",
  "https://www.zepto.com/pn/pepe-jeans-cotton-mens-boxer-s-breathable-fabric/pvid/4167ec93-79ef-4d1e-94a8-79b20834bc5b",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-black-brief-s/pvid/657dc285-6afe-46c4-97e2-a8d89e4e9ae7",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-cotton-vest-grey-melange-s/pvid/ef0bd5eb-e222-4ffc-842e-40d334e15c16",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-vest-s-smooth-seams/pvid/c038c5d2-9116-4e36-ae9a-ce9adfc297ba",
  "https://www.zepto.com/pn/pepe-jeans-mens-lounge-track-pants-black-s/pvid/19addfe2-545c-4f72-b3b8-893c1367557e",
  "https://www.zepto.com/pn/pepe-jeans-cotton-mens-trunks-s-sweat-resistant-solid-black/pvid/17b1f1c6-5099-4eda-b533-cf6a98843b64",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-track-pant-phantom-black-xl/pvid/c06e7cb1-ebe2-4a6b-a796-23637fc7d542",
  "https://www.zepto.com/pn/pepe-jeans-mens-lounge-track-pants-black-m/pvid/d480adc4-860a-44e3-b5b5-5d44ab87c3e1",
  "https://www.zepto.com/pn/pepe-jeans-mens-premium-lounge-pant-navy-s/pvid/d9dd6743-44e5-4a14-95ac-8ba21b350f5c",
  "https://www.zepto.com/pn/pepe-jeans-premium-poly-spandex-t-shirt-barkha-brown-l/pvid/d1bb2dcd-28c2-46b6-8c90-5fb3689b533a",
  "https://www.zepto.com/pn/pepe-jeans-mens-solid-charcoal-melange-brief-m/pvid/9e448fce-3ff4-4e94-8f98-ba710eb4bcfe",
  "https://www.zepto.com/pn/pepe-jeans-100-cotton-mens-vest-l-smooth-seams/pvid/f3f66491-d454-40bf-ba41-f353c154c257"
];


function clean(p) {
  if (!p) return null;
  const c = p.replace(/[^\d.]/g, "");
  return c === "" ? null : c;
}


function cleanProductName(name) {
  if (!name) return "NA";
  const sizePatterns = [
    /-S( |$)/i, /-M( |$)/i, /-L( |$)/i, /-XL( |$)/i, /-XXL( |$)/i, /-2XL( |$)/i,
    /S Panty/i, /L Panty/i, /M Panty/i, /XL Panty/i, /XXL Panty/i, /XS( |$)/i, /-XS( |$)/i
  ];
  let cleanedName = name;
  sizePatterns.forEach(pattern => {
    cleanedName = cleanedName.replace(pattern, '$1');
  });
  cleanedName = cleanedName
    .replace(/\b(S|M|L|XL|XXL|XS|2XL|3XL)\b(?! Panty)/gi, '')
    .replace(/\b[A-Z]{1,3}\$?\d+\b/gi, '')
    .replace(/-\s*$/, '')
    .replace(/,\s*[A-Z0-9\$]+$/gi, '')
    .replace(/[-|]+$/, '')
    .replace(/,\s*$/, '')     // ✅ REMOVE ending comma
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*$/g, '')
    .trim();
  return cleanedName || "NA";
}


async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}


let locationSet = false;


/***************************************************************
* RETRY HELPER FUNCTIONS
***************************************************************/
function shouldRetry(error) {
  const retryMessages = [
    'Navigation timeout',
    'net::ERR_',
    'Failed to load',
    'TimeoutError',
    'Target closed'
  ];
  const errorMsg = error.message || error.toString();
  return retryMessages.some(msg => errorMsg.includes(msg));
}


async function processProductWithRetry(browser, page, url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🔗 [Attempt ${attempt}/${maxRetries}] Processing:`, url);

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 45000 // Reduced timeout for faster retries
      });
      console.log("✅ Product page loaded");

      // Set location only for first successful load
      if (!locationSet) {
        const locationSuccess = await setLocationFromProductPage(page);
        if (locationSuccess) {
          locationSet = true;
        }
      }


      await sleep(3000); // Reduced wait time


      return await processSingleProduct(page, url);

    } catch (err) {
      console.log(`❌ Attempt ${attempt} failed:`, err.message);

      if (attempt === maxRetries || !shouldRetry(err)) {
        console.log(`💥 Final failure after ${maxRetries} attempts`);
        return {
          name: "SCRAPE_FAILED",
          image: "NA",
          original_price: "NA",
          current_price: "NA",
          discount: "NA",
          unit: "SCRAPE_FAILED",
          in_stock: "SCRAPE_FAILED"
        };
      }

      console.log(`⏳ Waiting ${attempt * 2000}ms before retry...`);
      await sleep(attempt * 2000);

      // Clear page content for clean retry
      await page.evaluate(() => {
        document.body.innerHTML = '';
      });
    }
  }
  return null;
}


/***************************************************************
* SUPABASE WRITER
***************************************************************/
async function writeToSupabase(data) {
  try {
    await upsertProducts(data, 'zepto', 'pepe');
    console.log(`✅ Wrote ${data.length} products to Supabase`);
  } catch (error) {
    console.error("Supabase error:", error.message);
    throw error;
  }
}


/***************************************************************
* SET LOCATION (UNCHANGED)
***************************************************************/
async function setLocationFromProductPage(page) {
  if (locationSet) {
    console.log("✅ Location already set, skipping...");
    return true;
  }


  try {
    console.log("📍 Setting location from product page (FIRST TIME ONLY)...");

    const locationButton =
      "body > div.font-norms > div > div > header > div > div.a0Ppr.u-flex.u-flex-col.u-justify-center > button > h3 > span";

    await page.waitForSelector(locationButton, { timeout: 10000 });
    await page.click(locationButton);
    await sleep(1500);


    const pincodeInput =
      "#zui-modal-undefined > div > div > div > div > div > div > div:nth-child(2) > div > div.__19N_A > div.EaYPU > div > div > input";

    await page.waitForSelector(pincodeInput, { timeout: 10000 });
    await page.click(pincodeInput);
    await page.type(pincodeInput, "560012", { delay: 100 });
    await sleep(1000);


    const confirmButton =
      "#zui-modal-undefined > div > div > div > div > div > div > div:nth-child(2) > div > div.__19N_A > div.qvMf2 > div > div > div > div.cIArQh > div.ck03O3 > div";

    await page.waitForSelector(confirmButton, { timeout: 10000 });
    await page.click(confirmButton);
    await sleep(4000);

    locationSet = true;
    console.log("✅ Location set successfully!");
    return true;

  } catch (err) {
    console.log("⚠️ Location setting failed:", err.message);
    locationSet = true;
    return false;
  }
}


/***************************************************************
* EXTRACT DATA (UNCHANGED)
***************************************************************/
async function extractDataForSize(page, sizeText) {
  return await page.evaluate((size) => {
    function text(sel) {
      const el = document.querySelector(sel);
      return el ? el.innerText.trim() : null;
    }


    function image() {
      const selectors = [
        "img[src*='product']",
        ".product-image img",
        "img",
        "[data-testid='product-image']"
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.src) return el.src;
      }
      return null;
    }


    const name =
      text("h1") ||
      text("#product-features-wrapper h1") ||
      text("[data-testid='product-title']") ||
      "NA";


    const current_price =
      text(".cp62rX.c9OiKy.cu4Qk6") ||
      text("[data-testid='product-price']") ||
      text("span[class*='price'][class*='current']") ||
      null;


    const original_price =
      text(".cBVS0N.c9OiKy.cL9VE0") ||
      text("span.line-through") ||
      null;


    const discount =
      text(".c7yhjq.c9OiKy.cL9VE0") ||
      text("[data-testid='product-discount']") ||
      null;


    const exactOOSSelector =
      "#product-features-wrapper > div:nth-child(1) > div > div.u-flex.u-flex-col.u-items-center.u-justify-center.E2ab6 > h3";

    const isOutOfStock = !!document.querySelector(exactOOSSelector);


    return {
      name,
      current_price,
      original_price,
      discount,
      image: image(),
      isOutOfStock,
      unit: size
    };
  }, sizeText);
}


/***************************************************************
* SIZE DETECTION & CLICKING FUNCTIONS (UNCHANGED)
***************************************************************/
async function detectSizeVariants(page) {
  return await page.evaluate(() => {
    console.log("🔍 Enhanced size detection - finding ALL variants...");

    const sizes = new Set();

    const containerSelectors = [
      "#product-features-wrapper > div:nth-child(1) > div > div.u-flex.u-flex-col.Z14K7",
      ".Z14K7",
      "[class*='Z14K7']",
      ".utmMl",
      "[class*='utmMl']"
    ];

    containerSelectors.forEach((containerSel, containerIndex) => {
      const containers = document.querySelectorAll(containerSel);
      containers.forEach(container => {
        const buttons = container.querySelectorAll("button, [role='button'], div[role='button']");

        buttons.forEach(btn => {
          const btnText = btn.innerText.trim();
          if (!btnText) return;

          const upperText = btnText.toUpperCase();
          const validSizes = [
            'S', 'M', 'L', 'XL', 'XXL', 'XS', '2XL', '3XL', '4XL',
            '28', '30', '32', '34', '36', '38', '40', '42', '44'
          ];

          const foundSize = validSizes.find(size => upperText.includes(size));

          if (foundSize) {
            const cleanSize = btnText
              .replace(/Out of Stock|Unavailable|Sold Out|Add to Cart/i, '')
              .trim();

            if (cleanSize && validSizes.includes(cleanSize.toUpperCase())) {
              sizes.add(cleanSize);
              console.log(`   ✅ Size found in container ${containerIndex + 1}: "${cleanSize}"`);
            }
          }
        });
      });
    });

    let sizeArray = Array.from(sizes);
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '28', '30', '32', '34', '36'];

    sizeArray.sort((a, b) => {
      return sizeOrder.indexOf(a.toUpperCase()) - sizeOrder.indexOf(b.toUpperCase());
    });

    console.log(`🎯 ALL SIZES FOUND: [${sizeArray.join(', ')}] (${sizeArray.length} total)`);
    return sizeArray;
  });
}


async function clickSizeVariant(page, sizeText, index) {
  console.log(`   🔍 Clicking size: "${sizeText}" (index: ${index})`);
  try {
    const clicked = await page.evaluate((size) => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const btnText = btn.innerText.trim();
        if (btnText.toUpperCase().includes(size.toUpperCase()) &&
          (btnText.toUpperCase() === size.toUpperCase() ||
            btnText.toUpperCase() === size.toUpperCase() + 'XL' ||
            btnText.toUpperCase() === '2XL' && size.toUpperCase() === 'XXL')) {
          btn.click();
          return true;
        }
      }
      return false;
    }, sizeText);

    if (clicked) {
      console.log(`   ✅ Clicked "${sizeText}" by exact text match`);
      return true;
    }
  } catch (e) {
    console.log(`   ⚠️ Text click failed for "${sizeText}":`, e.message);
  }
  try {
    const selector = `#product-features-wrapper > div:nth-child(1) > div > div.u-flex.u-flex-col.Z14K7 button:nth-of-type(${index + 1})`;
    await page.waitForSelector(selector, { timeout: 2000 });
    await page.click(selector);
    console.log(`   ✅ Clicked "${sizeText}" by container index`);
    return true;
  } catch (e) {
    // Continue to next method
  }
  try {
    await page.click('.Z14K7 button, .utmMl button');
    console.log(`   ✅ Clicked "${sizeText}" by container fallback`);
    return true;
  } catch (e) {
    // Final fallback
  }
  console.log(`   ❌ Failed to click size: "${sizeText}"`);
  return false;
}

function extractProductId(url) {
  const match = url.match(/\/pvid\/([^/?]+)/);
  return match ? match[1] : "NA";
}


function processData(data, url) {
  const current_price = clean(data.current_price);
  const original_price = clean(data.original_price);


  const in_stock = data.isOutOfStock ? "Out of Stock" : "In Stock";


  let discount = data.discount || "NA";
  if (current_price && original_price && !discount.includes('%')) {
    const cp = Number(current_price);
    const mp = Number(original_price);
    if (mp > cp) {
      discount = `${Math.round(((mp - cp) / mp) * 100)}% OFF`;
    }
  }

  return {
    product_id: extractProductId(url), // ✅ Zepto pvid
    url,                               // ✅ canonical PDP URL
    name: cleanProductName(data.name),
    image: data.image || "NA",
    original_price: original_price || "NA",
    current_price: current_price || "NA",
    discount,
    unit: data.unit || "NA",
    in_stock
  };
}


/***************************************************************
* NEW: PROCESS SINGLE PRODUCT
***************************************************************/
async function processSingleProduct(page, url) {
  const sizeButtonTexts = await detectSizeVariants(page);
  console.log(`🔢 Found ${sizeButtonTexts.length} size variants:`, sizeButtonTexts);


  const variants = [];


  if (sizeButtonTexts.length === 0) {
    console.log("📦 Single variant product");
    const data = await extractDataForSize(page, "NA");
    const processed = processData(data, url);
    variants.push(processed);
    console.log(`   ✔️ Single variant: ${processed.unit} - ${processed.in_stock}`);
  } else {
    console.log(`📦 Multiple variant product (${sizeButtonTexts.length} sizes)`);

    for (let j = 0; j < sizeButtonTexts.length; j++) {
      try {
        const sizeText = sizeButtonTexts[j];
        console.log(`   👕 Processing size ${j + 1}/${sizeButtonTexts.length}: "${sizeText}"`);


        const clickSuccess = await clickSizeVariant(page, sizeText, j);

        if (clickSuccess) {
          await sleep(2000); // Reduced wait time
        } else {
          await sleep(1000);
        }


        const data = await extractDataForSize(page, sizeText);
        const processed = processData(data, url);
        variants.push(processed);

        console.log(`   ✔️ ${sizeText}: ₹${processed.current_price || 'N/A'} - ${processed.in_stock}`);


      } catch (sizeErr) {
        console.log(`   ❌ Size ${j + 1} failed:`, sizeErr.message);
        variants.push({
          product_id: extractProductId(url),
          url,
          name: "NA",
          image: "NA",
          original_price: "NA",
          current_price: "NA",
          discount: "NA",
          unit: sizeButtonTexts[j] || `Size ${j + 1}`,
          in_stock: "Out of Stock"
        });

      }
    }
  }


  return variants;
}


/***************************************************************
* MAIN SCRAPER WITH RETRY LOGIC
***************************************************************/
async function scrape() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });


  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );


  const out = [];
  const failedProducts = []; // Track failed products for retry


  // FIRST PASS: Process all products
  console.log(`\n🚀 === FIRST PASS: Processing ${PRODUCT_LINKS.length} products ===`);
  for (let i = 0; i < PRODUCT_LINKS.length; i++) {
    const url = PRODUCT_LINKS[i];

    const result = await processProductWithRetry(browser, page, url);

    if (Array.isArray(result)) {
      out.push(...result);
      console.log(`✅ Product ${i + 1} completed successfully (${result.length} variants)`);
    } else {
      failedProducts.push({ url, index: i });
      console.log(`❌ Product ${i + 1} failed - will retry later`);
    }


    await sleep(2000); // Between products
  }


  // RETRY PASS: Process failed products
  if (failedProducts.length > 0) {
    console.log(`\n🔄 === RETRY PASS: Processing ${failedProducts.length} failed products ===`);

    for (let i = 0; i < failedProducts.length; i++) {
      const { url } = failedProducts[i];

      console.log(`\n🔗 RETRY [${i + 1}/${failedProducts.length}] :`, url);
      const result = await processProductWithRetry(browser, page, url, 2); // 2 retries for failed products

      if (Array.isArray(result)) {
        // Replace failed entries with successful ones
        // Note: Since we don't track exact positions, we just add them
        out.push(...result);
        console.log(`✅ Retry successful (${result.length} variants)`);
      } else {
        console.log(`❌ Retry also failed for:`, url);
      }

      await sleep(3000); // Longer wait between retries
    }
  }


  await browser.close();


  /***************************************************************
   * WRITE OUTPUT
   ***************************************************************/
  const headers = [
    "product_id",
    "url",
    "name",
    "image",
    "original_price",
    "current_price",
    "discount",
    "unit",
    "in_stock"
  ];
  const rows = [headers.join(",")];


  for (const r of out) {
    rows.push(headers.map(h => `"${(r[h] || "").replace(/"/g, '""')}"`).join(","));
  }


  fs.writeFileSync("zepto_universal_desktop.csv", rows.join("\n"));
  console.log(`\n📁 Saved: zepto_universal_desktop.csv (${out.length} variants)`);


  await writeToSupabase(out);
  console.log(`✅ Zepto scraping completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Total variants scraped: ${out.length}`);
  console.log(`   - Products processed: ${PRODUCT_LINKS.length}`);
  console.log(`   - Products that needed retry: ${failedProducts.length}`);
}


// 🔥 Run the scraper
scrape().catch(console.error);
