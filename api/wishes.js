/**
 * Vercel Serverless Function - 許願牆 API
 * 使用 Vercel Postgres 作為數據庫
 */

import { sql } from '@vercel/postgres';

// 初始化數據庫表
async function initDatabase() {
    await sql`
        CREATE TABLE IF NOT EXISTS wishes (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            rotation REAL DEFAULT 0,
            rope_level INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
}

// 處理請求
export default async function handler(req, res) {
    // 設置 CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 確保表存在
        await initDatabase();

        if (req.method === 'GET') {
            // 獲取所有願望
            const { rows } = await sql`
                SELECT id, content, position_x, position_y, rotation, rope_level, created_at 
                FROM wishes 
                ORDER BY created_at DESC 
                LIMIT 100
            `;
            
            const countResult = await sql`SELECT COUNT(*) as count FROM wishes`;
            
            return res.status(200).json({
                success: true,
                data: rows,
                total: parseInt(countResult.rows[0].count)
            });
        }

        if (req.method === 'POST') {
            const { content, position_x, position_y, rotation, rope_level } = req.body;
            
            // 驗證
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '願望內容不能為空'
                });
            }
            
            if (content.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: '願望內容不能超過50個字符'
                });
            }
            
            // 插入數據
            const result = await sql`
                INSERT INTO wishes (content, position_x, position_y, rotation, rope_level)
                VALUES (${content.trim()}, ${position_x || 50}, ${position_y || 50}, ${rotation || 0}, ${rope_level || 1})
                RETURNING id
            `;
            
            return res.status(200).json({
                success: true,
                message: '願望已掛上靈牆',
                data: { id: result.rows[0].id }
            });
        }

        return res.status(405).json({ success: false, message: '方法不允許' });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            message: '伺服器錯誤，請稍後重試'
        });
    }
}

