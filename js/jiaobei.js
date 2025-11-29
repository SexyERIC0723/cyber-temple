/**
 * 赛博寺庙 - 掷筊页面脚本
 * 使用 Three.js 进行3D渲染，Cannon-es 进行物理模拟
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { ethers } from 'ethers';

// Contract Config
const ARTIFACTS_PATH = './js/artifacts/';
let mockTokenAddress, jackpotAddress;
let mockTokenABI, jackpotABI;
let provider, signer;
let jackpotContract, tokenContract;
let userAddress;
let isTokenMode = false;
let jackpotPool = "0.0";
let userBalance = "0.0";

// ============================================
// 全局变量
// ============================================
let scene, camera, renderer, world;
let jiaoObjects = [];
let isTossing = false;
let restCheckCount = 0;
const maxRestChecks = 300;

let question = '';
let audioEnabled = true;
let audioContext = null;

// 材质颜色
const COLOR_RED = 0xe02222;
const COLOR_WOOD = 0xf0d5a0;

// DOM 元素
const phaseQuestion = document.getElementById('phase-question');
const loadingIncense = document.getElementById('loading-incense');
const phaseToss = document.getElementById('phase-toss');
const phaseResult = document.getElementById('phase-result');
const btnPray = document.getElementById('btn-pray');
const btnToss = document.getElementById('btn-toss');
const btnRetry = document.getElementById('btn-retry');
const audioToggle = document.getElementById('audio-toggle');
const flashOverlay = document.getElementById('flash-overlay');

// Wallet UI
const btnConnect = document.getElementById('btn-connect');
const modeToggle = document.getElementById('mode-toggle');
const modeLabel = document.getElementById('mode-label');
const walletInfo = document.getElementById('wallet-info');
const btnAddToken = document.getElementById('btn-add-token');
const btnFaucet = document.getElementById('btn-faucet');
const elUserBalance = document.getElementById('user-balance');
const elJackpotPool = document.getElementById('jackpot-pool');

// ============================================
// 初始化
// ============================================
async function initApp() {
    // Inject Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    // initScene(); // Removed to avoid recursion
    setupEventListeners();
    await loadArtifacts();
}

async function loadArtifacts() {
    try {
        const timestamp = new Date().getTime();
        const tokenRes = await fetch(`${ARTIFACTS_PATH}MockToken.json?t=${timestamp}`);
        const jackpotRes = await fetch(`${ARTIFACTS_PATH}HolyGrailJackpot.json?t=${timestamp}`);

        const tokenData = await tokenRes.json();
        const jackpotData = await jackpotRes.json();

        mockTokenAddress = tokenData.address;
        mockTokenABI = tokenData.abi;
        jackpotAddress = jackpotData.address;
        jackpotABI = jackpotData.abi;

        console.log("Artifacts loaded");
    } catch (e) {
        console.error("Failed to load artifacts", e);
    }
}

function setupEventListeners() {
    btnConnect.addEventListener('click', connectWallet);

    modeToggle.addEventListener('change', (e) => {
        isTokenMode = e.target.checked;
        modeLabel.textContent = isTokenMode ? "代幣模式" : "免費模式";
        modeLabel.style.color = isTokenMode ? "var(--gold)" : "var(--wood-light)";

        if (isTokenMode && !userAddress) {
            alert("請先連結錢包！");
            e.target.checked = false;
            isTokenMode = false;
            modeLabel.textContent = "免費模式";
        } else if (isTokenMode) {
            walletInfo.classList.remove('hidden');
            updateBalances();
        } else {
            walletInfo.classList.add('hidden');
        }
    });

    btnAddToken.addEventListener('click', addTokenToWallet);
    btnFaucet.addEventListener('click', getFreeTokens);
}

async function getFreeTokens() {
    if (!tokenContract || !userAddress) return;
    try {
        showToast("正在領取測試幣...", "neutral");
        const amount = ethers.parseEther("100000"); // 100k tokens
        const tx = await tokenContract.mint(userAddress, amount);
        await tx.wait();
        showToast("+ 100,000 BEI", "positive");
        updateBalances();
    } catch (error) {
        console.error(error);
        showToast("領取失敗", "negative");
    }
}

async function addTokenToWallet() {
    if (!mockTokenAddress || !window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: mockTokenAddress,
                    symbol: 'BEI',
                    decimals: 18,
                    image: window.location.origin + '/favicon.svg', // Use favicon as token icon
                },
            },
        });
    } catch (error) {
        console.error(error);
    }
}

async function connectWallet() {
    if (!window.ethereum) {
        alert("請安裝 MetaMask!");
        return;
    }

    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        await checkNetwork();

        btnConnect.textContent = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);

        // Init Contracts
        tokenContract = new ethers.Contract(mockTokenAddress, mockTokenABI, signer);
        jackpotContract = new ethers.Contract(jackpotAddress, jackpotABI, signer);

        updateBalances();

        // Listen for events
        jackpotContract.on("GameResult", (player, resultType, payout, jackpotContribution) => {
            updateBalances();
        });

    } catch (e) {
        console.error("Connection failed", e);
        alert("連結失敗");
    }
}

async function checkNetwork() {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = '0x38'; // BSC Mainnet (56)
    // const targetChainId = '0x61'; // BSC Testnet (97)

    if (chainId !== targetChainId) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: targetChainId }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: targetChainId,
                                chainName: 'BNB Smart Chain Mainnet',
                                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                                nativeCurrency: {
                                    name: 'BNB',
                                    symbol: 'BNB',
                                    decimals: 18,
                                },
                                blockExplorerUrls: ['https://bscscan.com/'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error(addError);
                }
            } else {
                console.error(switchError);
            }
        }
    }
}


async function updateBalances() {
    if (!userAddress || !tokenContract || !jackpotContract) return;

    try {
        const bal = await tokenContract.balanceOf(userAddress);
        const pool = await jackpotContract.jackpotPool();

        userBalance = ethers.formatEther(bal);
        jackpotPool = ethers.formatEther(pool);

        elUserBalance.textContent = parseFloat(userBalance).toFixed(2);
        elJackpotPool.textContent = parseFloat(jackpotPool).toFixed(2);

        await checkGameState();
    } catch (e) {
        console.error("Update balance failed", e);
    }
}

async function checkGameState() {
    if (!jackpotContract || !userAddress) return;
    try {
        const isPending = await jackpotContract.gamePending(userAddress);
        if (isPending) {
            btnToss.innerText = "重置狀態";
            btnToss.onclick = handleEmergencyReset;
            showToast("检测到异常状态，请点击重置", "negative");
        } else {
            btnToss.innerText = "擲 筊";
            btnToss.onclick = tossJiao;
        }
    } catch (e) {
        console.error("Check game state failed", e);
    }
}

async function handleEmergencyReset() {
    if (!jackpotContract) return;
    try {
        btnToss.disabled = true;
        btnToss.innerText = "重置中...";
        const tx = await jackpotContract.emergencyReset();
        await tx.wait();
        showToast("状态已重置", "positive");
        btnToss.disabled = false;
        btnToss.innerText = "擲 筊";
        btnToss.onclick = tossJiao;
    } catch (e) {
        console.error("Reset failed", e);
        showToast("重置失败", "negative");
        btnToss.disabled = false;
        btnToss.innerText = "重置狀態";
    }
}

// ============================================
// 背景效果
// ============================================

// 创建烟雾背景
function createSmoke() {
    const container = document.getElementById('smoke-container');
    for (let i = 0; i < 12; i++) {
        const smoke = document.createElement('div');
        smoke.className = 'smoke';
        smoke.style.left = Math.random() * 100 + '%';
        smoke.style.animationDelay = Math.random() * 20 + 's';
        smoke.style.animationDuration = (18 + Math.random() * 12) + 's';
        smoke.style.opacity = 0.1 + Math.random() * 0.2;
        container.appendChild(smoke);
    }
}

// 创建漂浮粒子（香灰/光点）
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (15 + Math.random() * 15) + 's';

        // 随机颜色：金色或红色
        if (Math.random() > 0.5) {
            particle.style.background = 'rgba(212, 168, 75, 0.8)';
        } else {
            particle.style.background = 'rgba(255, 100, 50, 0.6)';
        }

        // 随机大小
        const size = 2 + Math.random() * 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        container.appendChild(particle);
    }
}

// ============================================
// 音效系统
// ============================================
function playSound(type) {
    if (!audioEnabled) return;

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    switch (type) {
        case 'bell':
            const bell = ctx.createOscillator();
            const bellGain = ctx.createGain();
            bell.type = 'sine';
            bell.frequency.setValueAtTime(800, now);
            bellGain.gain.setValueAtTime(0.15, now);
            bellGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
            bell.connect(bellGain);
            bellGain.connect(ctx.destination);
            bell.start(now);
            bell.stop(now + 2);
            break;

        case 'throw':
            const noise = ctx.createBufferSource();
            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
            }
            noise.buffer = noiseBuffer;
            const throwGain = ctx.createGain();
            throwGain.gain.setValueAtTime(0.15, now);
            noise.connect(throwGain);
            throwGain.connect(ctx.destination);
            noise.start(now);
            break;

        case 'land':
            const impact = ctx.createOscillator();
            const impactGain = ctx.createGain();
            impact.type = 'sine';
            impact.frequency.setValueAtTime(150, now);
            impact.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            impactGain.gain.setValueAtTime(0.2, now);
            impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            impact.connect(impactGain);
            impactGain.connect(ctx.destination);
            impact.start(now);
            impact.stop(now + 0.2);
            break;

        case 'result':
            [1, 1.25, 1.5].forEach((mult, i) => {
                const chime = ctx.createOscillator();
                const chimeGain = ctx.createGain();
                chime.type = 'sine';
                chime.frequency.setValueAtTime(440 * mult, now + i * 0.15);
                chimeGain.gain.setValueAtTime(0.12, now + i * 0.15);
                chimeGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
                chime.connect(chimeGain);
                chimeGain.connect(ctx.destination);
                chime.start(now + i * 0.15);
                chime.stop(now + i * 0.15 + 0.5);
            });
            break;
    }
}

// ============================================
// Three.js 场景初始化
// ============================================
function initScene() {
    // 场景 - 深紫色神秘背景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08040c);
    scene.fog = new THREE.FogExp2(0x0a0510, 0.025);

    // 相机
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 20, 10);
    camera.lookAt(0, 0, 0);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // === 黄色暖光氛围灯光设置 ===

    // 环境光 - 暖黄色微弱基底
    const ambient = new THREE.AmbientLight(0x3d2a10, 0.6);
    scene.add(ambient);

    // 主聚光灯 - 金黄色，大范围发散，从顶部照下
    const mainSpot = new THREE.SpotLight(0xffdd55, 180);
    mainSpot.position.set(0, 35, 5);
    mainSpot.angle = Math.PI / 2.5;
    mainSpot.penumbra = 1.0;
    mainSpot.decay = 1.2;
    mainSpot.distance = 60;
    mainSpot.castShadow = true;
    mainSpot.shadow.mapSize.width = 2048;
    mainSpot.shadow.mapSize.height = 2048;
    mainSpot.shadow.camera.near = 10;
    mainSpot.shadow.camera.far = 60;
    mainSpot.shadow.bias = -0.0001;
    scene.add(mainSpot);

    // 前方黄色聚光灯 - 照亮筊杯区域
    const frontSpot = new THREE.SpotLight(0xffcc33, 100);
    frontSpot.position.set(0, 20, 15);
    frontSpot.angle = Math.PI / 3;
    frontSpot.penumbra = 0.9;
    frontSpot.decay = 1.5;
    frontSpot.distance = 40;
    frontSpot.target.position.set(0, 0, 0);
    scene.add(frontSpot);
    scene.add(frontSpot.target);

    // 左侧暖光 - 模拟灯笼/烛光
    const warmLeft = new THREE.PointLight(0xffaa22, 40, 25);
    warmLeft.position.set(-10, 8, 3);
    scene.add(warmLeft);

    // 右侧暖光
    const warmRight = new THREE.PointLight(0xffaa22, 40, 25);
    warmRight.position.set(10, 8, 3);
    scene.add(warmRight);

    // 底部金色反光 - 模拟地面反射
    const bottomGlow = new THREE.PointLight(0xcc8833, 15, 12);
    bottomGlow.position.set(0, 0.3, 0);
    scene.add(bottomGlow);

    // 背景深紫色补光 - 营造神秘深度感
    const backLight = new THREE.PointLight(0x1a0825, 20, 40);
    backLight.position.set(0, 12, -20);
    scene.add(backLight);

    // 顶部散射光 - 增加整体亮度均匀性
    const topFill = new THREE.HemisphereLight(0xffdd88, 0x0a0510, 0.4);
    scene.add(topFill);

    // 创建背景粒子效果（烟雾/尘埃）
    createBackgroundParticles();

    // 物理世界
    world = new CANNON.World({ gravity: new CANNON.Vec3(0, -25, 0) });
    world.solver.iterations = 20;
    world.solver.tolerance = 0.001;
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.allowSleep = false;

    const matGround = new CANNON.Material('ground');
    const matJiao = new CANNON.Material('jiao');
    const matWall = new CANNON.Material('wall');

    // 碰撞材质设置
    const contactGroundJiao = new CANNON.ContactMaterial(matGround, matJiao, {
        friction: 0.7,
        restitution: 0.2,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
    });
    world.addContactMaterial(contactGroundJiao);

    const contactJiaoJiao = new CANNON.ContactMaterial(matJiao, matJiao, {
        friction: 0.6,
        restitution: 0.2
    });
    world.addContactMaterial(contactJiaoJiao);

    const contactWallJiao = new CANNON.ContactMaterial(matWall, matJiao, {
        friction: 0.5,
        restitution: 0.3
    });
    world.addContactMaterial(contactWallJiao);

    // 地面 - 深色木质祭坛感
    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
        material: matGround
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // 创建地面纹理
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const gCtx = groundCanvas.getContext('2d');

    // 深色渐变背景
    const gGrad = gCtx.createRadialGradient(256, 256, 0, 256, 256, 400);
    gGrad.addColorStop(0, '#1a0f08');
    gGrad.addColorStop(0.5, '#0f0806');
    gGrad.addColorStop(1, '#050304');
    gCtx.fillStyle = gGrad;
    gCtx.fillRect(0, 0, 512, 512);

    // 添加一些纹理噪点
    gCtx.globalAlpha = 0.1;
    for (let i = 0; i < 2000; i++) {
        gCtx.fillStyle = Math.random() > 0.5 ? '#2a1a10' : '#0a0505';
        gCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(4, 4);

    const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({
            map: groundTexture,
            color: 0x1a0f0a,
            roughness: 0.9,
            metalness: 0.05
        })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // 中央祭坛高光区域
    const altarGlowGeometry = new THREE.CircleGeometry(5, 32);
    const altarGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending
    });
    const altarGlow = new THREE.Mesh(altarGlowGeometry, altarGlowMaterial);
    altarGlow.rotation.x = -Math.PI / 2;
    altarGlow.position.y = 0.02;
    scene.add(altarGlow);

    // 添加边界墙壁
    const wallSize = 8;

    const leftWall = new CANNON.Body({ type: CANNON.Body.STATIC, material: matWall });
    leftWall.addShape(new CANNON.Plane());
    leftWall.position.set(-wallSize, 0, 0);
    leftWall.quaternion.setFromEuler(0, Math.PI / 2, 0);
    world.addBody(leftWall);

    const rightWall = new CANNON.Body({ type: CANNON.Body.STATIC, material: matWall });
    rightWall.addShape(new CANNON.Plane());
    rightWall.position.set(wallSize, 0, 0);
    rightWall.quaternion.setFromEuler(0, -Math.PI / 2, 0);
    world.addBody(rightWall);

    const frontWall = new CANNON.Body({ type: CANNON.Body.STATIC, material: matWall });
    frontWall.addShape(new CANNON.Plane());
    frontWall.position.set(0, 0, wallSize);
    frontWall.quaternion.setFromEuler(0, Math.PI, 0);
    world.addBody(frontWall);

    const backWall = new CANNON.Body({ type: CANNON.Body.STATIC, material: matWall });
    backWall.addShape(new CANNON.Plane());
    backWall.position.set(0, 0, -wallSize);
    world.addBody(backWall);

    // 创建筊杯
    createCrescentJiao(-1.5, matJiao);
    createCrescentJiao(1.5, matJiao);

    // 开始动画循环
    animate();
}

// ============================================
// 筊杯几何体
// ============================================
function createJiaoGeometry() {
    const arcRadius = 2.0;
    const arcAngle = Math.PI * 0.6;
    const bodyWidth = 0.9;
    const bodyHeight = 0.55;
    const segmentsU = 32;
    const segmentsV = 16;

    const vertices = [];
    const indices = [];
    const uvs = [];
    const groups = [];

    function getArcPoint(t) {
        const angle = -arcAngle / 2 + t * arcAngle;
        const x = Math.sin(angle) * arcRadius;
        const z = Math.cos(angle) * arcRadius - arcRadius;
        const tx = Math.cos(angle);
        const tz = -Math.sin(angle);
        return { x, z, tx, tz };
    }

    // 1. 平面底部（阳面）
    for (let i = 0; i <= segmentsU; i++) {
        const t = i / segmentsU;
        const arc = getArcPoint(t);
        const tipFade = Math.sin(t * Math.PI);
        const currentWidth = bodyWidth * tipFade;
        const perpX = -arc.tz;
        const perpZ = arc.tx;

        vertices.push(
            arc.x + perpX * currentWidth * 0.5, 0, arc.z + perpZ * currentWidth * 0.5
        );
        uvs.push(t, 0);

        vertices.push(
            arc.x - perpX * currentWidth * 0.5, 0, arc.z - perpZ * currentWidth * 0.5
        );
        uvs.push(t, 1);
    }

    const flatIndices = [];
    for (let i = 0; i < segmentsU; i++) {
        const base = i * 2;
        flatIndices.push(base, base + 2, base + 1);
        flatIndices.push(base + 1, base + 2, base + 3);
    }
    indices.push(...flatIndices);
    groups.push({ start: 0, count: flatIndices.length, materialIndex: 0 });

    // 2. 凸面顶部（阴面）
    const convexStartVertex = vertices.length / 3;
    const convexStartIndex = indices.length;

    for (let i = 0; i <= segmentsU; i++) {
        const t = i / segmentsU;
        const arc = getArcPoint(t);
        const tipFade = Math.sin(t * Math.PI);
        const currentWidth = bodyWidth * tipFade;
        const currentHeight = bodyHeight * tipFade;
        const perpX = -arc.tz;
        const perpZ = arc.tx;

        for (let j = 0; j <= segmentsV; j++) {
            const v = j / segmentsV;
            const crossPos = v - 0.5;
            const normalizedPos = crossPos * 2;
            const heightFactor = Math.sqrt(Math.max(0, 1 - normalizedPos * normalizedPos));
            const y = currentHeight * heightFactor;
            const offset = crossPos * currentWidth;

            vertices.push(arc.x + perpX * offset, y, arc.z + perpZ * offset);
            uvs.push(t, v);
        }
    }

    const convexIndices = [];
    for (let i = 0; i < segmentsU; i++) {
        for (let j = 0; j < segmentsV; j++) {
            const base = convexStartVertex + i * (segmentsV + 1) + j;
            convexIndices.push(
                base, base + segmentsV + 1, base + 1,
                base + 1, base + segmentsV + 1, base + segmentsV + 2
            );
        }
    }
    indices.push(...convexIndices);
    groups.push({ start: convexStartIndex, count: convexIndices.length, materialIndex: 1 });

    // 创建 BufferGeometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    groups.forEach(g => {
        geometry.addGroup(g.start, g.count, g.materialIndex);
    });

    geometry.rotateY(Math.PI / 2);

    return geometry;
}

// 创建背景粒子效果（烟雾/尘埃）
function createBackgroundParticles() {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

        const warmth = Math.random();
        colors[i * 3] = 0.8 + warmth * 0.2;
        colors[i * 3 + 1] = 0.5 + warmth * 0.3;
        colors[i * 3 + 2] = 0.1 + warmth * 0.1;

        sizes[i] = Math.random() * 0.3 + 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData.originalPositions = positions.slice();
    particles.userData.time = 0;
    scene.add(particles);

    window.backgroundParticles = particles;
}

// 创建木纹纹理
function createWoodTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0d5a0';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#dcb580';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;

    for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        const x = Math.random() * size;
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(
            x + Math.random() * 50 - 25, size / 2,
            x + Math.random() * 50 - 25, size,
            x, size
        );
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

// 创建筊杯（含物理碰撞体）
function createCrescentJiao(xOffset, physMaterial) {
    const geometry = createJiaoGeometry();

    const matFlat = new THREE.MeshStandardMaterial({
        color: COLOR_WOOD,
        roughness: 0.4,
        metalness: 0.1,
        map: createWoodTexture(),
        side: THREE.DoubleSide,
        emissive: 0x1a1005,
        emissiveIntensity: 0.1
    });

    const matRound = new THREE.MeshPhysicalMaterial({
        color: COLOR_RED,
        roughness: 0.1,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        side: THREE.DoubleSide,
        emissive: 0x330808,
        emissiveIntensity: 0.15
    });

    const mesh = new THREE.Mesh(geometry, [matFlat, matRound]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // 物理碰撞体
    const body = new CANNON.Body({
        mass: 2.0,
        material: physMaterial,
        linearDamping: 0.35,
        angularDamping: 0.45
    });

    const arcRadius = 2.0;
    const arcAngle = Math.PI * 0.6;
    const numSpheres = 7;

    for (let i = 0; i < numSpheres; i++) {
        const t = (i + 0.5) / numSpheres;
        const angle = -arcAngle / 2 + t * arcAngle;
        const z = Math.sin(angle) * arcRadius;
        const x = -(Math.cos(angle) * arcRadius - arcRadius);
        const tipFade = Math.sin(t * Math.PI);

        const baseRadius = 0.18 * tipFade + 0.08;
        body.addShape(new CANNON.Sphere(baseRadius), new CANNON.Vec3(x, 0.05, z));

        if (tipFade > 0.3) {
            const midRadius = 0.25 * tipFade;
            body.addShape(new CANNON.Sphere(midRadius), new CANNON.Vec3(x, 0.2 * tipFade, z));
        }
    }

    body.addShape(new CANNON.Sphere(0.22), new CANNON.Vec3(0, 0.38, 0));
    body.addShape(new CANNON.Sphere(0.15), new CANNON.Vec3(0.3, 0.25, 0));
    body.addShape(new CANNON.Sphere(0.15), new CANNON.Vec3(-0.3, 0.25, 0));

    body.position.set(xOffset, 5, 0);

    const q = new CANNON.Quaternion();
    q.setFromEuler(Math.PI / 2, 0, 0);
    body.quaternion = q;

    world.addBody(body);
    jiaoObjects.push({ mesh, body });
}

// ============================================
// 掷筊逻辑
// ============================================
// ============================================
// 掷筊逻辑
// ============================================
async function tossJiao() {
    if (isTossing) return;
    isTossing = true;
    restCheckCount = 0;
    btnToss.innerText = "誠心祈願中...";

    playSound('throw');

    // Token Mode Logic
    if (isTokenMode) {
        try {
            await handleTokenPlay();
        } catch (error) {
            console.error(error);

            let errorMsg = "交易失敗或取消";
            if (error.reason) {
                errorMsg += ": " + error.reason;
            } else if (error.message && error.message.includes("Game already pending")) {
                errorMsg = "游戏进行中，请重置";
                await checkGameState();
            }

            alert(errorMsg);
            isTossing = false;
            btnToss.disabled = false;
            btnToss.innerText = "擲 筊";
            return;
        }
    }

    jiaoObjects.forEach((obj, index) => {
        const b = obj.body;

        const xPos = (index === 0 ? -1.2 : 1.2) + (Math.random() - 0.5) * 0.3;
        const zPos = (Math.random() - 0.5) * 0.5;
        b.position.set(xPos, 5 + Math.random() * 2, zPos);
        b.velocity.set(0, 0, 0);
        b.angularVelocity.set(0, 0, 0);

        // 随机初始旋转
        const u1 = Math.random();
        const u2 = Math.random();
        const u3 = Math.random();
        const sqrt1MinusU1 = Math.sqrt(1 - u1);
        const sqrtU1 = Math.sqrt(u1);
        b.quaternion.set(
            sqrt1MinusU1 * Math.sin(2 * Math.PI * u2),
            sqrt1MinusU1 * Math.cos(2 * Math.PI * u2),
            sqrtU1 * Math.sin(2 * Math.PI * u3),
            sqrtU1 * Math.cos(2 * Math.PI * u3)
        );

        // 抛掷力
        const impulse = new CANNON.Vec3(
            (Math.random() - 0.5) * 4,
            8 + Math.random() * 4,
            (Math.random() - 0.5) * 3
        );
        b.applyImpulse(impulse, b.position);

        // 随机旋转
        b.angularVelocity.set(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 25
        );

        const torque = new CANNON.Vec3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 8
        );
        b.torque.copy(torque);
    });

    // 镜头推进
    zoomCamera();

    setTimeout(checkResting, 1200);
}

// 镜头推进动画
function zoomCamera() {
    let alpha = 0;
    const startY = 20, endY = 14;
    const startZ = 10, endZ = 6;

    const zoom = setInterval(() => {
        alpha += 0.02;
        if (alpha >= 1) clearInterval(zoom);
        const t = alpha < 0.5 ? 2 * alpha * alpha : -1 + (4 - 2 * alpha) * alpha;
        camera.position.set(0, startY + (endY - startY) * t, startZ + (endZ - startZ) * t);
        camera.lookAt(0, 0, 0);
    }, 16);
}

// 检查是否静止
function checkResting() {
    restCheckCount++;
    let moving = false;

    jiaoObjects.forEach(obj => {
        const v = obj.body.velocity.length();
        const av = obj.body.angularVelocity.length();
        if (v > 0.03 || av > 0.08) moving = true;

        if (v < 0.1 && av < 0.2) {
            obj.body.velocity.scale(0.9, obj.body.velocity);
            obj.body.angularVelocity.scale(0.9, obj.body.angularVelocity);
        }
    });

    if (restCheckCount >= maxRestChecks) {
        jiaoObjects.forEach(obj => {
            obj.body.velocity.set(0, 0, 0);
            obj.body.angularVelocity.set(0, 0, 0);
        });
        moving = false;
    }

    if (moving) {
        requestAnimationFrame(checkResting);
    } else {
        restCheckCount = 0;
        analyzeResult();
    }
}

async function handleTokenPlay() {
    // 1. Check Allowance
    const cost = ethers.parseEther("20000");
    const allowance = await tokenContract.allowance(userAddress, jackpotAddress);

    if (allowance < cost) {
        btnToss.innerText = "授權代幣...";
        const tx = await tokenContract.approve(jackpotAddress, ethers.MaxUint256);
        await tx.wait();
    }

    // 2. Start Game (Pay)
    btnToss.innerText = "支付中...";
    const tx = await jackpotContract.startGame();
    await tx.wait();

    showToast("- 20000.00 BEI", "negative");
    updateBalances();

    btnToss.innerText = "誠心祈願中...";
}

// 分析结果
async function analyzeResult() {
    let yangCount = 0;
    const jiaoResults = [];

    jiaoObjects.forEach(obj => {
        const localUp = new THREE.Vector3(0, 1, 0);
        localUp.applyQuaternion(obj.mesh.quaternion);

        const isYang = localUp.y < 0;
        if (isYang) yangCount++;
        jiaoResults.push(isYang);
    });

    let resultType, title, description;
    let resultIndex = 0; // 0=Sheng, 1=Xiao, 2=Yin

    if (yangCount === 1) {
        resultType = 'sheng';
        title = '聖 筊';
        description = '一平一凸 · 大吉之兆';
        resultIndex = 0;
    } else if (yangCount === 2) {
        resultType = 'xiao';
        title = '笑 筊';
        description = '兩平面 · 神明發笑';
        resultIndex = 1;
    } else {
        resultType = 'yin-jiao';
        title = '陰 筊';
        description = '兩凸面 · 時機未到';
        resultIndex = 2;
    }

    // Token Mode: Submit Result
    if (isTokenMode) {
        try {
            // 3. Get Signature from Backend
            const signRes = await fetch(`/api/sign-result?userAddress=${userAddress}&resultType=${resultIndex}`);
            const signData = await signRes.json();

            if (signData.error) {
                throw new Error(signData.error);
            }

            console.log("Got signature:", signData);

            // DEBUG: Verify Signature Off-Chain
            try {
                const debugRes = await jackpotContract.debugVerify(userAddress, resultIndex, signData.signature);
                console.log("DEBUG VERIFY:", {
                    isValid: debugRes[0],
                    recovered: debugRes[1],
                    expectedSigner: debugRes[2],
                    currentNonce: debugRes[3].toString(),
                    expectedNonce: debugRes[4].toString(),
                    hash: debugRes[5]
                });

                if (!debugRes[0]) {
                    console.error("Signature verification failed on-chain preview!");
                    alert(`Debug Error: Recovered ${debugRes[1]} != Expected ${debugRes[2]}`);
                }
            } catch (e) {
                console.error("Debug verify failed:", e);
            }

            // 2. Submit to Contract with Signature
            const tx = await jackpotContract.submitResult(resultIndex, signData.signature);

            showToast("上鏈確認中...", "neutral");
            await tx.wait(); // Payout Toast
            let payout = 0;
            if (resultIndex === 0) payout = 20000 * 5; // Sheng (5x)
            else if (resultIndex === 1) payout = 20000 * 0.5; // Xiao (0.5x)

            if (payout > 0) {
                showToast(`+ ${payout}.00 BEI`, "positive");
            } else {
                showToast("未中獎", "negative");
            }
            updateBalances();
        } catch (e) {
            console.error("Submit result failed", e);
            alert("提交結果失敗，請聯繫管理員");
        }
    }

    showResult(resultType, title, description, jiaoResults);
}

// 显示结果
function showResult(type, title, description, jiaoResults) {
    playSound('result');

    const flashClass = type === 'sheng' ? 'gold' : type === 'xiao' ? 'green' : 'blue';
    flashOverlay.className = 'flash-overlay ' + flashClass;

    setTimeout(() => {
        flashOverlay.className = 'flash-overlay';

        phaseToss.classList.add('hidden');
        phaseResult.classList.remove('hidden');
        phaseResult.classList.add('active');

        const resultTitle = document.getElementById('result-title');
        resultTitle.textContent = title;
        resultTitle.className = 'result-title ' + type;

        document.getElementById('result-description').textContent = description;

        const jiaobeiResult = document.getElementById('jiaobei-result');
        jiaobeiResult.innerHTML = jiaoResults.map(isYang =>
            `<div class="jiaobei-icon ${isYang ? 'yang' : 'yin'} glow"></div>`
        ).join('');

        const fortune = getFortune(type);
        document.getElementById('fortune-text').innerHTML = `
            <div class="question-recall">「${question}」</div>
            <p>${fortune}</p>
        `;
    }, 500);
}

// 获取签文
function getFortune(type) {
    const fortunes = {
        sheng: [
            '春風得意馬蹄疾，一日看盡長安花。此事可成，宜速行之。',
            '雲開見月明，守得雲開見月明。誠心所向，必有回報。',
            '東風吹綻海棠枝，時來運轉事事宜。靜待佳音，好事將近。',
            '龍門一躍期已至，青雲直上展宏圖。把握時機，勇往直前。'
        ],
        xiao: [
            '事在人為天亦佑，且待時機再卜之。心誠意正，再問一回。',
            '月有陰晴圓缺時，此事尚需再思量。不急不躁，靜觀其變。',
            '霧裡看花終隔一層，詳情再問方能明。誠心再擲，以求明示。',
            '天機未可輕洩露，善信且需自參詳。思慮周全，再來請示。'
        ],
        'yin-jiao': [
            '此路不通另尋徑，塞翁失馬焉知禍福。暫且止步，另謀他途。',
            '強求不得反成憂，隨緣方能得自在。放下執念，順其自然。',
            '風雨欲來山滿樓，宜守不宜進。韜光養晦，靜待時機。',
            '月缺終有圓滿時，此時非彼時。退一步海闊天空，待機而動。'
        ]
    };

    const options = fortunes[type];
    return options[Math.floor(Math.random() * options.length)];
}

// 分享结果
function shareResult() {
    const title = document.getElementById('result-title').textContent;
    const fortune = document.getElementById('fortune-text').textContent;
    const text = `🔮 擲筊結果：${title}\n\n「${question}」\n\n${fortune}\n\n🏮 試試你的運氣：`;

    if (navigator.share) {
        navigator.share({
            title: '擲筊 - 神明指引',
            text: text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('結果已複製到剪貼板！');
        });
    }
}

// 重置
function reset() {
    phaseToss.classList.add('hidden');
    phaseResult.classList.add('hidden');
    phaseResult.classList.remove('active');
    phaseQuestion.classList.add('active');
    document.getElementById('question-input').value = '';
    btnToss.innerText = '掷 筊';

    camera.position.set(0, 20, 10);
    camera.lookAt(0, 0, 0);

    jiaoObjects.forEach((obj, index) => {
        const xOffset = index === 0 ? -1.5 : 1.5;
        obj.body.position.set(xOffset, 5, 0);
        obj.body.velocity.set(0, 0, 0);
        obj.body.angularVelocity.set(0, 0, 0);
        const q = new CANNON.Quaternion();
        q.setFromEuler(Math.PI / 2, 0, 0);
        obj.body.quaternion = q;
    });

    isTossing = false;
}

// ============================================
// 动画循环
// ============================================
let lastTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    const fixedTimeStep = 1 / 120;
    const maxSubSteps = 3;
    world.step(fixedTimeStep, deltaTime, maxSubSteps);

    jiaoObjects.forEach(obj => {
        obj.mesh.position.copy(obj.body.position);
        obj.mesh.quaternion.copy(obj.body.quaternion);
    });

    // 更新背景粒子动画
    if (window.backgroundParticles) {
        const particles = window.backgroundParticles;
        particles.userData.time += deltaTime * 0.3;
        const positions = particles.geometry.attributes.position.array;
        const original = particles.userData.originalPositions;

        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            positions[i3 + 1] = original[i3 + 1] + Math.sin(particles.userData.time + i * 0.1) * 0.5;
            positions[i3] = original[i3] + Math.sin(particles.userData.time * 0.5 + i * 0.2) * 0.3;
            positions[i3 + 2] = original[i3 + 2] + Math.cos(particles.userData.time * 0.5 + i * 0.2) * 0.3;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        particles.rotation.y += deltaTime * 0.02;
    }

    renderer.render(scene, camera);
}

// ============================================
// 事件绑定
// ============================================
function bindEvents() {
    btnPray.addEventListener('click', () => {
        question = document.getElementById('question-input').value.trim();
        if (!question) {
            question = '心誠則靈';
        }

        phaseQuestion.classList.remove('active');
        loadingIncense.classList.add('active');
        playSound('bell');

        setTimeout(() => {
            loadingIncense.classList.remove('active');
            phaseToss.classList.remove('hidden');
        }, 3000);
    });

    btnToss.addEventListener('click', tossJiao);
    btnRetry.addEventListener('click', reset);

    audioToggle.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        audioToggle.textContent = audioEnabled ? '🔊' : '🔇';
        audioToggle.classList.toggle('muted', !audioEnabled);
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ============================================
// 初始化
// ============================================
function init() {
    createSmoke();
    createParticles();
    initScene();
    bindEvents();
    initApp();
}

init();
function showToast(message, type = 'neutral') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = type === 'positive' ? `💰 ${message}` : type === 'negative' ? `💸 ${message}` : message;

    container.appendChild(toast);

    // Remove after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
