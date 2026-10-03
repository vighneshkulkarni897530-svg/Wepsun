import fs from 'fs';
import path from 'path';

const generatedImage = 'C:/Users/vighn/.gemini/antigravity-ide/brain/70ec42dc-e8b8-472a-9051-2234ec252a26/elevator_lobby_1790218422116.jpg';
const destPublic = 'd:/WEPSUN ENGINEERING SOLUTION/public/elevator-lobby.jpg';
const destSrc = 'd:/WEPSUN ENGINEERING SOLUTION/src/assets/elevator-lobby.jpg';

console.log('Checking generated image:', fs.existsSync(generatedImage));
const buf = fs.readFileSync(generatedImage);
console.log('Byte length:', buf.length);

fs.writeFileSync(destPublic, buf);
fs.writeFileSync(destSrc, buf);
console.log('Saved elevator-lobby.jpg to public and src/assets successfully!');
