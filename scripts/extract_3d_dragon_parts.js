const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:/Users/31328/.gemini/antigravity/brain/ea1a7f2b-4983-4ee3-9ecd-0f158960a196';
const imagesDir = path.join(__dirname, '..', 'images');

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 1000,
        show: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    await win.loadURL('about:blank');

    const result = await win.webContents.executeJavaScript(`
        (async () => {
            const loadImage = (src) => new Promise(r => {
                const img = new Image();
                img.onload = () => r(img);
                img.src = src;
            });

            const fs = require('fs');
            const toDataURL = (relPath) => {
                const b = fs.readFileSync(relPath);
                return 'data:image/png;base64,' + b.toString('base64');
            };

            const dragonImg = await loadImage(toDataURL('images/boss_dragon.png'));
            const phantomImg = await loadImage(toDataURL('images/boss_phantom_dragon.png'));

            const outputs = {};
            const getB64 = (c) => c.toDataURL('image/png').replace(/^data:image\\/png;base64,/, '');

            const buildDragonAssets = (srcImg, prefix, isPhantom) => {
                // ==========================================
                // 1. 神龙宝珠 (boss_*_pearl.png: 180 x 180)
                // ==========================================
                {
                    const c = document.createElement('canvas');
                    c.width = 180; c.height = 180;
                    const ctx = c.getContext('2d');
                    const cx = 90, cy = 90;

                    // A. 外层柔和日冕光晕 (Soft Outer Corona)
                    const corona = ctx.createRadialGradient(cx, cy, 30, cx, cy, 88);
                    if (isPhantom) {
                        corona.addColorStop(0, 'rgba(0, 229, 255, 0.7)');
                        corona.addColorStop(0.4, 'rgba(0, 145, 234, 0.35)');
                        corona.addColorStop(0.8, 'rgba(1, 87, 155, 0.15)');
                        corona.addColorStop(1, 'rgba(1, 87, 155, 0)');
                    } else {
                        corona.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
                        corona.addColorStop(0.4, 'rgba(255, 109, 0, 0.4)');
                        corona.addColorStop(0.8, 'rgba(213, 0, 0, 0.15)');
                        corona.addColorStop(1, 'rgba(213, 0, 0, 0)');
                    }
                    ctx.fillStyle = corona;
                    ctx.fillRect(0, 0, 180, 180);

                    // B. 采样口中纯净火球核心 (避免采样到牙齿，采样半径 45px)
                    const coreTemp = document.createElement('canvas');
                    coreTemp.width = 100; coreTemp.height = 100;
                    const cCtx = coreTemp.getContext('2d');
                    // 龙嘴火球中心在 (706, 628)
                    cCtx.drawImage(srcImg, 706 - 50, 628 - 50, 100, 100, 0, 0, 100, 100);

                    // 径向羽化纯火球边缘
                    const imgData = cCtx.getImageData(0, 0, 100, 100);
                    const d = imgData.data;
                    for (let y = 0; y < 100; y++) {
                        for (let x = 0; x < 100; x++) {
                            const idx = (y * 100 + x) * 4;
                            const dist = Math.hypot(x - 50, y - 50);
                            if (dist > 45) {
                                d[idx + 3] = 0;
                            } else if (dist > 30) {
                                d[idx + 3] = Math.round(d[idx + 3] * ((45 - dist) / 15));
                            }
                        }
                    }
                    cCtx.putImageData(imgData, 0, 0);

                    // 绘制纯火球核心到中心 (放大至 110px 气势恢宏)
                    ctx.drawImage(coreTemp, cx - 55, cy - 55, 110, 110);

                    // C. 核心白炽耀斑点
                    const coreGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
                    coreGlow.addColorStop(0, '#ffffff');
                    coreGlow.addColorStop(0.4, isPhantom ? 'rgba(224, 247, 250, 0.95)' : 'rgba(255, 249, 196, 0.95)');
                    coreGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.fillStyle = coreGlow;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
                    ctx.fill();

                    // D. 旋转星环与护法灵珠
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(-0.35);
                    ctx.strokeStyle = isPhantom ? '#00e5ff' : '#ffd54f';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = isPhantom ? '#00b0ff' : '#ffb300';
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 68, 22, 0, 0, Math.PI * 2);
                    ctx.stroke();

                    for (let r = 0; r < 4; r++) {
                        const a = r * (Math.PI / 2);
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(Math.cos(a) * 68, Math.sin(a) * 22, 4.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();

                    // 最终羽化清除画布边界，确保无硬边
                    const finData = ctx.getImageData(0, 0, 180, 180);
                    const fd = finData.data;
                    for (let y = 0; y < 180; y++) {
                        for (let x = 0; x < 180; x++) {
                            const idx = (y * 180 + x) * 4;
                            const dist = Math.hypot(x - cx, y - cy);
                            if (dist > 88) {
                                fd[idx + 3] = 0;
                            } else if (dist > 74) {
                                fd[idx + 3] = Math.round(fd[idx + 3] * ((88 - dist) / 14));
                            }
                        }
                    }
                    ctx.putImageData(finData, 0, 0);

                    outputs[prefix + '_pearl'] = getB64(c);
                }

                // ==========================================
                // 2. 真实 3D 龙身节段 (boss_*_body.png: 180 x 150)
                // ==========================================
                {
                    const segW = 180, segH = 150;
                    const c = document.createElement('canvas');
                    c.width = segW; c.height = segH;
                    const ctx = c.getContext('2d');
                    const cx = segW / 2, cy = segH / 2;

                    // 截取脖颈真实 3D 鳞片
                    const rawSeg = document.createElement('canvas');
                    rawSeg.width = 180; rawSeg.height = 180;
                    const rCtx = rawSeg.getContext('2d');
                    rCtx.drawImage(srcImg, 185, 715, 190, 190, 0, 0, 180, 180);

                    // 旋转 90 度，背部朝上，腹部朝下
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(rawSeg, -90, -90, 180, 180);
                    ctx.restore();

                    // 椭圆羽化平滑过渡：确保连续叠加时 100% 顺滑饱满
                    const imgData = ctx.getImageData(0, 0, segW, segH);
                    const d = imgData.data;
                    for (let y = 0; y < segH; y++) {
                        for (let x = 0; x < segW; x++) {
                            const idx = (y * segW + x) * 4;
                            const dx = (x - cx) / (segW * 0.46);
                            const dy = (y - cy) / (segH * 0.46);
                            const dist = Math.hypot(dx, dy);

                            if (dist > 1.0) {
                                d[idx + 3] = 0;
                            } else if (dist > 0.68) {
                                const factor = (1.0 - dist) / 0.32;
                                d[idx + 3] = Math.round(d[idx + 3] * factor);
                            }
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);

                    outputs[prefix + '_body'] = getB64(c);
                }

                // ==========================================
                // 3. 真实 3D 龙尾金焰/冥焰 (boss_*_tail.png: 280 x 200)
                // ==========================================
                {
                    const tailW = 280, tailH = 200;
                    const c = document.createElement('canvas');
                    c.width = tailW; c.height = tailH;
                    const ctx = c.getContext('2d');

                    // 截取 mane 飘逸金焰
                    const maneCanvas = document.createElement('canvas');
                    maneCanvas.width = 240; maneCanvas.height = 240;
                    const mCtx = maneCanvas.getContext('2d');
                    mCtx.drawImage(srcImg, 10, 370, 250, 250, 0, 0, 240, 240);

                    // 绘制到画布，尾焰向左流淌
                    ctx.save();
                    ctx.translate(tailW * 0.75, tailH * 0.5);
                    ctx.drawImage(maneCanvas, -240, -120, 240, 240);
                    ctx.restore();

                    // 全方位柔和边缘羽化，彻底消除任何直切面
                    const imgData = ctx.getImageData(0, 0, tailW, tailH);
                    const d = imgData.data;
                    for (let y = 0; y < tailH; y++) {
                        for (let x = 0; x < tailW; x++) {
                            const idx = (y * tailW + x) * 4;
                            let alphaMul = 1.0;

                            // 右侧连接处平滑渐隐
                            if (x > 130) {
                                alphaMul *= Math.max(0, 1 - (x - 130) / 75);
                            }
                            // 顶部边缘平滑渐隐
                            if (y < 28) {
                                alphaMul *= Math.max(0, y / 28);
                            }
                            // 底部边缘平滑渐隐
                            if (y > tailH - 28) {
                                alphaMul *= Math.max(0, (tailH - y) / 28);
                            }

                            d[idx + 3] = Math.round(d[idx + 3] * alphaMul);
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);

                    outputs[prefix + '_tail'] = getB64(c);
                }

                // ==========================================
                // 4. 真实 3D 霸气五爪龙足 (boss_*_claw.png: 220 x 200)
                // ==========================================
                {
                    const clawW = 220, clawH = 200;
                    const c = document.createElement('canvas');
                    c.width = clawW; c.height = clawH;
                    const ctx = c.getContext('2d');

                    ctx.save();
                    ctx.shadowColor = isPhantom ? 'rgba(0, 229, 255, 0.85)' : 'rgba(255, 111, 0, 0.85)';
                    ctx.shadowBlur = 14;

                    // A. 粗壮龙腿肌肉上肢 (Muscular Dragon Leg)
                    const limbGrad = ctx.createLinearGradient(20, 10, 110, 110);
                    if (isPhantom) {
                        limbGrad.addColorStop(0, '#1c2833');
                        limbGrad.addColorStop(0.3, '#37474f');
                        limbGrad.addColorStop(0.65, '#90a4ae');
                        limbGrad.addColorStop(1, '#eceff1');
                    } else {
                        limbGrad.addColorStop(0, '#872300');
                        limbGrad.addColorStop(0.3, '#d84315');
                        limbGrad.addColorStop(0.65, '#ffb300');
                        limbGrad.addColorStop(1, '#ffe082');
                    }
                    ctx.fillStyle = limbGrad;

                    ctx.beginPath();
                    ctx.moveTo(15, 15);
                    ctx.quadraticCurveTo(60, 10, 95, 45);
                    ctx.quadraticCurveTo(125, 78, 120, 112);
                    ctx.quadraticCurveTo(95, 126, 75, 96);
                    ctx.quadraticCurveTo(45, 65, 12, 42);
                    ctx.closePath();
                    ctx.fill();

                    // B. 龙腿覆盖金鳞 / 骨甲 (3D Scales along leg)
                    for (let i = 0; i < 5; i++) {
                        const px = 38 + i * 16;
                        const py = 32 + i * 16;
                        ctx.strokeStyle = isPhantom ? '#00e5ff' : '#fff9c4';
                        ctx.lineWidth = 2.4;
                        ctx.beginPath();
                        ctx.arc(px, py, 12, 0.2, Math.PI * 0.85);
                        ctx.stroke();

                        ctx.strokeStyle = isPhantom ? '#37474f' : '#b74200';
                        ctx.lineWidth = 1.2;
                        ctx.beginPath();
                        ctx.arc(px + 1, py + 1, 13, 0.2, Math.PI * 0.85);
                        ctx.stroke();
                    }

                    // C. 掌骨关节神圣金焰 / 冥火
                    const wristGrad = ctx.createRadialGradient(120, 112, 2, 120, 112, 28);
                    if (isPhantom) {
                        wristGrad.addColorStop(0, '#ffffff');
                        wristGrad.addColorStop(0.4, '#00e5ff');
                        wristGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
                    } else {
                        wristGrad.addColorStop(0, '#ffffff');
                        wristGrad.addColorStop(0.4, '#ff9100');
                        wristGrad.addColorStop(1, 'rgba(255, 109, 0, 0)');
                    }
                    ctx.fillStyle = wristGrad;
                    ctx.beginPath();
                    ctx.arc(120, 112, 28, 0, Math.PI * 2);
                    ctx.fill();

                    // D. 5 根弯曲如鹰隼巨钩的霸气象牙龙爪 (5 Organic Curved Dragon Talons)
                    const clawDefs = [
                        { angle: -0.72, len: 68, w: 12, curve: 18 },
                        { angle: -0.32, len: 82, w: 14, curve: 22 },
                        { angle: 0.12,  len: 78, w: 13.5, curve: 20 },
                        { angle: 0.54,  len: 66, w: 12, curve: 16 },
                        { angle: 0.98,  len: 52, w: 10, curve: 12 }
                    ];

                    for (const def of clawDefs) {
                        ctx.save();
                        ctx.translate(120, 112);
                        ctx.rotate(def.angle);

                        // 弯钩形鹰爪刀刃 (Hooked Talon Curve)
                        const tGrad = ctx.createLinearGradient(0, -def.w * 0.5, def.len, def.curve);
                        if (isPhantom) {
                            tGrad.addColorStop(0, '#546e7a');
                            tGrad.addColorStop(0.35, '#b0bec5');
                            tGrad.addColorStop(0.75, '#e0f7fa');
                            tGrad.addColorStop(1, '#ffffff');
                        } else {
                            tGrad.addColorStop(0, '#ff6f00');
                            tGrad.addColorStop(0.35, '#ffd54f');
                            tGrad.addColorStop(0.75, '#fff9c4');
                            tGrad.addColorStop(1, '#ffffff');
                        }
                        ctx.fillStyle = tGrad;

                        ctx.beginPath();
                        ctx.moveTo(0, -def.w * 0.5);
                        ctx.quadraticCurveTo(def.len * 0.55, -def.w * 0.2 + def.curve * 0.3, def.len, def.curve);
                        ctx.quadraticCurveTo(def.len * 0.5, def.w * 0.8 + def.curve * 0.7, 0, def.w * 0.5);
                        ctx.closePath();
                        ctx.fill();

                        // 爪尖锋锐反光脊线
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.8;
                        ctx.beginPath();
                        ctx.moveTo(0, -def.w * 0.2);
                        ctx.quadraticCurveTo(def.len * 0.55, -def.w * 0.1 + def.curve * 0.3, def.len, def.curve);
                        ctx.stroke();

                        ctx.restore();
                    }

                    ctx.restore();
                    outputs[prefix + '_claw'] = getB64(c);
                }
            };

            buildDragonAssets(dragonImg, 'boss_dragon', false);
            buildDragonAssets(phantomImg, 'boss_phantom', true);

            return outputs;
        })()
    `);

    for (const [key, b64] of Object.entries(result)) {
        const filePath = path.join(imagesDir, `${key}.png`);
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
        console.log(`Saved: ${filePath}`);

        const artPath = path.join(brainDir, `${key}.png`);
        fs.writeFileSync(artPath, Buffer.from(b64, 'base64'));
    }

    console.log('All refined 3D dragon components generated successfully!');
    process.exit(0);
});
