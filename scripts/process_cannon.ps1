Add-Type -AssemblyName System.Drawing;

$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class CannonProcessor {
    public static void Process(string srcPath, string destPath) {
        using (Bitmap origBmp = (Bitmap)Image.FromFile(srcPath)) {
            int w = origBmp.Width;
            int h = origBmp.Height;

            BitmapData srcData = origBmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int byteCount = Math.Abs(srcData.Stride) * h;
            byte[] srcBytes = new byte[byteCount];
            Marshal.Copy(srcData.Scan0, srcBytes, 0, byteCount);
            origBmp.UnlockBits(srcData);

            byte[] isBg = new byte[w * h];
            int[] queue = new int[w * h];
            int qHead = 0;
            int qTail = 0;
            int bgThreshold = 24;

            for (int x = 0; x < w; x++) {
                int topIdx = x;
                int botIdx = (h - 1) * w + x;
                isBg[topIdx] = 1; queue[qTail++] = topIdx;
                isBg[botIdx] = 1; queue[qTail++] = botIdx;
            }
            for (int y = 0; y < h; y++) {
                int leftIdx = y * w;
                int rightIdx = y * w + (w - 1);
                isBg[leftIdx] = 1; queue[qTail++] = leftIdx;
                isBg[rightIdx] = 1; queue[qTail++] = rightIdx;
            }

            int[] dx = { 1, -1, 0, 0 };
            int[] dy = { 0, 0, 1, -1 };

            while (qHead < qTail) {
                int idx = queue[qHead++];
                int cy = idx / w;
                int cx = idx % w;

                for (int i = 0; i < 4; i++) {
                    int nx = cx + dx[i];
                    int ny = cy + dy[i];
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        int nIdx = ny * w + nx;
                        if (isBg[nIdx] == 0) {
                            int pIdx = nIdx * 4;
                            int maxV = Math.Max(srcBytes[pIdx + 2], Math.Max(srcBytes[pIdx + 1], srcBytes[pIdx]));
                            if (maxV <= bgThreshold) {
                                isBg[nIdx] = 1;
                                queue[qTail++] = nIdx;
                            }
                        }
                    }
                }
            }

            int cropX = 496;
            int cropY = 180;
            int cropW = 1056;
            int cropH = 1620;

            int outW = 528;
            int outH = 810;

            using (Bitmap fullTransparentBmp = new Bitmap(cropW, cropH, PixelFormat.Format32bppArgb)) {
                BitmapData fullData = fullTransparentBmp.LockBits(new Rectangle(0, 0, cropW, cropH), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                byte[] fullBytes = new byte[cropW * cropH * 4];

                for (int cy = 0; cy < cropH; cy++) {
                    int sy = cropY + cy;
                    for (int cx = 0; cx < cropW; cx++) {
                        int sx = cropX + cx;
                        int srcIdx = sy * w + sx;
                        int srcBIdx = srcIdx * 4;

                        int destIdx = cy * cropW + cx;
                        int destBIdx = destIdx * 4;

                        byte b = srcBytes[srcBIdx];
                        byte g = srcBytes[srcBIdx + 1];
                        byte r = srcBytes[srcBIdx + 2];

                        fullBytes[destBIdx] = b;
                        fullBytes[destBIdx + 1] = g;
                        fullBytes[destBIdx + 2] = r;

                        if (isBg[srcIdx] == 1) {
                            fullBytes[destBIdx + 3] = 0;
                        } else {
                            int maxV = Math.Max(r, Math.Max(g, b));
                            bool isEdge = false;
                            if (sx > 0 && isBg[srcIdx - 1] == 1) isEdge = true;
                            else if (sx < w - 1 && isBg[srcIdx + 1] == 1) isEdge = true;
                            else if (sy > 0 && isBg[srcIdx - w] == 1) isEdge = true;
                            else if (sy < h - 1 && isBg[srcIdx + w] == 1) isEdge = true;

                            if (isEdge && maxV < 60) {
                                fullBytes[destBIdx + 3] = (byte)Math.Min(255, Math.Max(0, (maxV - 8) * 6));
                            } else {
                                fullBytes[destBIdx + 3] = 255;
                            }
                        }
                    }
                }

                Marshal.Copy(fullBytes, 0, fullData.Scan0, fullBytes.Length);
                fullTransparentBmp.UnlockBits(fullData);

                using (Bitmap finalBmp = new Bitmap(outW, outH, PixelFormat.Format32bppArgb)) {
                    using (Graphics gfx = Graphics.FromImage(finalBmp)) {
                        gfx.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                        gfx.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
                        gfx.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
                        gfx.DrawImage(fullTransparentBmp, 0, 0, outW, outH);
                    }
                    finalBmp.Save(destPath, ImageFormat.Png);
                }
            }
        }
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies "System.Drawing";

$src = "C:\Users\31328\Pictures\Gemini_Generated_Image_1nyi2r1nyi2r1nyi.jpg";
$dst = "E:\fish-hunter-game\assets\cannon.png";

[CannonProcessor]::Process($src, $dst);
Write-Output "Cannon saved to $dst, Size: $((Get-Item $dst).Length) bytes";
