/**
 * Generate PWA icons for Rinse.
 * Run: node scripts/generate-icons.js
 * Requires: npm install canvas (dev dependency)
 */
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const sizes = [192, 512];
const outputDir = path.join(__dirname, "..", "public");

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const padding = size * 0.15;
  const cornerRadius = size * 0.18;

  // Background: rounded rectangle with green gradient
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(size - cornerRadius, 0);
  ctx.quadraticCurveTo(size, 0, size, cornerRadius);
  ctx.lineTo(size, size - cornerRadius);
  ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
  ctx.lineTo(cornerRadius, size);
  ctx.quadraticCurveTo(0, size, 0, size - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();

  // Gradient fill: #00BB88 -> #0282e5
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#00BB88");
  gradient.addColorStop(1, "#0282e5");
  ctx.fillStyle = gradient;
  ctx.fill();

  // Letter "R"
  const fontSize = size * 0.52;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R", size / 2, size / 2 + size * 0.02);

  return canvas.toBuffer("image/png");
}

function generateFavicon() {
  const size = 32;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const r = 6;

  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#00BB88");
  gradient.addColorStop(1, "#0282e5");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("R", size / 2, size / 2 + 1);

  return canvas.toBuffer("image/png");
}

// Generate icons
for (const size of sizes) {
  const buffer = generateIcon(size);
  const filePath = path.join(outputDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filePath} (${buffer.length} bytes)`);
}

// Generate favicon
const faviconBuffer = generateFavicon();
const faviconPath = path.join(outputDir, "favicon.png");
fs.writeFileSync(faviconPath, faviconBuffer);
console.log(`Generated ${faviconPath} (${faviconBuffer.length} bytes)`);

console.log("Done!");
