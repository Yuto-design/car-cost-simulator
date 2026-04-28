# テストとCIの詳細ガイド

このドキュメントは、本リポジトリで導入した自動テストとCIの構成を、実行方法・対象範囲・拡張方法まで含めて整理したものです。

## 1. 全体像

- フロントエンド: Vitest + React Testing Library
- バックエンド: PHPUnit
- CI: GitHub Actions（`pull_request` / `push` to `main` and `master`）

品質ゲートとして、次を自動実行します。

- Frontend: `lint` / `build` / `test`
- Backend: `composer test`（PHPUnit）

### 1.1 テスト関連ファイル構成

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI定義（frontend/backendの品質ゲート）
├── frontend/
│   ├── package.json                  # lint/build/testスクリプト定義
│   ├── vite.config.js                # Vitest設定（jsdom, setupFiles）
│   └── src/
│       ├── test/
│       │   └── setup.js              # jest-dom等のテスト初期化
│       ├── App.test.jsx              # 画面表示分岐のテスト
│       └── features/
│           └── carCostSimulator/
│               └── hooks/
│                   └── useCarCostSimulator.test.js
│                                        # 計算呼び出し・入力検証のテスト
└── backend/
    ├── composer.json                 # PHPUnit実行コマンド定義
    ├── phpunit.xml                   # PHPUnit設定
    ├── lib/
    │   ├── calc_service.php          # 主な計算ロジック
    │   └── cars_schema.php           # スキーマ正規化ロジック
    └── tests/
        ├── CalcServiceTest.php       # 金額計算/異常系のテスト
        └── CarsSchemaTest.php        # 旧値互換を含む正規化テスト
```

---

## 2. フロントエンドテスト

### 2.1 使用ツール

- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`

### 2.2 関連ファイル

- 設定: [`frontend/vite.config.js`](../frontend/vite.config.js)
- セットアップ: [`frontend/src/test/setup.js`](../frontend/src/test/setup.js)
- スクリプト: [`frontend/package.json`](../frontend/package.json)
- テスト:
  - [`frontend/src/App.test.jsx`](../frontend/src/App.test.jsx)
  - [`frontend/src/features/carCostSimulator/hooks/useCarCostSimulator.test.js`](../frontend/src/features/carCostSimulator/hooks/useCarCostSimulator.test.js)

### 2.3 現在のテスト内容

`App.test.jsx`

- `activeView` が `intro` のとき概要画面を表示する
- `activeView` が `compare` のとき比較画面を表示する
- `activeView` が `result` かつ `result` 未生成時に案内メッセージを表示する

`useCarCostSimulator.test.js`

- electric モードで `powertrain` 未選択時に計算APIを呼ばずエラーを返す
- electric モード時に `/api/calc.php` へ送るJSON bodyの構築を検証する

### 2.4 ローカル実行

ルートで実行:

```bash
npm run test:frontend
```

frontend ディレクトリで個別実行:

```bash
npm run lint
npm run build
npm run test:run
```

---

## 3. バックエンドテスト

### 3.1 使用ツール

- PHPUnit 10

### 3.2 関連ファイル

- Composer設定: [`backend/composer.json`](../backend/composer.json)
- PHPUnit設定: [`backend/phpunit.xml`](../backend/phpunit.xml)
- テスト対象ロジック:
  - [`backend/lib/calc_service.php`](../backend/lib/calc_service.php)
  - [`backend/lib/cars_schema.php`](../backend/lib/cars_schema.php)
- テスト:
  - [`backend/tests/CalcServiceTest.php`](../backend/tests/CalcServiceTest.php)
  - [`backend/tests/CarsSchemaTest.php`](../backend/tests/CarsSchemaTest.php)

### 3.3 現在のテスト内容

`CalcServiceTest.php`

- combustion 計算の主要金額（税金、燃料費、合計など）を検証
- electric/bev 計算の主要金額（電気代、合計など）を検証
- electric/phev の異常系（`fuel <= 0`）を検証
- electric/fcv の異常系（`hydrogen_km_per_kg <= 0`）を検証

`CarsSchemaTest.php`

- `normalize_stored_segment()` が現行値と旧値（`gasoline_hybrid` / `plugin_ev`）を正しく正規化することを検証

### 3.4 ローカル実行

初回（依存インストール）:

```bash
composer install --working-dir backend
```

テスト実行:

```bash
npm run test:backend
```

または:

```bash
composer test --working-dir backend
```

---

## 4. CI（GitHub Actions）

### 4.1 ワークフロー

- 定義ファイル: `.github/workflows/ci.yml`
- トリガー:
  - `pull_request`
  - `push` (`main`, `master`)

### 4.2 ジョブ構成

#### frontend ジョブ

1. checkout
2. Node.js セットアップ（v22）
3. `npm ci`（`frontend`）
4. `npm run lint`
5. `npm run build`
6. `npm run test:run`

#### backend ジョブ

1. checkout
2. PHP セットアップ（8.3）
3. `composer validate --strict`
4. `composer install --no-interaction --prefer-dist`
5. `composer test`

---

## 5. 失敗時の見方と対処

### 5.1 frontend が落ちる場合

- `lint` 失敗: ESLintエラーを先に解消
- `build` 失敗: importパスや構文エラーを確認
- `test` 失敗: 対象テストをローカルで単体実行して再現

例:

```bash
cd frontend
npm run test -- App.test.jsx
```

### 5.2 backend が落ちる場合

- `composer validate --strict` 失敗:
  - `composer.json` の必須項目や警告（license等）を修正
- `composer test` 失敗:
  - 期待値の更新漏れ、バリデーションメッセージ変更を確認

---

## 6. 今後テストを増やすときの方針

- まず「回帰しやすい分岐」を優先して追加する
  - 画面表示分岐
  - APIリクエストbodyの構築
  - 金額計算と入力バリデーション
- 1テスト1責務を保つ
- テスト名は「前提 + 挙動 + 期待結果」を日本語で明記する
- 仕様変更時は、実装と同時にテスト期待値を更新する

---

## 7. 参考コマンド（まとめ）

```bash
# frontend
npm run test:frontend

# backend
npm run test:backend

# all (手動確認)
npm run --prefix frontend lint
npm run --prefix frontend build
npm run test:frontend
npm run test:backend
```
