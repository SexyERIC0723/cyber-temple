/**
 * 赛博寺庙 - 后端服务器
 * 提供许愿墙 API 接口
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { initDatabase, getAllWishes, addWish, getWishCount } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 托管前端文件
app.use(express.static(path.join(__dirname, '..')));

// 工具函数：生成 IP 哈希（保护隐私）
function hashIP(ip) {
    return crypto.createHash('sha256').update(ip + 'cyber-temple-salt').digest('hex').substring(0, 16);
}

// ============ API 路由 ============

/**
 * GET /api/wishes
 * 获取所有愿望列表
 */
app.get('/api/wishes', async (req, res) => {
    try {
        const wishes = await getAllWishes();
        const count = await getWishCount();
        
        res.json({
            success: true,
            data: wishes,
            total: count
        });
    } catch (error) {
        console.error('获取愿望失败:', error);
        res.status(500).json({
            success: false,
            message: '获取愿望列表失败'
        });
    }
});

/**
 * POST /api/wishes
 * 提交新愿望
 */
app.post('/api/wishes', async (req, res) => {
    try {
        const { content, position_x, position_y, rotation, rope_level } = req.body;
        
        // 验证必填字段
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '愿望内容不能为空'
            });
        }
        
        // 限制内容长度
        if (content.length > 50) {
            return res.status(400).json({
                success: false,
                message: '愿望内容不能超过50个字符'
            });
        }
        
        // 获取客户端 IP 并哈希
        const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const ipHash = hashIP(clientIP);
        
        // 存入数据库
        const result = await addWish(
            content.trim(),
            position_x || Math.random() * 80 + 10,
            position_y || Math.random() * 50 + 20,
            rotation || Math.random() * 6 - 3,
            rope_level || Math.floor(Math.random() * 3) + 1,
            ipHash
        );
        
        res.json({
            success: true,
            message: '愿望已挂上灵墙',
            data: { id: result.id }
        });
        
    } catch (error) {
        console.error('提交愿望失败:', error);
        res.status(500).json({
            success: false,
            message: '提交愿望失败，请稍后重试'
        });
    }
});

/**
 * GET /api/wishes/count
 * 获取愿望总数
 */
app.get('/api/wishes/count', async (req, res) => {
    try {
        const count = await getWishCount();
        res.json({
            success: true,
            count: count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取统计失败'
        });
    }
});

// 404 处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 启动服务器
async function startServer() {
    try {
        // 初始化数据库
        await initDatabase();
        
        // 启动 HTTP 服务
        app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════╗
║      🏮 赛博寺庙服务器已启动 🏮          ║
╠══════════════════════════════════════════╣
║  本地访问: http://localhost:${PORT}         ║
║  许愿API:  http://localhost:${PORT}/api/wishes ║
╚══════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}

startServer();

