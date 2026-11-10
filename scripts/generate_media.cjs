const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const assetsDir = path.resolve(__dirname, '../assets');
  const framesDir = path.join(assetsDir, 'frames');
  const screenshotsDir = path.join(assetsDir, 'screenshots');

  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  console.log('Launching headless browser with WebGL...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--window-size=1440,900',
      '--autoplay-policy=no-user-gesture-required'
    ]
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  console.log('Navigating to http://localhost:5175/ ...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Static Screenshot: hero_assembled.png
  console.log('Capturing hero_assembled.png...');
  await page.evaluate(() => {
    const pbrBtn = document.querySelector('[data-render-mode="pbr"]');
    if (pbrBtn) pbrBtn.click();
    const cyanBtn = document.querySelector('[data-theme-key="cyber-cyan"]');
    if (cyanBtn) cyanBtn.click();
    const slider = document.getElementById('manual-explode-slider');
    slider.value = 0;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'hero_assembled.png') });

  // 2. Static Screenshot: exploded_view.png
  console.log('Capturing exploded_view.png...');
  await page.evaluate(() => {
    const slider = document.getElementById('manual-explode-slider');
    slider.value = 100;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'exploded_view.png') });

  // 3. Static Screenshot: acoustic_waves.png
  console.log('Capturing acoustic_waves.png...');
  await page.evaluate(() => {
    const slider = document.getElementById('manual-explode-slider');
    slider.value = 45;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    const audioBtn = document.getElementById('btn-audio-toggle');
    if (audioBtn && !audioBtn.classList.contains('is-playing')) audioBtn.click();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'acoustic_waves.png') });

  // 4. Static Screenshot: xray_mode.png
  console.log('Capturing xray_mode.png...');
  await page.evaluate(() => {
    const audioBtn = document.getElementById('btn-audio-toggle');
    if (audioBtn && audioBtn.classList.contains('is-playing')) audioBtn.click();
    const xrayBtn = document.querySelector('[data-render-mode="xray"]');
    if (xrayBtn) xrayBtn.click();
    const slider = document.getElementById('manual-explode-slider');
    slider.value = 65;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'xray_mode.png') });

  // Restore PBR mode for the teardown sequence
  await page.evaluate(() => {
    const pbrBtn = document.querySelector('[data-render-mode="pbr"]');
    if (pbrBtn) pbrBtn.click();
  });
  await page.waitForTimeout(500);

  // 5. Capture 36-frame smooth teardown loop (0% -> 100% -> 0%)
  console.log('Capturing 36 frames for teardown loop...');
  const totalFrames = 36;
  for (let i = 0; i < totalFrames; i++) {
    const angle = (2 * Math.PI * i) / totalFrames;
    const progress = (1 - Math.cos(angle)) / 2; // Smooth cosine oscillation [0..1]
    const pct = progress * 100;

    await page.evaluate((pctVal) => {
      const slider = document.getElementById('manual-explode-slider');
      slider.value = pctVal.toFixed(1);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }, pct);

    await page.waitForTimeout(70);

    const frameNum = String(i + 1).padStart(3, '0');
    const framePath = path.join(framesDir, `frame_${frameNum}.png`);
    await page.screenshot({ path: framePath });

    if ((i + 1) % 6 === 0) {
      console.log(`  Frame ${i + 1}/${totalFrames} captured (progress: ${pct.toFixed(1)}%)`);
    }
  }

  // Also write frame_000.png as duplicate of frame_001.png just in case ffmpeg starts from 000
  fs.copyFileSync(
    path.join(framesDir, 'frame_001.png'),
    path.join(framesDir, 'frame_000.png')
  );

  await browser.close();
  console.log('All frames and screenshots captured successfully.');
}

main().catch((err) => {
  console.error('Error during media capture:', err);
  process.exit(1);
});
