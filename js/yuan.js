/**
 * 赛博寺庙 - 许愿页面脚本
 * 支持多用户共享许愿墙 + 卡片翻转查看
 */

// API 配置
const API_BASE = window.location.origin;
const API_WISHES = `${API_BASE}/api/wishes`;

// DOM 元素
const uiLayer = document.getElementById('uiLayer');
const inputBox = document.getElementById('inputBox');
const printerContainer = document.getElementById('printerContainer');
const printedPaper = document.getElementById('printedPaper');
const cardsContainer = document.getElementById('cardsContainer');
const cursorFollower = document.getElementById('cursorFollower');
const bgElement = document.getElementById('templeBackground');
const wishBtn = document.getElementById('wishBtn');

let myWishText = "";
let isOnlineMode = true; // 是否为在线模式
let isPlacingCard = false; // 是否正在放置卡片

// 检查是否可以连接后端
async function checkOnlineStatus() {
    try {
        const response = await fetch(`${API_WISHES}/count`, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`🏮 在线模式 - 灵墙已有 ${data.count} 个愿望`);
            return true;
        }
    } catch (e) {
        console.log('📴 离线模式 - 使用本地模拟数据');
    }
    return false;
}

// 1. 初始化许愿墙
async function initWall() {
    isOnlineMode = await checkOnlineStatus();
    
    if (isOnlineMode) {
        // 在线模式：从服务器加载真实愿望
        await loadWishesFromServer();
    } else {
        // 离线模式：显示模拟数据
        loadLocalWishes();
    }
    
    createDust();
    updateWishCounter();
}

// 从服务器加载愿望
async function loadWishesFromServer() {
    try {
        const response = await fetch(API_WISHES);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            // 显示服务器上的愿望（可翻转）
            result.data.forEach(wish => {
                createFlippableCard(
                    wish.content,
                    wish.position_x,
                    wish.position_y,
                    wish.rotation
                );
            });
        } else {
            // 服务器没有数据时显示占位符
            loadLocalWishes();
        }
    } catch (error) {
        console.error('加载愿望失败:', error);
        loadLocalWishes();
    }
}

// 本地模拟愿望（离线或无数据时使用）
function loadLocalWishes() {
    const ropeLevels = [20, 45, 70];
    const randomWishes = ["身体健康", "财源广进", "逢考必过", "不再焦虑", "家人平安", "事业上升", "遇见真爱", "猫狗双全"];

    ropeLevels.forEach(level => {
        const count = Math.floor(Math.random() * 3) + 3;
        const segmentWidth = 90 / count;

        for (let i = 0; i < count; i++) {
            const text = randomWishes[Math.floor(Math.random() * randomWishes.length)];
            const randomLeft = (i * segmentWidth) + 5 + (Math.random() * (segmentWidth - 10));
            const randomTopOffset = (Math.random() * 5) - 2;

            createFlippableCard(
                text,
                randomLeft,
                level + 8 + randomTopOffset,
                Math.random() * 4 - 2
            );
        }
    });
}

// 更新愿望计数器
async function updateWishCounter() {
    const counterEl = document.getElementById('wishCounter');
    if (!counterEl) return;
    
    if (isOnlineMode) {
        try {
            const response = await fetch(`${API_WISHES}/count`);
            const data = await response.json();
            if (data.success) {
                counterEl.innerText = `靈牆已收錄 ${data.count} 個願望`;
            }
        } catch (e) {
            counterEl.innerText = '靈牆 · 離線模式';
        }
    } else {
        counterEl.innerText = '灵墙 · 离线模式';
    }
}

function createDust() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'dust';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.width = Math.random() * 3 + 'px';
        p.style.height = p.style.width;
        p.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(p);
    }
}

// ============ 跳过许愿直接进入灵墙 ============
function skipToWall() {
    uiLayer.style.opacity = '0';
    uiLayer.style.pointerEvents = 'none';
    
    setTimeout(() => {
        uiLayer.style.display = 'none';
        // 显示右上角许愿按钮
        if (wishBtn) wishBtn.classList.remove('hidden');
    }, 500);
    
    // 恢复背景的默认光标
    bgElement.style.cursor = 'default';
}

// ============ 打开许愿面板（从右上角按钮触发） ============
function openWishPanel() {
    // 重置状态
    document.getElementById('wishText').value = '';
    inputBox.style.display = 'block';
    printerContainer.classList.add('hidden');
    printerContainer.classList.remove('flex');
    printedPaper.classList.remove('animate-print-slide');
    document.getElementById('instructionText').style.opacity = '0';
    
    // 显示 UI 层
    uiLayer.style.display = 'flex';
    uiLayer.style.pointerEvents = 'auto';
    uiLayer.style.opacity = '0';
    setTimeout(() => {
        uiLayer.style.opacity = '1';
    }, 10);
    
    // 隐藏右上角按钮
    if (wishBtn) wishBtn.classList.add('hidden');
}

// 2. 打印流程
function startPrinting() {
    const input = document.getElementById('wishText');
    if (!input.value.trim()) {
        alert("請寫下心願...");
        return;
    }
    
    myWishText = input.value.trim();
    
    // 限制长度
    if (myWishText.length > 50) {
        alert("願望不能超過50個字哦~");
        return;
    }
    
    document.getElementById('printContent').innerText = myWishText;
    document.getElementById('cursorText').innerText = myWishText.substring(0, 8);
    
    inputBox.style.display = 'none';
    printerContainer.classList.remove('hidden');
    printerContainer.classList.add('flex');
    
    setTimeout(() => {
        printedPaper.classList.add('animate-print-slide');
        setTimeout(() => {
            document.getElementById('instructionText').style.opacity = '1';
            document.addEventListener('click', enterWallMode, { once: true });
        }, 2600);
    }, 100);
}

// 3. 进入挂签模式
function enterWallMode() {
    isPlacingCard = true;
    
    uiLayer.style.opacity = '0';
    uiLayer.style.pointerEvents = 'none';
    
    setTimeout(() => {
        uiLayer.style.display = 'none';
    }, 700);

    cursorFollower.classList.remove('hidden');
    
    bgElement.addEventListener('mousemove', moveCard);
    bgElement.addEventListener('click', placeCard);
}

function moveCard(e) {
    cursorFollower.style.left = e.clientX + 'px';
    cursorFollower.style.top = e.clientY + 'px';
}

async function placeCard(e) {
    const x = e.clientX;
    const y = e.clientY;
    
    // 计算百分比位置（用于存储）
    const percentX = (x / window.innerWidth) * 100;
    const percentY = (y / window.innerHeight) * 100;
    const rotation = Math.random() * 6 - 3;
    
    // 确定绳索层级
    let ropeLevel = 1;
    if (percentY > 35 && percentY < 55) ropeLevel = 2;
    else if (percentY >= 55) ropeLevel = 3;
    
    // 在界面上显示卡片（自己的愿望，不需要翻转，直接显示）
    createMyWishCard(myWishText, x, y, rotation);

    cursorFollower.style.display = 'none';
    bgElement.removeEventListener('mousemove', moveCard);
    bgElement.removeEventListener('click', placeCard);
    bgElement.style.cursor = 'default';
    isPlacingCard = false;
    
    // 显示右上角许愿按钮
    wishBtn.classList.remove('hidden');
    
    // 提交到服务器
    if (isOnlineMode) {
        try {
            const response = await fetch(API_WISHES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: myWishText,
                    position_x: percentX,
                    position_y: percentY,
                    rotation: rotation,
                    rope_level: ropeLevel
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('🙏 願望已掛上靈牆，願心想事成');
                updateWishCounter();
            } else {
                showToast('願望保存失敗：' + result.message);
            }
        } catch (error) {
            console.error('提交愿望失败:', error);
            showToast('網絡異常，願望僅在本地顯示');
        }
    } else {
        showToast('📴 離線模式，願望僅在本地顯示');
    }
}

// 显示提示消息
function showToast(message) {
    // 移除旧的 toast
    const oldToast = document.querySelector('.wish-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'wish-toast';
    toast.innerText = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(26, 5, 5, 0.95);
        border: 1px solid #d4af37;
        color: #d4af37;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInUp 0.5s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ============ 创建可翻转的卡片（别人的愿望） ============
function createFlippableCard(text, x, y, rotateDeg) {
    // 外层包装器
    const wrapper = document.createElement('div');
    wrapper.className = 'wish-card-wrapper';
    wrapper.style.left = x + '%';
    wrapper.style.top = y + '%';
    wrapper.style.animation = `swing ${4 + Math.random() * 2}s ease-in-out infinite`;
    wrapper.style.animationDelay = `-${Math.random() * 5}s`;
    
    // 卡片主体（可翻转）
    const card = document.createElement('div');
    card.className = 'wish-card';
    
    // 正面（默认显示 - 模糊占位符）
    const front = document.createElement('div');
    front.className = 'card-front';
    
    const frontHole = document.createElement('div');
    frontHole.className = 'card-hole';
    
    const frontContent = document.createElement('div');
    frontContent.className = 'font-serif text-gray-800 text-sm font-bold vertical-text h-full overflow-hidden flex items-center justify-center leading-5 pt-4';
    frontContent.innerText = '❖❖❖❖';
    frontContent.style.opacity = '0.3';
    
    const clickHint = document.createElement('div');
    clickHint.className = 'click-hint';
    clickHint.innerText = '點擊查看';
    
    front.appendChild(frontHole);
    front.appendChild(frontContent);
    front.appendChild(clickHint);
    
    // 背面（翻转后显示 - 真实内容）
    const back = document.createElement('div');
    back.className = 'card-back';
    
    const backHole = document.createElement('div');
    backHole.className = 'card-hole';
    
    const backContent = document.createElement('div');
    backContent.className = 'font-serif text-gray-800 text-sm font-bold vertical-text h-full overflow-hidden flex items-center justify-center leading-5 pt-4';
    backContent.innerText = text.length > 8 ? text.substring(0, 8) + '..' : text;
    
    back.appendChild(backHole);
    back.appendChild(backContent);
    
    // 挂绳
    const string = document.createElement('div');
    string.className = 'card-string';
    
    card.appendChild(front);
    card.appendChild(back);
    wrapper.appendChild(string);
    wrapper.appendChild(card);
    
    // 点击翻转事件
    wrapper.onclick = function(e) {
        // 如果正在放置卡片，不触发翻转
        if (isPlacingCard) return;
        
        e.stopPropagation();
        card.classList.toggle('flipped');
    };
    
    cardsContainer.appendChild(wrapper);
}

// ============ 创建自己的愿望卡片（不需要翻转） ============
function createMyWishCard(text, x, y, rotateDeg) {
    const card = document.createElement('div');
    card.className = 'wish-card-simple';
    card.style.animation = `swing ${4 + Math.random() * 2}s ease-in-out infinite`;
    card.style.animationDelay = `-${Math.random() * 5}s`;
    card.style.left = (x - 35) + 'px';
    card.style.top = y + 'px';
    card.style.transform = `rotate(${rotateDeg}deg)`;
    card.style.zIndex = '100';
    card.style.border = '1px solid #d4af37';
    card.style.background = '#fffbf0';
    
    // 添加发光效果表示是自己的愿望
    card.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5), 0 4px 15px rgba(0,0,0,0.4)';

    const content = document.createElement('div');
    content.className = 'font-serif text-gray-800 text-sm font-bold vertical-text h-full overflow-hidden flex items-center justify-center leading-5 pt-4';
    content.innerText = text.length > 8 ? text.substring(0, 8) + '..' : text;

    const string = document.createElement('div');
    string.className = 'card-string';
    card.appendChild(string);
    card.appendChild(content);
    
    cardsContainer.appendChild(card);
}

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initWall();
});

// 导出到全局（供HTML onclick使用）
window.startPrinting = startPrinting;
window.skipToWall = skipToWall;
window.openWishPanel = openWishPanel;
