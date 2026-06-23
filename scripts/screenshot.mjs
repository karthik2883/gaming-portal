import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3001/game/algorithm-arena', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/Users/sandhya/.gemini/antigravity/brain/8978a915-ee28-4328-866d-033a283a60b9/scratch/screenshot2.png' });
  await browser.close();
  console.log('Screenshot saved.');
})();
