#!/usr/bin/env node
/* Takes the home page of each live site, dark and light, for the site tiles.
     node scripts/shoot.mjs <benibix repo>
   Writes scripts/shots/<app>[-light].webp; Playwright and sharp come from the benibix repo. */
import { createRequire } from 'node:module';
import path from 'node:path';
import { SITE_URLS } from './sites.mjs';

const repo = path.resolve(process.argv[2] || '../benibix');
const require = createRequire(path.join(repo, 'package.json'));
const { chromium } = require('playwright');
const sharp = require('sharp');
const out = path.join(path.dirname(new URL(import.meta.url).pathname), 'shots');

const browser = await chromium.launch();
for (const th of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: th });
  await ctx.addInitScript(t => { try { localStorage.setItem('dt:theme', t); } catch {} }, th);
  for (const [id, url] of Object.entries(SITE_URLS)) {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3500); // the heroes draw themselves in
    await sharp(await page.screenshot()).resize(1168, 730).webp({ quality: 74 }).toFile(path.join(out, `${id}${th === 'light' ? '-light' : ''}.webp`));
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(`wrote ${Object.keys(SITE_URLS).length * 2} shots to ${out}`);
