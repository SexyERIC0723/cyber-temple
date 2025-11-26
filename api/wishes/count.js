/**
 * Vercel Serverless Function - 獲取願望數量
 */

import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: '方法不允許' });
    }

    try {
        const result = await sql`SELECT COUNT(*) as count FROM wishes`;
        
        return res.status(200).json({
            success: true,
            count: parseInt(result.rows[0].count) || 0
        });
    } catch (error) {
        // 表可能不存在，返回 0
        return res.status(200).json({
            success: true,
            count: 0
        });
    }
}

