# ETF Financial Analyzer
> ## 🛍️ **ETF 儀表板 — 完整版**
> 此 repo 為開源核心。完整版 **[ETF 儀表板 ($29) on Gumroad](https://slashmaster6.gumroad.com/l/etf-dashboard)** — 自動財報分析、評分系統、歷史回測與每日更新。


自動抓取 ETF 成分股並進行財報分析與評分的網站。支援美股與台股 ETF。

---

## 目錄結構

```
etf-financial-analyzer/
├── backend/                  # FastAPI 後端
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── routes.py         # API endpoints
│   │   ├── fetcher.py        # 資料抓取層
│   │   ├── cache.py          # 檔案快取
│   │   ├── models.py         # Pydantic models
│   │   ├── ratios.py         # 財務比率計算
│   │   ├── core/
│   │   │   └── config.py     # 環境設定
│   │   └── services/
│   │       ├── etf_fetcher.py       # yfinance 資料抓取
│   │       └── financial_analyzer.py # 評分邏輯
│   └── requirements.txt
├── frontend/                 # Next.js 15 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # 根路由 → 自動導向 /mobile
│   │   │   ├── mobile/
│   │   │   │   └── page.tsx   # 手機版
│   │   │   └── desktop/
│   │   │       └── page.tsx   # 桌面版
│   │   ├── components/        # UI 元件 (shadcn/ui + Recharts)
│   │   └── lib/
│   │       ├── api.ts         # API 呼叫
│   │       └── types.ts       # TypeScript 型別
│   └── package.json
└── README.md
```

---

## 安裝步驟

### 前置需求

- **Node.js** >= 18（建議 20 LTS）
- **Python** >= 3.11
- **Git**

### 1. 下載專案

```bash
git clone git@github.com:slashman413/etf-financial-analyzer.git
cd etf-financial-analyzer
```

### 2. 後端設定

```bash
# 建立虛擬環境（Windows）
cd backend
python -m venv venv
venv\Scripts\activate

# 安裝相依套件
pip install -r requirements.txt

# 建立環境變數
copy .env.example .env
# 或用文字編輯器建立 backend/.env 檔案，內容如下：
# FMP_API_KEY=your_fmp_api_key_here
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key

# 啟動後端（預設 http://localhost:8000）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **重要**：無 API Key 也能正常執行！後端預設使用 **yfinance** 做為資料來源，不需要任何 API Key。`FMP_API_KEY` 與 `SUPABASE` 設定為選用，留空即可。

### 3. 前端設定

```bash
# 開新終端機，回到專案根目錄
cd frontend

# 安裝相依套件
npm install

# 啟動開發伺服器（預設 http://localhost:3000）
npm run dev
```

### 4. 開啟網站

瀏覽器開啟 **http://localhost:3000**

- 手機/小螢幕 → 自動使用 `/mobile` 垂直佈局
- 大螢幕 → 手動瀏覽 `/desktop` 網格佈局（或點選「桌面版」連結）

---

## 功能說明

| 功能 | 操作 |
|------|------|
| 搜尋 ETF | 頂端搜尋列輸入代號（如 SPY、QQQ、0050.TW），**300ms 自動補全** |
| 成分股列表 | 顯示權重、股價、漲跌幅、**綜合評分** |
| 評分顏色 | 🟢 3–5 分、🟡 2–3 分、🔴 < 2 分 |
| 產業權重 | 甜甜圈圖顯示產業分佈 |
| 個股詳情 | 點擊成分股開啟 Modal，顯示 PE / ROE / 營收成長 / D/E 等財報比率與歷史圖表 |
| 桌機版 | `/desktop` — 兩欄網格（左側成分股、右側圖表與指標） |
| 手機版 | `/mobile` — 全垂直單欄滾動 |

### 預設 ETF（首頁自動載入）

SPY, QQQ, VTI, VOO, 0050.TW, 0056.TW

---

## API 端點

| 端點 | 說明 |
|------|------|
| `GET /api/v1/etf/{symbol}/holdings` | 取得成分股 + 評分 |
| `GET /api/v1/etf/search?q={query}` | 搜尋 ETF |
| `GET /api/v1/etf/aggregate?symbols=A,B,C` | 多 ETF 聚合比較 |
| `GET /autocomplete?q={prefix}` | 自動補全（yfinance Search，最多 8 筆） |
| `GET /api/v1/stock/{symbol}/detail` | 個股詳細財報比率 + 歷史 |

---

## 技術棧

- **前端**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Recharts + Lucide
- **後端**: FastAPI + Pydantic v2 + yfinance
- **資料來源**: yfinance（免 API Key）

---

## 環境變數

| 變數 | 必填 | 說明 |
|------|------|------|
| `FMP_API_KEY` | 否 | Financial Modeling Prep API key（留空則全用 yfinance） |
| `SUPABASE_URL` | 否 | Supabase 專案 URL（留空不影響核心功能） |
| `SUPABASE_KEY` | 否 | Supabase anon key（留空不影響核心功能） |

### 🛒 相關產品
- [ETF 儀表板 — 完整版 ($29)](https://slashmaster6.gumroad.com/l/etf-dashboard?utm_source=github&utm_medium=referral) - 自動財報分析、評分系統、歷史回測與每日更新。
