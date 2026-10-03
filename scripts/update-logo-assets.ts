import fs from 'fs';
import path from 'path';

const uploadedPath = 'C:/Users/vighn/.gemini/antigravity-ide/brain/70ec42dc-e8b8-472a-9051-2234ec252a26/.user_uploaded/media_1790180788286.jpg';
const projectRoot = 'd:/WEPSUN ENGINEERING SOLUTION';

console.log('Checking source file:', uploadedPath);
if (!fs.existsSync(uploadedPath)) {
  console.error('Source file not found!');
  process.exit(1);
}

const buffer = fs.readFileSync(uploadedPath);
console.log(`Read ${buffer.length} bytes from uploaded logo.`);

const destinations = [
  path.join(projectRoot, 'src/assets/wepsun-shield.png'),
  path.join(projectRoot, 'public/wepsun-shield.png'),
  path.join(projectRoot, 'src/assets/wepsun-logo.png'),
  path.join(projectRoot, 'public/wepsun-logo.png'),
];

for (const dest of destinations) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  console.log('Saved logo to:', dest);
}

console.log('Successfully updated logo asset files!');
