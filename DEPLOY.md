# 🏮 賽博寺廟 - Vercel 完整部署教程

本教程將指導你如何將賽博寺廟部署到 Vercel，並配置 Vercel Postgres 實現許願牆數據持久化。

---

## 📋 前置準備

1. 一個 [GitHub](https://github.com) 帳號
2. 一個 [Vercel](https://vercel.com) 帳號（可用 GitHub 登錄）
3. 安裝 [Git](https://git-scm.com/downloads)
4. 安裝 [Node.js](https://nodejs.org) (v18+)

---

## 🚀 部署步驟

### 第一步：上傳代碼到 GitHub

1. **打開終端，進入項目目錄：**
   ```bash
   cd /Users/wanghaoyu/Downloads/shengbei
   ```

2. **初始化 Git 倉庫：**
   ```bash
   git init
   git add .
   git commit -m "🏮 初始化賽博寺廟"
   ```

3. **在 GitHub 創建新倉庫：**
   - 打開 https://github.com/new
   - 倉庫名稱填寫：`cyber-temple`（或你喜歡的名字）
   - 選擇 **Public** 或 **Private**
   - **不要**勾選 "Add a README file"
   - 點擊 **Create repository**

4. **推送代碼到 GitHub：**
   ```bash
   git remote add origin https://github.com/你的用戶名/cyber-temple.git
   git branch -M main
   git push -u origin main
   ```

---

### 第二步：在 Vercel 導入項目

1. **登錄 Vercel：**
   - 打開 https://vercel.com
   - 使用 GitHub 帳號登錄

2. **導入項目：**
   - 點擊 **"Add New..."** → **"Project"**
   - 選擇 **"Import Git Repository"**
   - 找到並選擇 `cyber-temple` 倉庫
   - 點擊 **"Import"**

3. **配置項目：**
   - Framework Preset: 選擇 **"Other"**
   - Root Directory: 保持默認 `./`
   - 點擊 **"Deploy"**

4. **等待部署完成**（約 1-2 分鐘）

---

### 第三步：配置 Vercel Postgres 數據庫

這一步是讓許願牆數據永久保存的關鍵！

1. **進入項目設置：**
   - 在 Vercel Dashboard 中點擊你的項目
   - 點擊頂部的 **"Storage"** 標籤

2. **創建 Postgres 數據庫：**
   - 點擊 **"Create Database"**
   - 選擇 **"Postgres"**
   - 點擊 **"Continue"**

3. **配置數據庫：**
   - Database Name: `cyber-temple-db`（或任意名稱）
   - Region: 選擇離你最近的區域
   - 點擊 **"Create"**

4. **連接數據庫到項目：**
   - 創建完成後，點擊 **"Connect Project"**
   - 選擇你的 `cyber-temple` 項目
   - 點擊 **"Connect"**

5. **重新部署項目：**
   - 回到項目主頁
   - 點擊 **"Deployments"** 標籤
   - 點擊最新部署右側的 **"..."** → **"Redeploy"**
   - 等待部署完成

---

### 第四步：驗證部署

1. **訪問網站：**
   - 部署完成後，Vercel 會給你一個網址，如：
   - `https://cyber-temple.vercel.app`

2. **測試許願功能：**
   - 點擊導航欄的「許願」
   - 寫下一個願望並掛上靈牆
   - 刷新頁面，確認願望仍然存在

3. **測試擲筊和求籤：**
   - 確認所有功能正常運作

---

## 🔧 常見問題

### Q: 許願牆顯示「離線模式」？
**A:** 說明數據庫未正確連接。請檢查：
1. Vercel Postgres 是否已創建
2. 數據庫是否已連接到項目
3. 是否已重新部署

### Q: 部署失敗？
**A:** 查看 Vercel 的部署日誌，常見原因：
- Node.js 版本問題：確保使用 v18+
- 依賴安裝失敗：檢查 package.json

### Q: 如何更新網站？
**A:** 
```bash
# 修改代碼後
git add .
git commit -m "更新內容"
git push
```
Vercel 會自動重新部署。

### Q: 如何綁定自定義域名？
**A:**
1. 在 Vercel 項目設置中點擊 **"Domains"**
2. 輸入你的域名
3. 按照提示配置 DNS

---

## 📊 數據庫管理

### 查看數據
1. 在 Vercel Dashboard 點擊 **"Storage"**
2. 選擇你的數據庫
3. 點擊 **"Data"** 標籤即可查看所有願望

### 清空數據
在 **"Query"** 標籤執行：
```sql
DELETE FROM wishes;
```

---

## 🎉 完成！

恭喜！你的賽博寺廟已成功部署到雲端！

現在你可以：
- 📱 分享網址給朋友
- 🌐 綁定自定義域名
- 📊 查看用戶的願望數據

如有問題，歡迎提出！

