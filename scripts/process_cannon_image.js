const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function processCannonImage() {
    const psScript = path.resolve(__dirname, 'process_cannon.ps1');
    console.log(`Executing ${psScript}...`);
    execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, { stdio: 'inherit' });

    const destPng = path.resolve(__dirname, '..', 'assets', 'cannon.png');
    const destFallback = path.resolve(__dirname, '..', 'images', 'cannon.png');
    if (fs.existsSync(destPng)) {
        fs.copyFileSync(destPng, destFallback);
        const stats = fs.statSync(destPng);
        console.log(`Success! Transparent cannon texture created: ${destPng} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
}

if (require.main === module) {
    processCannonImage();
}

module.exports = { processCannonImage };
