# 車の維持費シミュレーター

車の年間・月間維持費を計算する Web アプリです。

## 構成

- **フロントエンド**: React (Vite) + Chart.js
- **バックエンド**: PHP API
- **データベース**: SQLite（既定）/ MySQL（任意）

## セットアップ

### 1. データベース（初回のみ）

既定では SQLite を使用します。初回アクセス時に `database/car_cost_simulator.sqlite` とテーブルが自動作成されるため、事前のDB作成作業は不要です。

#### SQLite（既定）
- 追加設定は不要です。
- DBファイルの場所を変える場合のみ、`SQLITE_DB_PATH` 環境変数を設定してください。

#### MySQL を使いたい場合（任意）
- `DB_DRIVER=mysql` を指定し、`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` を環境変数で設定します。
- 必要であれば `database/schema.sql` を参考にテーブルを作成してください（API初回アクセス時の補助マイグレーションもあります）。

### 2. フロントエンドの依存関係（初回のみ）

```bash
cd frontend && npm install && cd ..
```

### 3. 起動

**プロジェクトルートで:**

```bash
npm run dev
```

これで **PHP API（localhost:8080）** と **React（Vite, localhost:5173）** が同時に起動します。

- ブラウザでは **http://localhost:5173** を開いてください。
- エクスポート・インポート・計算などは、Vite の proxy で `/api` が PHP に転送されるため、**両方のサーバーが起動している必要があります**。`ERR_INVALID_RESPONSE` が出る場合は、プロジェクトルートで `npm run dev` を実行しているか確認してください。

---

**従来どおり別々に起動する場合**

- バックエンド: `npm run dev:backend`（PHP のみ）
- フロントエンド: `npm run dev:frontend`（Vite のみ）

## 使い方

1. 車種を選ぶと、燃費・排気量・車両価格・車検費用が自動入力されます。
2. 年間走行距離・ガソリン価格・保険・駐車場などを入力し、「計算」をクリックします。
3. 年間維持費・月間維持費と内訳（円グラフ・リスト）が表示されます。

## トラブルシューティング

### インポートで「データベースエラー」が出る場合

SQLite 利用時は、`database/car_cost_simulator.sqlite` を削除してから再起動すると再作成されます。  
MySQL 利用時は、テーブル構造を `database/schema.sql` に合わせてください。

実行後、アプリの「CSVインポート」で、ガソリン/HV 用の `cars_gasoline_hybrid.csv` と BEV・PHEV・FCV 用の `cars_plugin_ev.csv` をそれぞれ該当する入力画面からインポートしてください。

## プロジェクト構成

```
car-cost-simulator/
├── frontend/          # React (Vite)
├── backend/           # PHP API (api/cars.php, api/calc.php)
├── database/          # schema.sql
└── README.md
```
