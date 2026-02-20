import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const CATALOGUE_URL =
    'https://www.zepto.com/brand/Happilo/21dd2f6d-edc7-4393-b504-a5fe3827423d?spvid=7d17ea9c-2d24-4add-8564-a7cda1dc5ffa';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    console.log('🚀 Starting Happilo Zepto Link Extractor');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 },
        args: [
            '--disable-blink-features=AutomationControlled',
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
    });

    const page = await browser.newPage();

    try {
        console.log('🌐 Opening catalogue page...');
        await page.goto(CATALOGUE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await sleep(5000);

        // Scroll to load all products (infinite scroll)
        console.log('📜 Scrolling to load all products...');

        let previousHeight = 0;
        let idleCycles = 0;
        const MAX_IDLE = 6;

        while (idleCycles < MAX_IDLE) {
            const currentHeight = await page.evaluate(() => document.body.scrollHeight);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await sleep(2000);

            if (currentHeight === previousHeight) {
                idleCycles++;
            } else {
                idleCycles = 0;
                previousHeight = currentHeight;
            }
        }

        console.log('✅ Scroll complete');
        await sleep(2000);

        // Extract product links with names containing "Happilo"
        const products = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="/pn/"]');
            const results = [];
            const seen = new Set();

            for (const link of links) {
                const href = link.getAttribute('href');
                if (!href || seen.has(href)) continue;

                // Get the text content of the link to find the product name
                const text = link.innerText || '';
                const name = text.split('\n').find(line =>
                    line.trim().toLowerCase().includes('happilo')
                ) || '';

                if (!name) continue;

                seen.add(href);
                const fullUrl = href.startsWith('http')
                    ? href
                    : `https://www.zepto.com${href}`;

                results.push({
                    name: name.trim(),
                    url: fullUrl
                });
            }

            return results;
        });

        console.log(`\n✅ Found ${products.length} Happilo products:\n`);

        products.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`);
            console.log(`   ${p.url}\n`);
        });

        // Save to JSON
        fs.writeFileSync(
            'happilo_zepto_links.json',
            JSON.stringify(products, null, 2)
        );
        console.log('📄 Saved to happilo_zepto_links.json');

        // Also save just the URLs as a simple array for easy copy-paste
        const urlsOnly = products.map(p => `"${p.url}"`).join(',\n');
        fs.writeFileSync(
            'happilo_zepto_urls.txt',
            urlsOnly
        );
        console.log('📄 Saved URLs to happilo_zepto_urls.txt');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await browser.close();
    }
})();
