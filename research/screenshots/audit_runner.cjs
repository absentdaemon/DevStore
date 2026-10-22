const { chromium } = require('C:/Users/Asus/AppData/Local/npm-cache/_npx/a1722018f28f9df2/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.resolve(__dirname);

function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    const baseDir = path.resolve(__dirname, '../../');
    const MIME_TYPES = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.ico': 'image/x-icon'
    };

    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      const safePath = path.normalize(path.join(baseDir, reqPath));
      if (!safePath.startsWith(baseDir)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
      }
      fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        const ext = path.extname(safePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(safePath).pipe(res);
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve({ server: null, port });
      } else {
        reject(err);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      resolve({ server, port });
    });
  });
}

async function run() {
  console.log('--- Starting Comprehensive DevStore Parity Audit Runner ---');
  const { server, port } = await startServer(3000);
  console.log(`DevStore running at http://127.0.0.1:${port}`);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });

  try {
    // 1. Narrow Mobile 360x800
    const page360 = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await page360.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    await page360.waitForTimeout(500);
    const out360 = path.join(SCREENSHOTS_DIR, 'devstore-narrow-360.png');
    await page360.screenshot({ path: out360 });
    console.log(`Saved ${out360}`);
    await page360.close();

    // 2. Standard Mobile 390x844
    const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page390.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    await page390.waitForTimeout(500);
    const out390 = path.join(SCREENSHOTS_DIR, 'devstore-mobile-390.png');
    await page390.screenshot({ path: out390 });
    console.log(`Saved ${out390}`);
    await page390.close();

    // 3. Laptop 1280x800
    const page1280 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page1280.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    await page1280.waitForTimeout(500);
    const out1280 = path.join(SCREENSHOTS_DIR, 'devstore-laptop-1280.png');
    await page1280.screenshot({ path: out1280 });
    console.log(`Saved ${out1280}`);
    await page1280.close();

    // 4. Desktop 1440x900
    const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page1440.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    await page1440.waitForTimeout(500);
    const out1440 = path.join(SCREENSHOTS_DIR, 'devstore-desktop-1440.png');
    await page1440.screenshot({ path: out1440 });
    console.log(`Saved ${out1440}`);

    // 5. App Detail View at 1440x900 (Retro Chess Arena)
    await page1440.goto(`http://127.0.0.1:${port}/?id=org.devstore.chess`, { waitUntil: 'networkidle' });
    await page1440.waitForTimeout(600);
    const outDetail = path.join(SCREENSHOTS_DIR, 'devstore-detail-1440.png');
    await page1440.screenshot({ path: outDetail });
    console.log(`Saved ${outDetail}`);

    // 6. Ratings & Reviews Section Scrolled View
    const reviewsEl = await page1440.$('.ratings-reviews-section');
    if (reviewsEl) {
      await reviewsEl.scrollIntoViewIfNeeded();
      await page1440.waitForTimeout(300);
      const outReviews = path.join(SCREENSHOTS_DIR, 'devstore-detail-reviews.png');
      await page1440.screenshot({ path: outReviews });
      console.log(`Saved ${outReviews}`);
    }

    // 7. Full-Screen Screenshot Lightbox Gallery
    const firstScreenshot = await page1440.$('.detail-screenshot-card');
    if (firstScreenshot) {
      await firstScreenshot.click();
      await page1440.waitForTimeout(400);
      const outLightbox = path.join(SCREENSHOTS_DIR, 'devstore-screenshot-lightbox.png');
      await page1440.screenshot({ path: outLightbox });
      console.log(`Saved ${outLightbox}`);

      // Close lightbox via Escape key
      await page1440.keyboard.press('Escape');
      await page1440.waitForTimeout(300);
    }

    // 8. Video Trailer Player in Action
    const videoCard = await page1440.$('.video-preview-card');
    if (videoCard) {
      await videoCard.scrollIntoViewIfNeeded();
      await videoCard.click();
      await page1440.waitForTimeout(600);
      const outVideo = path.join(SCREENSHOTS_DIR, 'devstore-video-player.png');
      await page1440.screenshot({ path: outVideo });
      console.log(`Saved ${outVideo}`);
    }

    // 9. Interactive Install Animation Progress
    const installBtn = await page1440.$('#detail-install-cta');
    if (installBtn) {
      await installBtn.scrollIntoViewIfNeeded();
      await installBtn.click();
      // Wait for intermediate installing state (around 200ms)
      await page1440.waitForTimeout(220);
      const outInstall = path.join(SCREENSHOTS_DIR, 'devstore-install-progress.png');
      await page1440.screenshot({ path: outInstall });
      console.log(`Saved ${outInstall}`);
    }

    await page1440.close();
    console.log('--- All Exhaustive Parity Captures Completed Successfully ---');
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

run().catch((err) => {
  console.error('Audit runner error:', err);
  process.exit(1);
});
