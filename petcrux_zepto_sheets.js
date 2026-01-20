import fs from "fs";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { upsertProducts } from "./src/services/productAdminService.js";


puppeteer.use(StealthPlugin());


const PRODUCT_LINKS = [
    "https://www.zepto.com/pn/petcrux-smart-clump-bentonite-cat-litter-5-kg-pack-of-2/pvid/ee9abb43-e14b-48d6-81c3-cea9afd07fa4",
    "https://www.zepto.com/pn/petcrux-ecoclump-unscented-bentonite-cat-litter/pvid/884335ac-a1f2-42ed-aba9-36215f1f2878",
    "https://www.zepto.com/pn/petcrux-premium-mixed-seeds-with-9-grains-nuts-blended-for-budgies-doves-parrots-sparrows/pvid/d262eaec-e01b-4a1a-af24-90ad7b7f81f3",
    "https://www.zepto.com/pn/petcrux-bajra-bird-food/pvid/30e8ee5d-1959-49b1-8d8f-ea0ba0ce2b05",
    "https://www.zepto.com/pn/petcrux-hipkoo-advanced-clumping-cat-litter-sand-lavender-scented-pet-litter-tray-refill/pvid/53aef2b2-5ca5-45be-a7bc-046bce008d83",
    "https://www.zepto.com/pn/petcrux-dog-poop-bags-75-bags/pvid/9b3f7ecf-946f-44c7-aee2-c47029e2431f",
    "https://www.zepto.com/pn/petcrux-venus-aquarium-filter-3-in-1-high-power-15-watt-oxygen-filter-for-fish-tank/pvid/69ab9fd1-f57f-467c-a5e0-d39a1b8a4d7c",
    "https://www.zepto.com/pn/petcrux-premium-veg-striped-sunflower-seeds-bird-food-parrots-conures-cockatoo-etc/pvid/609affba-f3ab-4fac-bb97-dc9d72bfb80d",
    "https://www.zepto.com/pn/petcrux-premium-pellet-turtle-food-for-all-life-stages-contains-fish/pvid/3e6aca8f-8743-4b99-9473-4343158a8735"
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
                    price: "NA",
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
        await upsertProducts(data, 'zepto', 'petcrux');
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
        await page.type(pincodeInput, "560102", { delay: 100 });
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


        const price =
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

        const rawUnitText = text(
            "#product-features-wrapper > div:nth-child(1) > div > div.u-flex.u-items-center.gtVUz > div > span"
        );

        const unit = rawUnitText
            ? rawUnitText.replace(/net qty\s*:/i, "").trim()
            : size || "NA";

        return {
            name,
            price,
            original_price,
            discount,
            image: image(),
            isOutOfStock,
            unit
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

function getProductIdFromUrl(url) {
    const match = url.match(/\/pvid\/([^/?]+)/);
    return match ? match[1] : "NA";
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


function processData(data, url) {
    const price = clean(data.price);
    const original_price = clean(data.original_price);


    const in_stock = data.isOutOfStock ? "Out of Stock" : "In Stock";


    let discount = data.discount || "NA";
    if (price && original_price && !discount.includes('%')) {
        const cp = Number(price);
        const mp = Number(original_price);
        if (mp > cp) {
            discount = `${Math.round(((mp - cp) / mp) * 100)}% OFF`;
        }
    }


    const product_id = getProductIdFromUrl(url);
    return {
        product_id,
        url,
        name: cleanProductName(data.name),
        image: data.image || "NA",
        original_price: original_price || "NA",
        price: price || "NA",
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

                console.log(`   ✔️ ${sizeText}: ₹${processed.price || 'N/A'} - ${processed.in_stock}`);


            } catch (sizeErr) {
                console.log(`   ❌ Size ${j + 1} failed:`, sizeErr.message);
                variants.push({
                    name: "NA", image: "NA", original_price: "NA", price: "NA",
                    discount: "NA", unit: sizeButtonTexts[j] || `Size ${j + 1}`,
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
    const headers = ["product_id", "name", "image", "original_price", "price", "discount", "unit", "in_stock"];
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
