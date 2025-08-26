#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple SVG to create basic icons
const createSVGIcon = (size, text, bgColor, textColor) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.floor(size/4)}" 
        font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${textColor}">
    ${text}
  </text>
</svg>`.trim();

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate basic icon (1024x1024 for app icon)
const iconSVG = createSVGIcon(1024, 'T', '#6366f1', '#ffffff');
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSVG);

// Generate adaptive icon (1024x1024)
const adaptiveIconSVG = createSVGIcon(1024, 'T', '#6366f1', '#ffffff');
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.svg'), adaptiveIconSVG);

// Generate splash screen (1284x2778 for iPhone 14 Pro Max)
const splashSVG = `
<svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="#000000"/>
  <circle cx="642" cy="1389" r="100" fill="#6366f1"/>
  <text x="642" y="1600" font-family="Arial, sans-serif" font-size="48" 
        font-weight="bold" text-anchor="middle" fill="#ffffff">
    Takaka
  </text>
</svg>`.trim();
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splashSVG);

console.log('✅ Basic assets generated successfully!');
console.log('📝 Note: These are temporary SVG assets for development.');
console.log('🎨 Replace with proper PNG assets for production builds.');

// If sharp is available, convert to PNG
try {
  const sharp = require('sharp');
  
  // Convert icon to PNG
  sharp(Buffer.from(iconSVG))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'))
    .then(() => console.log('✅ icon.png generated'));
    
  // Convert adaptive icon to PNG  
  sharp(Buffer.from(adaptiveIconSVG))
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'))
    .then(() => console.log('✅ adaptive-icon.png generated'));
    
  // Convert splash to PNG
  sharp(Buffer.from(splashSVG))
    .png()
    .toFile(path.join(assetsDir, 'splash.png'))
    .then(() => console.log('✅ splash.png generated'));
    
} catch (e) {
  console.log('ℹ️  Sharp not available - using SVG assets');
  console.log('💡 Install sharp for PNG conversion: npm install sharp --save-dev');
}

