/**
 * 数据库模块 - 使用 SQLite 存储愿望数据
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'wishes.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH);

// 初始化数据库表
function initDatabase() {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS wishes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                position_x REAL NOT NULL,
                position_y REAL NOT NULL,
                rotation REAL DEFAULT 0,
                rope_level INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_hash TEXT
            )
        `, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('✅ 数据库初始化成功');
                resolve();
            }
        });
    });
}

// 获取所有愿望
function getAllWishes() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT id, content, position_x, position_y, rotation, rope_level, created_at 
             FROM wishes 
             ORDER BY created_at DESC 
             LIMIT 100`,
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

// 添加新愿望
function addWish(content, positionX, positionY, rotation, ropeLevel, ipHash) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO wishes (content, position_x, position_y, rotation, rope_level, ip_hash) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [content, positionX, positionY, rotation, ropeLevel, ipHash],
            function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            }
        );
    });
}

// 获取愿望总数
function getWishCount() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM wishes', (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });
}

module.exports = {
    initDatabase,
    getAllWishes,
    addWish,
    getWishCount
};

