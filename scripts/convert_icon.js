const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function convertPngToIco(srcPngPath, destIcoPath) {
    console.log(`Converting ${srcPngPath} -> ${destIcoPath}...`);

    const psScript = `
    Add-Type -AssemblyName System.Drawing;
    $srcPng = '${srcPngPath.replace(/'/g, "''")}';
    $destIco = '${destIcoPath.replace(/'/g, "''")}';
    $src = [System.Drawing.Image]::FromFile($srcPng);

    $sizes = @(256, 128, 64, 48, 32, 16);
    $pngBuffers = @();

    foreach ($sz in $sizes) {
        $bmp = New-Object System.Drawing.Bitmap($sz, $sz);
        $g = [System.Drawing.Graphics]::FromImage($bmp);
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality;
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality;
        $g.DrawImage($src, 0, 0, $sz, $sz);
        
        $ms = New-Object System.IO.MemoryStream;
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png);
        $pngBuffers += ,$ms.ToArray();
        
        $ms.Dispose();
        $g.Dispose();
        $bmp.Dispose();
    }
    $src.Dispose();

    $headerSize = 6;
    $dirEntrySize = 16;
    $offset = $headerSize + ($dirEntrySize * $sizes.Count);

    $fs = New-Object System.IO.FileStream($destIco, [System.IO.FileMode]::Create);
    $bw = New-Object System.IO.BinaryWriter($fs);

    $bw.Write([uint16]0);
    $bw.Write([uint16]1);
    $bw.Write([uint16]$sizes.Count);

    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $sz = $sizes[$i];
        $buf = $pngBuffers[$i];
        
        $wByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz };
        $hByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz };
        
        $bw.Write($wByte);
        $bw.Write($hByte);
        $bw.Write([byte]0);
        $bw.Write([byte]0);
        $bw.Write([uint16]1);
        $bw.Write([uint16]32);
        $bw.Write([uint32]$buf.Length);
        $bw.Write([uint32]$offset);
        
        $offset += $buf.Length;
    }

    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $bw.Write($pngBuffers[$i]);
    }

    $bw.Flush();
    $bw.Close();
    $fs.Close();
    `;

    execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { stdio: 'inherit' });
    console.log(`Successfully generated multi-resolution Windows icon at: ${destIcoPath}`);
}

if (require.main === module) {
    const root = path.resolve(__dirname, '..');
    const pngPath = path.join(root, 'assets', 'icon.png');
    const icoPath = path.join(root, 'assets', 'icon.ico');
    convertPngToIco(pngPath, icoPath);
}

module.exports = { convertPngToIco };
