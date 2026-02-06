#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ Use absolute path for Node to avoid "spawn ENOENT"
const NODE_PATH = '/usr/local/bin/node';

// ⭐ SCRAPER ORDER + COMMANDS
const SCRAPERS = [
  { name: 'blinkit_sheets.js', cmd: `${NODE_PATH} blinkit_sheets.js` },
  { name: 'instamart_sheets.js', cmd: `${NODE_PATH} instamart_sheets.js` },
  { name: 'zepto_sheets.js', cmd: `${NODE_PATH} zepto_sheets.js` },
  { name: 'petcrux_blinkit_sheets.js', cmd: `${NODE_PATH} petcrux_blinkit_sheets.js` },
  { name: 'petcrux_instamart_sheets.js', cmd: `${NODE_PATH} petcrux_instamart_sheets.js` },
  { name: 'petcrux_zepto_sheets.js', cmd: `${NODE_PATH} petcrux_zepto_sheets.js` },
//   { name: 'petcrux_amazon_sheets.js', cmd: `${NODE_PATH} petcrux_amazon_sheets.js` },
];

// ⭐ LOG FILE
const LOG_FILE = path.join(
  __dirname,
  `scraper_log_${new Date().toISOString().slice(0, 10)}.txt`
);
const TIMESTAMP = () => new Date().toISOString();

function log(message) {
  const msg = `[${TIMESTAMP()}] ${message}\n`;
  console.log(msg.trim());
  fs.appendFileSync(LOG_FILE, msg);
}

async function runCommand(cmd, name) {
  return new Promise((resolve, reject) => {
    log(`STARTING: ${name}`);
    const [command, ...args] = cmd.split(' ');

    const child = spawn(command, args, {
      stdio: 'pipe',
      cwd: __dirname, // Ensure relative scripts run correctly
      env: process.env, // Keep your environment
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`TIMEOUT after 300s: ${name}`));
    }, 1800000);

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start ${name}: ${err.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        log(`✅ SUCCESS: ${name}`);
        resolve(true);
      } else {
        log(`❌ FAILED: ${name} (code ${code})`);
        reject(new Error(errorOutput || 'Unknown error'));
      }
    });
  });
}

async function main() {
  console.log(`\nPRICEPULSE SCRAPER PIPELINE STARTED\n${'='.repeat(50)}\n`);
  log(`PIPELINE STARTED`);

  let successCount = 0;

  for (const scraper of SCRAPERS) {
    console.log(`\n🔄 [${successCount + 1}/${SCRAPERS.length}] Running: ${scraper.name}`);
    try {
      await runCommand(scraper.cmd, scraper.name);
      successCount++;
      console.log(`${scraper.name} COMPLETED`);
    } catch (error) {
      console.log(`\n🚨 PIPELINE STOPPED! ${scraper.name} FAILED`);
      log(`PIPELINE STOPPED at ${scraper.name}`);
      console.error(error.message);
      process.exit(1);
    }
  }

  console.log(`\n✅ ALL ${successCount} SCRAPERS COMPLETED SUCCESSFULLY!`);
  log(`FULL PIPELINE SUCCESS`);
  console.log(`LOG FILE: ${LOG_FILE}`);
  console.log(`\nLIVE DATA UPDATED! Check: https://pricepulse.vercel.app`);
}

main().catch((err) => {
  console.error(`FATAL ERROR: ${err.message}`);
  log(`FATAL ERROR: ${err.message}`);
  process.exit(1);
});