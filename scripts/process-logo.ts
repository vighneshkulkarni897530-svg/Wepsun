import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function processLogo() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const srcPath = 'C:/Users/vighn/.gemini/antigravity-ide/brain/70ec42dc-e8b8-472a-9051-2234ec252a26/.user_uploaded/media_1790180788286.jpg';
  const imgBase64 = fs.readFileSync(srcPath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${imgBase64}`;

  // Evaluate canvas processing in browser
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head><style>body { margin: 0; background: transparent; }</style></head>
      <body>
        <canvas id="canvas"></canvas>
        <canvas id="brandCanvas"></canvas>
      </body>
    </html>
  `);

  const result = await page.evaluate(async (imgSrc) => {
    return new Promise<{ transparentShield: string; fullBrandDark: string; fullBrandLight: string }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        // 1. Process Shield with Transparent Background
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Check if pixel is white / off-white
          const brightness = (r + g + b) / 3;
          const minChannel = Math.min(r, g, b);
          
          if (minChannel > 230) {
            // Smooth alpha falloff for antialiasing
            const diff = minChannel - 230;
            const alpha = Math.max(0, 255 - (diff * 10));
            data[i + 3] = alpha;
          } else if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const transparentShield = canvas.toDataURL('image/png');

        // 2. Full Brand Logo (Shield + "WEPSUN ENGINEERING SOLUTION")
        const brandCanvas = document.getElementById('brandCanvas') as HTMLCanvasElement;
        const bWidth = 600;
        const bHeight = 150;
        brandCanvas.width = bWidth;
        brandCanvas.height = bHeight;
        const bCtx = brandCanvas.getContext('2d')!;

        // Draw Shield
        const shieldH = 120;
        const shieldW = (canvas.width / canvas.height) * shieldH;
        bCtx.drawImage(canvas, 15, 15, shieldW, shieldH);

        // Draw Text - Dark Version
        bCtx.fillStyle = '#0b2545';
        bCtx.font = '900 42px "Segoe UI", Inter, Roboto, sans-serif';
        bCtx.fillText('WEPSUN', 15 + shieldW + 20, 62);

        bCtx.fillStyle = '#1e3a8a';
        bCtx.font = 'bold 15px "Segoe UI", Inter, Roboto, sans-serif';
        bCtx.letterSpacing = '4px';
        bCtx.fillText('ENGINEERING SOLUTION', 15 + shieldW + 22, 90);

        // Blue accent bar
        bCtx.fillStyle = '#0088cc';
        bCtx.fillRect(15 + shieldW + 22, 102, 380, 3);

        bCtx.fillStyle = '#0284c7';
        bCtx.font = '600 14px "Segoe UI", Inter, Roboto, sans-serif';
        bCtx.letterSpacing = '1px';
        bCtx.fillText('Smart Lift Service Operations', 15 + shieldW + 22, 124);

        const fullBrandDark = brandCanvas.toDataURL('image/png');

        // Draw Text - Light Version (for dark backgrounds)
        bCtx.clearRect(0, 0, bWidth, bHeight);
        bCtx.drawImage(canvas, 15, 15, shieldW, shieldH);

        bCtx.fillStyle = '#ffffff';
        bCtx.font = '900 42px "Segoe UI", Inter, Roboto, sans-serif';
        bCtx.fillText('WEPSUN', 15 + shieldW + 20, 62);

        bCtx.fillStyle = '#93c5fd';
        bCtx.font = 'bold 15px "Segoe UI", Inter, Roboto, sans-serif';
        bCtx.letterSpacing = '4px';
        bCtx.fillText('ENGINEERING SOLUTION', 15 + shieldW + 22, 90);

        bCtx.fillStyle = '#38bdf8';
        bCtx.fillRect(15 + shieldW + 22, 102, 380, 3);

        bCtx.fillStyle = '#e0f2fe';
        bCtx.font = '600 14px "Segoe UI", Inter, Roboto, sans-serif';
        bCtx.letterSpacing = '1px';
        bCtx.fillText('Smart Lift Service Operations', 15 + shieldW + 22, 124);

        const fullBrandLight = brandCanvas.toDataURL('image/png');

        resolve({ transparentShield, fullBrandDark, fullBrandLight });
      };
      img.src = imgSrc;
    });
  }, dataUri);

  await browser.close();

  const projectRoot = 'd:/WEPSUN ENGINEERING SOLUTION';

  // Save Transparent Shield PNG
  const shieldBuffer = Buffer.from(result.transparentShield.replace(/^data:image\/png;base64,/, ''), 'base64');
  fs.writeFileSync(path.join(projectRoot, 'src/assets/wepsun-shield.png'), shieldBuffer);
  fs.writeFileSync(path.join(projectRoot, 'public/wepsun-shield.png'), shieldBuffer);
  console.log('Saved transparent shield PNGs.');

  // Save Full Brand Logo PNG
  const brandDarkBuffer = Buffer.from(result.fullBrandDark.replace(/^data:image\/png;base64,/, ''), 'base64');
  fs.writeFileSync(path.join(projectRoot, 'src/assets/wepsun-logo.png'), brandDarkBuffer);
  fs.writeFileSync(path.join(projectRoot, 'public/wepsun-logo.png'), brandDarkBuffer);
  console.log('Saved full brand logo PNGs.');

  const brandLightBuffer = Buffer.from(result.fullBrandLight.replace(/^data:image\/png;base64,/, ''), 'base64');
  fs.writeFileSync(path.join(projectRoot, 'src/assets/wepsun-logo-light.png'), brandLightBuffer);
  fs.writeFileSync(path.join(projectRoot, 'public/wepsun-logo-light.png'), brandLightBuffer);
  console.log('Saved full light brand logo PNGs.');

  // Save favicon.svg with the shield SVG rendering
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110" fill="none">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00B4D8"/>
      <stop offset="50%" stop-color="#0077B6"/>
      <stop offset="100%" stop-color="#023E8A"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
  </defs>
  <!-- Shield Frame -->
  <path d="M50 5 L88 20 C88 65 50 105 50 105 C50 105 12 65 12 20 Z" fill="none" stroke="url(#shieldGrad)" stroke-width="7" stroke-linejoin="round"/>
  <!-- Top Roof Triangles -->
  <polygon points="50,14 44,22 56,22" fill="url(#cyanGrad)"/>
  <polygon points="43,23 38,29 48,29" fill="url(#cyanGrad)"/>
  <polygon points="57,23 52,29 62,29" fill="url(#cyanGrad)"/>
  <!-- Elevator Door Pillar with Up Arrows -->
  <rect x="42" y="27" width="7" height="28" fill="none" stroke="url(#shieldGrad)" stroke-width="2"/>
  <rect x="51" y="27" width="7" height="28" fill="none" stroke="url(#shieldGrad)" stroke-width="2"/>
  <path d="M45.5 38 L43 42 H48 Z" fill="url(#shieldGrad)"/>
  <path d="M54.5 38 L52 42 H57 Z" fill="url(#shieldGrad)"/>
  <!-- Bold Wings W -->
  <path d="M18 38 L32 75 L50 42 L68 75 L82 38" fill="none" stroke="url(#shieldGrad)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Perspective Solar Panels / Grid -->
  <path d="M30 84 L50 68 L70 84 L50 99 Z" fill="none" stroke="url(#cyanGrad)" stroke-width="2.5"/>
  <line x1="40" y1="76" x2="60" y2="91.5" stroke="url(#cyanGrad)" stroke-width="2"/>
  <line x1="60" y1="76" x2="40" y2="91.5" stroke="url(#cyanGrad)" stroke-width="2"/>
  <line x1="50" y1="68" x2="50" y2="99" stroke="url(#cyanGrad)" stroke-width="2"/>
</svg>`;

  fs.writeFileSync(path.join(projectRoot, 'public/favicon.svg'), faviconSvg);
  console.log('Saved favicon.svg');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
