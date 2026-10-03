import fs from 'fs';
import path from 'path';

const srcPath = 'C:/Users/vighn/.gemini/antigravity-ide/brain/70ec42dc-e8b8-472a-9051-2234ec252a26/.user_uploaded/media_1790180788286.jpg';
const destPublic = 'd:/WEPSUN ENGINEERING SOLUTION/public';
const destSrc = 'd:/WEPSUN ENGINEERING SOLUTION/src/assets';

console.log('Original image exists:', fs.existsSync(srcPath));
const originalBuf = fs.readFileSync(srcPath);
console.log('Original image byte length:', originalBuf.length);

// Copy EXACT byte-for-byte uploaded image as wepsun-shield.png, wepsun-shield.jpg, wepsun-logo.png
fs.writeFileSync(path.join(destPublic, 'wepsun-shield.png'), originalBuf);
fs.writeFileSync(path.join(destPublic, 'wepsun-shield.jpg'), originalBuf);
fs.writeFileSync(path.join(destSrc, 'wepsun-shield.png'), originalBuf);
fs.writeFileSync(path.join(destSrc, 'wepsun-shield.jpg'), originalBuf);
fs.writeFileSync(path.join(destPublic, 'wepsun-logo.png'), originalBuf);
fs.writeFileSync(path.join(destSrc, 'wepsun-logo.png'), originalBuf);
console.log('Copied exact original image to public and src/assets!');
