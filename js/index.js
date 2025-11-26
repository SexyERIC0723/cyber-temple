/**
 * 赛博寺庙 - 首页脚本
 */

// 生成漂浮粒子
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const count = 25;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (12 + Math.random() * 8) + 's';
        
        // 随机大小
        const size = 2 + Math.random() * 3;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // 随机颜色 (金色/橙色)
        if (Math.random() > 0.5) {
            particle.style.background = '#d4af37';
        } else {
            particle.style.background = '#ff9944';
        }
        
        container.appendChild(particle);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
});

