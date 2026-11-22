const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

async function generateIcons(base = path.resolve(__dirname, '..')) {
  const source = path.join(base, 'public/app-icon.png');
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size, { fit: 'contain', background: '#00000000' }).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index] === 256 ? 0 : sizes[index];
    header[entry + 1] = header[entry];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  fs.mkdirSync(path.join(base, 'build'), { recursive: true });
  const ico = Buffer.concat([header, ...images]);
  fs.writeFileSync(path.join(base, 'build/icon.ico'), ico);
  fs.writeFileSync(path.join(base, 'public/favicon.ico'), ico);
}
module.exports = generateIcons;
if (require.main === module) generateIcons().catch(error => { console.error(error.message); process.exitCode = 1; });
