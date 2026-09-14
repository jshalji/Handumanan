const path = require('path');
const puppeteerPath = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx', '668c188756b835f3', 'node_modules', 'puppeteer');
const puppeteer = require(puppeteerPath);

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1800, height: 1200, deviceScaleFactor: 2 });
    const htmlPath = path.join(__dirname, 'final-diagrams', 'combined.html');
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
    const outPath = path.join(__dirname, 'final-diagrams', '00-all-diagrams-combined.png');
    await page.screenshot({ path: outPath, fullPage: true });
    await browser.close();
    console.log('Combined screenshot saved successfully:', outPath);
  } catch (err) {
    console.error('Error creating combined screenshot:', err);
  }
})();
