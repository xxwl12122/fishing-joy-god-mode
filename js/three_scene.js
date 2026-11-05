/**
 * 捕鱼达人 - Three.js 3D 第一人称海底场景系统
 * 1. 完整海底 3D 场景：深海体积指数雾 (FogExp2)、环境光、丁达尔日光束与深海探照灯
 * 2. 3D 海底地形、古代沉船遗迹石柱、摇曳海草与上升水泡微粒
 * 3. 几何体组合 3D 游动鱼群 (小丑鱼、黄金鲨、巨型发光水母、远古金龙 BOSS 24节3D游龙)
 * 4. 第一人称视角 (FPP)，屏幕中央准星锁定，全方位鼠标自由旋转视角 (WASD 自由潜泳)
 * 5. 光线投射 (Raycaster) 与 3D 能量炮弹物理弹道，击中 BOSS 联动 AI 暴躁吐槽
 */

class DeepSea3DScene {
    constructor() {
        this.isActive = false;
        this.container = null;
        this.canvas = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.raycaster = null;

        // 视角旋转与第一人称控制
        this.isPointerLocked = false;
        this.yaw = 0;
        this.pitch = 0;
        this.moveSpeed = 1.6;
        this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
        this.isMouseDown = false;
        this.prevMousePos = { x: 0, y: 0 };

        // 3D 场景实体
        this.fishes = [];
        this.projectiles = [];
        this.hitSparks = [];
        this.bubbles = null;
        this.seaweeds = [];
        this.boss3D = null;

        // 时钟
        this.lastTime = performance.now();
        this.elapsedTime = 0;
        this.animFrameId = null;

        this.initDOM();
    }

    initDOM() {
        // 创建 3D Canvas 容器
        let container = document.getElementById('three-canvas-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'three-canvas-container';
            container.innerHTML = `<canvas id="three-canvas"></canvas>`;
            document.body.appendChild(container);
        }
        this.container = container;
        this.canvas = document.getElementById('three-canvas');

        // 创建屏幕中央准星
        let crosshair = document.getElementById('crosshair');
        if (!crosshair) {
            crosshair = document.createElement('div');
            crosshair.id = 'crosshair';
            crosshair.innerHTML = `
                <div class="crosshair-circle"></div>
                <div class="crosshair-dot"></div>
                <div class="crosshair-line top"></div>
                <div class="crosshair-line bottom"></div>
                <div class="crosshair-line left"></div>
                <div class="crosshair-line right"></div>
            `;
            document.body.appendChild(crosshair);
        }
        this.crosshair = crosshair;

        // 创建第一人称操作提示横条
        let fpsHint = document.getElementById('fps-hint-badge');
        if (!fpsHint) {
            fpsHint = document.createElement('div');
            fpsHint.id = 'fps-hint-badge';
            fpsHint.className = 'fps-hint-badge';
            fpsHint.innerHTML = `🎮 <b>3D深海模式</b> | 鼠标自由环顾 | [左键] 发射穿甲鱼雷 | [WASD/空格/Shift] 自由潜泳 | 按 [V] 或点击右上方切换 2D`;
            document.body.appendChild(fpsHint);
        }
        this.fpsHint = fpsHint;

        this.initToggleBtn();
    }

    // 在右上角功能按钮栏注入 3D/2D 切换按钮
    initToggleBtn() {
        const topControls = document.querySelector('.top-controls') || document.querySelector('.header-right');
        if (topControls && !document.getElementById('btn-3d-toggle')) {
            const btn = document.createElement('button');
            btn.id = 'btn-3d-toggle';
            btn.className = 'ctrl-btn view-switch-btn';
            btn.title = '切换 3D 第一人称 / 2D 街机视角 (快捷键: V)';
            btn.innerHTML = `🥽 3D视角`;
            btn.onclick = () => this.toggle();
            topControls.prepend(btn);
        }

        // 键盘 V 键切换
        window.addEventListener('keydown', (e) => {
            if (e.key === 'v' || e.key === 'V') {
                this.toggle();
            }
        });
    }

    // 切换 2D / 3D 视角
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    // 启动 3D 海底世界
    activate() {
        if (typeof THREE === 'undefined') {
            console.error('[3D Scene] Three.js not loaded!');
            return;
        }

        this.isActive = true;
        this.container.style.display = 'block';
        this.crosshair.classList.add('active');
        this.fpsHint.style.display = 'block';

        const btn = document.getElementById('btn-3d-toggle');
        if (btn) btn.innerHTML = `🎮 返回2D`;

        if (!this.renderer) {
            this.initThree();
        } else {
            this.resize();
        }

        this.bindEvents();
        this.startLoop();

        // 播报初始欢迎与吐槽
        if (window.aiBoss) {
            window.aiBoss.speakTaunt('进入本王的深海领域，准备受死吧！');
            window.aiBoss.showBubble('远古金龙 (BOSS)', '进入本王的深海领域，准备受死吧！');
        }
    }

    // 返回 2D 街机模式
    deactivate() {
        this.isActive = false;
        this.container.style.display = 'none';
        this.crosshair.classList.remove('active');
        this.fpsHint.style.display = 'none';

        if (document.pointerLockElement) {
            document.exitPointerLock();
        }

        const btn = document.getElementById('btn-3d-toggle');
        if (btn) btn.innerHTML = `🥽 3D视角`;

        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    // 初始化 Three.js 核心管线
    initThree() {
        const width = window.innerWidth || 1280;
        const height = window.innerHeight || 720;

        // 1. 场景与水下指数体积雾 (调优深海通透度)
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x011425);
        this.scene.fog = new THREE.FogExp2(0x011425, 0.0038);

        // 2. 第一人称相机
        this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1500);
        this.camera.position.set(0, 15, 60);
        this.yaw = 0;
        this.pitch = 0;
        this.updateCameraRotation();

        // 3. WebGL 硬件渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        // 4. 光线投射器 (射线检测中心点瞄准)
        this.raycaster = new THREE.Raycaster();
        this.lastTime = performance.now();
        this.elapsedTime = 0;

        // 5. 构建水下光影体系
        this.setupLighting();

        // 6. 构建水下地形、沉船废墟与环境
        this.setupEnvironment();

        // 7. 构建水底海草与上升气泡
        this.setupSeaweedsAndBubbles();

        // 8. 填充 3D 鱼群生态与远古金龙 BOSS
        this.spawn3DFishEcosystem();
    }

    // 水下光影体系 (全景环境反射 + 潜水头灯 + 丁达尔神光)
    setupLighting() {
        // 1. 半球环境光 (天空深青，海底深蓝反弹光)
        const hemiLight = new THREE.HemisphereLight(0x80deea, 0x052642, 2.0);
        this.scene.add(hemiLight);

        // 2. 基础环境散射光
        const ambientLight = new THREE.AmbientLight(0x155b88, 1.6);
        this.scene.add(ambientLight);

        // 3. 水面穿透日光 (阳光斜射丁达尔效果)
        const sunLight = new THREE.DirectionalLight(0xa7ffeb, 2.8);
        sunLight.position.set(30, 160, 50);
        this.scene.add(sunLight);

        // 4. 玩家第一人称前置探照头灯 (跟随准星方向投射，确保眼前游鱼金光夺目)
        const headLight = new THREE.DirectionalLight(0xffffff, 2.2);
        headLight.position.set(0, 0, 1);
        this.camera.add(headLight);

        // 5. 紧随相机的点光源光晕
        this.flashlight = new THREE.PointLight(0x00e5ff, 3.5, 180);
        this.camera.add(this.flashlight);
        this.scene.add(this.camera);
    }

    // 水下地形与亚特兰蒂斯沉船遗迹石柱
    setupEnvironment() {
        // 海底平原
        const seabedGeo = new THREE.PlaneGeometry(1200, 1200, 48, 48);
        seabedGeo.rotateX(-Math.PI / 2);

        // 凹凸起伏沙丘
        const pos = seabedGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vz = pos.getZ(i);
            const d = Math.sin(vx * 0.02) * Math.cos(vz * 0.02) * 8 + Math.sin(vx * 0.06 + vz * 0.05) * 3;
            pos.setY(i, d - 40);
        }
        seabedGeo.computeVertexNormals();

        const seabedMat = new THREE.MeshStandardMaterial({
            color: 0x052642,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        const seabed = new THREE.Mesh(seabedGeo, seabedMat);
        this.scene.add(seabed);

        // 散落古遗迹石柱与巨石
        const pillarGeo = new THREE.CylinderGeometry(4, 5, 55, 12);
        const pillarMat = new THREE.MeshStandardMaterial({
            color: 0x083353,
            roughness: 0.85,
            metalness: 0.15
        });

        for (let i = 0; i < 22; i++) {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 240;
            pillar.position.set(Math.cos(angle) * dist, -15, Math.sin(angle) * dist);
            pillar.rotation.z = (Math.random() - 0.5) * 0.35;
            pillar.rotation.x = (Math.random() - 0.5) * 0.35;
            const s = 0.7 + Math.random() * 0.9;
            pillar.scale.set(s, s, s);
            this.scene.add(pillar);
        }
    }

    // 3D 摇曳海草与上升水泡微粒
    setupSeaweedsAndBubbles() {
        // 1. 海草
        const seaweedMat = new THREE.MeshStandardMaterial({
            color: 0x00e676,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < 40; i++) {
            const h = 25 + Math.random() * 30;
            const geo = new THREE.CylinderGeometry(0.3, 1.8, h, 6);
            const mesh = new THREE.Mesh(geo, seaweedMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 220;
            mesh.position.set(Math.cos(angle) * dist, -40 + h * 0.5, Math.sin(angle) * dist);
            mesh.userData = {
                phase: Math.random() * Math.PI * 2,
                speed: 1.5 + Math.random() * 1.5,
                initRotZ: (Math.random() - 0.5) * 0.2
            };
            this.seaweeds.push(mesh);
            this.scene.add(mesh);
        }

        // 2. 上升水泡粒子系统
        const bubbleCount = 280;
        const bubbleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(bubbleCount * 3);
        const speeds = new Float32Array(bubbleCount);

        for (let i = 0; i < bubbleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 360;
            positions[i * 3 + 1] = -40 + Math.random() * 140;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 360;
            speeds[i] = 0.3 + Math.random() * 0.6;
        }

        bubbleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.bubbleSpeeds = speeds;

        // 生成发光气泡圆形贴图
        const bubbleCanvas = document.createElement('canvas');
        bubbleCanvas.width = 32;
        bubbleCanvas.height = 32;
        const bctx = bubbleCanvas.getContext('2d');
        const grad = bctx.createRadialGradient(16, 16, 2, 16, 16, 15);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.6, 'rgba(0, 229, 255, 0.6)');
        grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        bctx.fillStyle = grad;
        bctx.fillRect(0, 0, 32, 32);
        const bubbleTexture = new THREE.CanvasTexture(bubbleCanvas);

        const bubbleMat = new THREE.PointsMaterial({
            size: 2.8,
            map: bubbleTexture,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.bubbles = new THREE.Points(bubbleGeo, bubbleMat);
        this.scene.add(this.bubbles);
    }

    // 构建几何体 3D 鱼群生态与 3D 远古金龙 BOSS
    spawn3DFishEcosystem() {
        // 清理旧实体
        this.fishes.forEach(f => this.scene.remove(f.group));
        this.fishes = [];

        const addFish = (fish) => {
            this.scene.add(fish.group);
            this.fishes.push(fish);
            return fish;
        };

        // 1. 小丑鱼群 (Clownfish)
        for (let i = 0; i < 18; i++) {
            addFish(this.createClownfish());
        }

        // 2. 黄金蝠鲼 (Manta Ray)
        for (let i = 0; i < 4; i++) {
            addFish(this.createMantaRay());
        }

        // 3. 巨型深海发光水母 (Jellyfish)
        for (let i = 0; i < 6; i++) {
            addFish(this.createJellyfish());
        }

        // 4. 黄金巨鲨 (Shark)
        for (let i = 0; i < 3; i++) {
            addFish(this.createShark());
        }

        // 5. 史诗级 3D 远古五爪金龙 BOSS (多段动态游龙)
        this.boss3D = addFish(this.createDragonBoss());
    }

    // 3D 小丑鱼组合模型
    createClownfish() {
        const group = new THREE.Group();

        // 鱼身 (拉长椭球体)
        const bodyGeo = new THREE.SphereGeometry(1.6, 16, 12);
        bodyGeo.scale(1.8, 1.0, 0.45);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0x441100,
            emissiveIntensity: 0.35,
            roughness: 0.3,
            metalness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // 经典白色斑纹
        const stripeGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.6, 16, 1, true);
        stripeGeo.scale(1.0, 0.9, 0.48);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(-0.2, 0, 0);
        group.add(stripe);

        // 鱼眼
        const eyeGeo = new THREE.SphereGeometry(0.22, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(1.5, 0.2, 0.35);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(1.5, 0.2, -0.35);
        group.add(eyeL);
        group.add(eyeR);

        // 尾鳍 (可摆动)
        const tailGeo = new THREE.ConeGeometry(0.9, 1.5, 3);
        tailGeo.rotateZ(Math.PI / 2);
        tailGeo.scale(0.2, 1.2, 1.0);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-2.8, 0, 0);
        group.add(tail);

        group.scale.set(2.4, 2.4, 2.4);

        const startRadius = 20 + Math.random() * 45;
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 2.2;
        const baseY = 5 + Math.random() * 25;
        group.position.set(
            Math.cos(angle) * startRadius,
            baseY,
            Math.sin(angle) * startRadius + 5
        );

        return {
            group,
            tail,
            type: 'clownfish',
            name: '热带小丑鱼',
            hp: 25,
            maxHp: 25,
            score: 15,
            speed: 0.5 + Math.random() * 0.35,
            angle,
            radius: startRadius,
            baseY,
            swimPhase: Math.random() * 10
        };
    }

    // 3D 黄金蝠鲼 (Manta Ray)
    createMantaRay() {
        const group = new THREE.Group();

        // 菱形翼身
        const bodyGeo = new THREE.ConeGeometry(4.5, 6.0, 4);
        bodyGeo.rotateY(Math.PI / 4);
        bodyGeo.scale(1.8, 0.15, 1.0);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xffb300,
            roughness: 0.3,
            metalness: 0.6
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // 细长尾巴
        const tailGeo = new THREE.CylinderGeometry(0.12, 0.25, 8, 6);
        tailGeo.rotateX(Math.PI / 2);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(0, 0, -5.5);
        group.add(tail);

        const radius = 70 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        group.position.set(Math.cos(angle) * radius, 0 + Math.random() * 30, Math.sin(angle) * radius);

        return {
            group,
            type: 'manta',
            name: '金光蝠鲼',
            hp: 80,
            maxHp: 80,
            score: 60,
            speed: 0.35 + Math.random() * 0.2,
            angle,
            radius,
            swimPhase: Math.random() * 10
        };
    }

    // 3D 深海发光水母
    createJellyfish() {
        const group = new THREE.Group();

        // 水母伞帽 (半球体 + 半透明高光发光)
        const domeGeo = new THREE.SphereGeometry(3.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const domeMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x0066aa,
            roughness: 0.2,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, 0, 0);
        group.add(dome);

        // 触须
        const tentacleMat = new THREE.MeshBasicMaterial({ color: 0x80deea, transparent: true, opacity: 0.5 });
        const tentacles = [];
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const tGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 4);
            const t = new THREE.Mesh(tGeo, tentacleMat);
            t.position.set(Math.cos(a) * 2.2, -3.2, Math.sin(a) * 2.2);
            group.add(t);
            tentacles.push(t);
        }

        const radius = 50 + Math.random() * 110;
        const angle = Math.random() * Math.PI * 2;
        group.position.set(Math.cos(angle) * radius, -10 + Math.random() * 50, Math.sin(angle) * radius);

        return {
            group,
            dome,
            tentacles,
            type: 'jellyfish',
            name: '幽蓝发光水母',
            hp: 60,
            maxHp: 60,
            score: 40,
            speed: 0.2 + Math.random() * 0.15,
            angle,
            radius,
            swimPhase: Math.random() * 10
        };
    }

    // 3D 黄金巨鲨
    createShark() {
        const group = new THREE.Group();

        // 梭形流线鲨身
        const bodyGeo = new THREE.ConeGeometry(2.8, 12, 16);
        bodyGeo.rotateZ(-Math.PI / 2);
        bodyGeo.scale(1.0, 1.2, 0.65);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0x664400,
            emissiveIntensity: 0.45,
            roughness: 0.25,
            metalness: 0.5
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // 标志性背鳍
        const dorsalGeo = new THREE.ConeGeometry(1.2, 3.2, 4);
        dorsalGeo.scale(0.3, 1.0, 1.5);
        dorsalGeo.rotateZ(0.3);
        const dorsal = new THREE.Mesh(dorsalGeo, bodyMat);
        dorsal.position.set(0.5, 2.5, 0);
        group.add(dorsal);

        // 尾鳍
        const tailGeo = new THREE.ConeGeometry(1.8, 3.5, 4);
        tailGeo.scale(0.2, 1.4, 0.8);
        const tail = new THREE.Mesh(tailGeo, bodyMat);
        tail.position.set(-6.5, 0, 0);
        group.add(tail);

        group.scale.set(2.2, 2.2, 2.2);

        const radius = 35 + Math.random() * 40;
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.5;
        const baseY = 8 + Math.random() * 22;
        group.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius + 5);

        return {
            group,
            tail,
            type: 'shark',
            name: '深海黄金巨鲨',
            hp: 220,
            maxHp: 220,
            score: 180,
            speed: 0.65 + Math.random() * 0.25,
            angle,
            radius,
            baseY,
            swimPhase: Math.random() * 10
        };
    }

    // 3D 史诗级远古五爪金龙 BOSS (多节游龙动力学)
    createDragonBoss() {
        const group = new THREE.Group();

        // 龙角与龙首
        const headGeo = new THREE.ConeGeometry(4.2, 9.5, 12);
        headGeo.rotateZ(-Math.PI / 2);
        headGeo.scale(1.0, 1.1, 0.8);
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0x885500,
            emissiveIntensity: 0.55,
            roughness: 0.2,
            metalness: 0.5
        });
        const head = new THREE.Mesh(headGeo, goldMat);
        head.position.set(4, 0, 0);
        group.add(head);

        // 摄魂龙眼 (猩红血光)
        const eyeGeo = new THREE.SphereGeometry(0.75, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(6.5, 1.5, 1.8);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(6.5, 1.5, -1.8);
        group.add(eyeL);
        group.add(eyeR);

        // 龙首神珠 (自转光球)
        const orbGeo = new THREE.SphereGeometry(1.6, 16, 16);
        const orbMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffd700,
            emissiveIntensity: 1.0,
            roughness: 0.1
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.set(11, 0, 0);
        const orbLight = new THREE.PointLight(0xffd700, 3.5, 60);
        orb.add(orbLight);
        group.add(orb);

        // 14 节游龙骨骼身体 (动态摆动)
        const bodySegments = [];
        const segCount = 14;
        for (let s = 0; s < segCount; s++) {
            const segRadius = 3.6 * (1 - (s / segCount) * 0.65);
            const segGeo = new THREE.SphereGeometry(segRadius, 10, 8);
            segGeo.scale(1.1, 0.9, 0.8);
            const seg = new THREE.Mesh(segGeo, goldMat);
            seg.position.set(-s * 4.2, 0, 0);
            group.add(seg);
            bodySegments.push(seg);
        }

        group.scale.set(2.6, 2.6, 2.6);

        const radius = 40;
        const angle = -Math.PI * 0.48;
        const baseY = 16;
        group.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius + 5);

        return {
            group,
            head,
            orb,
            bodySegments,
            isBoss: true,
            type: 'boss',
            name: '远古五爪金龙 (BOSS)',
            hp: 1500,
            maxHp: 1500,
            score: 1000,
            speed: 0.55,
            angle,
            radius,
            baseY,
            swimPhase: 0
        };
    }

    // 第一人称鼠标视角控制与按键事件绑定
    bindEvents() {
        if (this._eventsBound) return;
        this._eventsBound = true;

        // 1. 点击容器锁定指针 (PointerLock) 实现真正 360 度第一人称视角
        this.container.addEventListener('click', (e) => {
            if (!this.isPointerLocked) {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === this.canvas);
        });

        // 2. 鼠标移动控制视角偏航 (Yaw) 与俯仰 (Pitch)
        window.addEventListener('mousemove', (e) => {
            if (!this.isActive) return;

            if (this.isPointerLocked) {
                // 真正的 FPS 极速视角
                const sensitivity = 0.0022;
                this.yaw -= e.movementX * sensitivity;
                this.pitch -= e.movementY * sensitivity;

                // 限制上下俯仰角 [-85度, 85度]，防止反转眩晕
                const maxPitch = Math.PI * 0.48;
                this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
                this.updateCameraRotation();
            } else if (this.isMouseDown) {
                // 未锁定时，拖拽鼠标自由转动视角
                const dx = e.clientX - this.prevMousePos.x;
                const dy = e.clientY - this.prevMousePos.y;
                this.prevMousePos = { x: e.clientX, y: e.clientY };

                this.yaw -= dx * 0.0035;
                this.pitch -= dy * 0.0035;
                const maxPitch = Math.PI * 0.48;
                this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
                this.updateCameraRotation();
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.isActive) return;
            if (e.target.closest('.modal') || e.target.closest('.top-controls') || e.target.closest('#settings-modal')) return;

            this.isMouseDown = true;
            this.prevMousePos = { x: e.clientX, y: e.clientY };

            // 鼠标左键点击发射 3D 能量炮弹 / 射线捕鱼
            if (e.button === 0) {
                this.fireProjectile();
            }
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // 3. 键盘自由潜游 (WASD + Space/Shift)
        window.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            const k = e.key.toLowerCase();
            if (k === 'w') this.keys.w = true;
            if (k === 'a') this.keys.a = true;
            if (k === 's') this.keys.s = true;
            if (k === 'd') this.keys.d = true;
            if (e.code === 'Space') this.keys.space = true;
            if (e.key === 'Shift') this.keys.shift = true;
        });

        window.addEventListener('keyup', (e) => {
            if (!this.isActive) return;
            const k = e.key.toLowerCase();
            if (k === 'w') this.keys.w = false;
            if (k === 'a') this.keys.a = false;
            if (k === 's') this.keys.s = false;
            if (k === 'd') this.keys.d = false;
            if (e.code === 'Space') this.keys.space = false;
            if (e.key === 'Shift') this.keys.shift = false;
        });

        // 4. 窗口自适应
        window.addEventListener('resize', () => this.resize());
    }

    // 更新第一人称视角四元数/欧拉角
    updateCameraRotation() {
        if (!this.camera) return;
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.x = this.pitch;
        euler.y = this.yaw;
        this.camera.quaternion.setFromEuler(euler);
    }

    // 第一人称发射 3D 穿甲等离子鱼雷炮弹
    fireProjectile() {
        if (!this.camera || !this.scene) return;

        // 准星受击动效
        if (this.crosshair) {
            this.crosshair.classList.add('firing');
            setTimeout(() => this.crosshair && this.crosshair.classList.remove('firing'), 120);
        }

        // 播放发炮音效
        if (window.soundManager) {
            window.soundManager.playShoot();
        }

        // 获取相机前方射线正中心方向向量
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();

        // 创建发光 3D 能量飞弹网
        const projGeo = new THREE.SphereGeometry(0.85, 12, 12);
        const projMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        const mesh = new THREE.Mesh(projGeo, projMat);

        // 从相机右下方(炮台枪口视效)发出
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const down = new THREE.Vector3(0, -1, 0).applyQuaternion(this.camera.quaternion);
        const muzzlePos = this.camera.position.clone()
            .add(forward.clone().multiplyScalar(2.0))
            .add(right.clone().multiplyScalar(1.2))
            .add(down.clone().multiplyScalar(0.8));

        mesh.position.copy(muzzlePos);
        this.scene.add(mesh);

        this.projectiles.push({
            mesh,
            dir: forward,
            speed: 4.8,
            life: 60
        });

        // 中心点即时射线检测 (Raycasting Hit Detection)
        this.raycastCenterAim();
    }

    // 准星中心射线检测与击中处理
    raycastCenterAim() {
        if (!this.camera || !this.raycaster) return;

        // 从屏幕正中央 (0, 0) 射出射线
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

        const checkMeshes = [];
        const meshMap = new Map();

        this.fishes.forEach(fish => {
            fish.group.traverse(child => {
                if (child.isMesh) {
                    checkMeshes.push(child);
                    meshMap.set(child, fish);
                }
            });
        });

        const intersects = this.raycaster.intersectObjects(checkMeshes, false);
        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const hitFish = meshMap.get(hitMesh);
            const hitPoint = intersects[0].point;

            if (hitFish) {
                this.onFishHit(hitFish, hitPoint);
            }
        }
    }

    // 3D 鱼类受击反应 (⚡ 无敌破解版：一炮必死 999999 伤害！)
    onFishHit(fish, hitPoint) {
        // 生成 3D 金色火花爆破
        this.createHitExplosion(hitPoint);

        // ⚡ 一炮必死秒杀切菜
        fish.hp = 0;

        // 闪红受击反馈
        fish.group.traverse(child => {
            if (child.material && child.material.color) {
                const orig = child.material.color.getHex();
                child.material.color.setHex(0xff1744);
                setTimeout(() => {
                    if (child.material) child.material.color.setHex(orig);
                }, 120);
            }
        });

        // 击中 BOSS 触发 AI 暴躁吐槽
        if (fish.isBoss && window.aiBoss) {
            const currentScore = (window.gameEngine && window.gameEngine.score) || 999999999;
            window.aiBoss.onBossHit(fish, currentScore);
        }

        // 立即触发击杀结算
        this.catchFish3D(fish);
    }

    // 捕获 3D 鱼类 (海量爆币 + 画面震颤 + UI联动)
    catchFish3D(fish) {
        if (window.soundManager) {
            window.soundManager.playCatch(fish.score);
            window.soundManager.playCoin(3);
        }

        const gainedCoins = (fish.score || 50) * (fish.isBoss ? 200 : 80);

        // 同步 2D 游戏金币与得分 (无敌破解版：999,999,999 持续暴涨)
        if (window.gameEngine) {
            window.gameEngine.coins = (window.gameEngine.coins || 999999999) + gainedCoins;
            window.gameEngine.score = (window.gameEngine.score || 999999999) + gainedCoins;
            if (window.uiManager) {
                window.uiManager.updateCoins(window.gameEngine.coins);
                if (typeof window.uiManager.updateScore === 'function') {
                    window.uiManager.updateScore(window.gameEngine.coins);
                }
            }
        }

        // 触发金币爆散粒子与屏幕震颤
        if (window.particleSystem) {
            const screenX = window.innerWidth / 2;
            const screenY = window.innerHeight / 2;
            window.particleSystem.addCoin(screenX, screenY, 260, 35, gainedCoins, fish.isBoss ? 12 : 6);
            window.particleSystem.shake(fish.isBoss ? 5.0 : 3.0, 8);
            window.particleSystem.addScore(screenX, screenY - 50, `+${gainedCoins}`, true);
        }

        // 3D 击杀消散动画
        const g = fish.group;
        const removeTimer = setInterval(() => {
            g.scale.multiplyScalar(0.85);
            if (g.scale.x < 0.05) {
                clearInterval(removeTimer);
                this.scene.remove(g);
                const idx = this.fishes.indexOf(fish);
                if (idx !== -1) this.fishes.splice(idx, 1);

                // 重新刷新一条
                setTimeout(() => {
                    if (this.isActive) {
                        if (fish.isBoss) {
                            this.boss3D = this.createDragonBoss();
                            this.scene.add(this.boss3D.group);
                            this.fishes.push(this.boss3D);
                        } else if (fish.type === 'clownfish') {
                            const nf = this.createClownfish();
                            this.scene.add(nf.group);
                            this.fishes.push(nf);
                        } else if (fish.type === 'shark') {
                            const nf = this.createShark();
                            this.scene.add(nf.group);
                            this.fishes.push(nf);
                        }
                    }
                }, 3000);
            }
        }, 30);
    }

    // 击中爆破 3D 粒子
    createHitExplosion(pos) {
        const count = 12;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            pPos[i * 3] = pos.x;
            pPos[i * 3 + 1] = pos.y;
            pPos[i * 3 + 2] = pos.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 1.8,
                (Math.random() - 0.5) * 1.8,
                (Math.random() - 0.5) * 1.8
            ));
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
            size: 2.2,
            color: 0xffd700,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(pGeo, pMat);
        this.scene.add(points);
        this.hitSparks.push({ points, velocities, life: 25 });
    }

    // 每一帧动力学更新与渲染循环
    startLoop() {
        const render = () => {
            if (!this.isActive) return;
            this.animFrameId = requestAnimationFrame(render);
            this.update();
            this.renderer.render(this.scene, this.camera);
        };
        render();
    }

    // 核心物理步进
    update() {
        const now = performance.now();
        const delta = Math.min((now - this.lastTime) * 0.001, 0.1);
        this.lastTime = now;
        this.elapsedTime += delta;
        const time = this.elapsedTime;

        // 1. 第一人称相机键盘游动平移 (WASD + Space/Shift)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const moveVec = new THREE.Vector3();

        if (this.keys.w) moveVec.add(forward);
        if (this.keys.s) moveVec.sub(forward);
        if (this.keys.d) moveVec.add(right);
        if (this.keys.a) moveVec.sub(right);
        if (this.keys.space) moveVec.y += 1.0;
        if (this.keys.shift) moveVec.y -= 1.0;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize().multiplyScalar(this.moveSpeed);
            this.camera.position.add(moveVec);
            // 限制潜航高度，防止飞出海底
            this.camera.position.y = Math.max(-35, Math.min(80, this.camera.position.y));
        }

        // 2. 海草摆动
        for (const sw of this.seaweeds) {
            sw.rotation.z = sw.userData.initRotZ + Math.sin(time * sw.userData.speed + sw.userData.phase) * 0.18;
            sw.rotation.x = Math.cos(time * sw.userData.speed + sw.userData.phase) * 0.12;
        }

        // 3. 上升水泡微粒
        if (this.bubbles) {
            const bPos = this.bubbles.geometry.attributes.position;
            for (let i = 0; i < bPos.count; i++) {
                let y = bPos.getY(i) + this.bubbleSpeeds[i];
                if (y > 90) y = -40;
                bPos.setY(i, y);
            }
            bPos.needsUpdate = true;
        }

        // 4. 3D 鱼类环形游弋与仿生动作
        for (const fish of this.fishes) {
            fish.angle += (fish.speed / (fish.radius || 60)) * 0.8;
            const fx = Math.cos(fish.angle) * fish.radius;
            const fz = Math.sin(fish.angle) * fish.radius + 5;
            fish.group.position.x = fx;
            fish.group.position.z = fz;
            fish.group.position.y = (fish.baseY !== undefined ? fish.baseY : 15) + Math.sin(time * 1.5 + fish.swimPhase) * 3.5;

            // 游动朝向 (切线方向)
            fish.group.rotation.y = -fish.angle + Math.PI / 2;

            // 仿生尾鳍摆动
            fish.swimPhase += fish.speed * 0.25;
            if (fish.tail) {
                fish.tail.rotation.y = Math.sin(fish.swimPhase * 8) * 0.35;
            }

            // 发光水母脉冲收缩
            if (fish.dome) {
                const pulse = 1.0 + Math.sin(fish.swimPhase * 4) * 0.18;
                fish.dome.scale.set(pulse, 1.0 / pulse, pulse);
            }

            // 远古金龙 24 节 3D 骨骼身体蛇形扭动
            if (fish.isBoss && fish.bodySegments) {
                if (fish.orb) {
                    fish.orb.rotation.y += 0.05;
                }
                const segCount = fish.bodySegments.length;
                for (let s = 0; s < segCount; s++) {
                    const seg = fish.bodySegments[s];
                    const wave = Math.sin(time * 3.5 - s * 0.45) * 2.8;
                    seg.position.z = wave;
                    seg.position.y = Math.cos(time * 2.5 - s * 0.35) * 1.5;
                }
            }
        }

        // 5. 3D 穿甲鱼雷炮弹前进
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.mesh.position.add(p.dir.clone().multiplyScalar(p.speed));
            p.life--;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }

        // 6. 受击爆破火花衰减
        for (let i = this.hitSparks.length - 1; i >= 0; i--) {
            const sp = this.hitSparks[i];
            const posAttr = sp.points.geometry.attributes.position;
            for (let j = 0; j < sp.velocities.length; j++) {
                posAttr.setX(j, posAttr.getX(j) + sp.velocities[j].x);
                posAttr.setY(j, posAttr.getY(j) + sp.velocities[j].y);
                posAttr.setZ(j, posAttr.getZ(j) + sp.velocities[j].z);
            }
            posAttr.needsUpdate = true;
            sp.points.material.opacity = sp.life / 25;
            sp.life--;
            if (sp.life <= 0) {
                this.scene.remove(sp.points);
                this.hitSparks.splice(i, 1);
            }
        }
    }

    // 窗口尺寸变化
    resize() {
        if (!this.renderer || !this.camera) return;
        const width = window.innerWidth || 1280;
        const height = window.innerHeight || 720;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

// 挂载至全局
window.deepSea3D = new DeepSea3DScene();
