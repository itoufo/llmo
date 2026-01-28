# LLMO Doctor - AI引用最適化診断ツール

URLを入力するだけで、LLM（ChatGPT / Gemini / Claude等）が「引用したくなる度」をスコア化するLLMO診断ツール。

## 🎯 概要

LLMO（LLM Search Optimization）は、従来のSEOとは異なり、AI検索エンジンに最適化するための新しい概念です。このツールは、WebページがLLMから見てどれだけ「引用されやすいか」を診断します。

### 診断項目

- **AI引用スコア** - LLMが回答素材として使いやすいか
- **質問適合スコア** - よくある質問にどれだけ答えられているか
- **概念カバレッジ** - テーマで必要な概念をカバーしているか
- **構造スコア** - 見出し・箇条書き・Q&A形式などが整っているか
- **E-E-A-Tスコア** - 専門性・経験・権威性・信頼性があるか

## 🏗 アーキテクチャと設計

### リファクタリング計画

#### 🔴 優先度高: 大きなファイルの分割

| ファイル | 現在の行数 | 分割案 |
|---------|----------|--------|
| `supabase/functions/analyze/index.ts` | 1022行 | 6ファイルに分割 |
| `src/components/SeoSummary.tsx` | 863行 | 7ファイルに分割 |
| `src/components/Settings.tsx` | 541行 | 5ファイルに分割 |

#### 📁 改善後のディレクトリ構成（予定）

```
src/
├── components/
│   ├── seo/                    # SEO関連コンポーネント
│   │   ├── SeoSummary.tsx     
│   │   ├── AdvancedSeoSection.tsx
│   │   ├── TechnicalSeoCard.tsx
│   │   ├── ContentSeoCard.tsx
│   │   ├── PerformanceSeoCard.tsx
│   │   └── ScoreBreakdown.tsx
│   ├── settings/               # 設定関連コンポーネント
│   │   ├── Settings.tsx
│   │   ├── GeneralSettings.tsx
│   │   ├── PromptSettings.tsx
│   │   └── TeamSettings.tsx
│   └── common/                 # 共通コンポーネント
│       ├── ScoreRadar.tsx
│       ├── Tooltip.tsx
│       └── LoadingSpinner.tsx
├── hooks/                      # カスタムフック
│   ├── useAnalysis.ts
│   ├── useAuth.ts
│   └── useScoreCalculation.ts
├── utils/                      # ユーティリティ関数
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── types/                      # 型定義
    ├── analysis.ts
    ├── seo.ts
    └── auth.ts
```

```
supabase/functions/analyze/
├── index.ts                    # エントリポイント (100行目標)
├── evaluator.ts                # LLM評価ロジック
├── seo-analyzer.ts             # 基本SEO分析
├── seo-advanced.ts             # Advanced SEO
├── prompts/                    # プロンプト管理
│   ├── llmo-prompt.ts
│   └── seo-prompt.ts
├── scorers/                    # スコア計算
│   ├── llmo-scorer.ts
│   └── seo-scorer.ts
└── types.ts                    # 共通型定義
```

## 🛠 技術スタック

- **フロントエンド**: Vite + React 18 + TypeScript + TailwindCSS
- **バックエンド**: Supabase Edge Functions (Deno) + Netlify Functions
- **データベース**: Supabase (PostgreSQL)
- **LLM**: OpenAI GPT-4o-mini
- **グラフ**: Recharts
- **ホスティング**: Netlify + Supabase

## 📦 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でプロジェクトを作成
2. SQL Editorで`supabase-schema.sql`を実行してテーブルを作成

### 3. 環境変数の設定

`.env`ファイルを作成（`.env.example`を参考）：

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx
```

### 4. ローカル開発サーバーの起動

```bash
npx netlify dev
```

ブラウザで `http://localhost:8888` を開く

## 🚀 デプロイ

### Netlifyへのデプロイ

1. GitHubリポジトリにプッシュ
2. [Netlify](https://netlify.com)で新しいサイトを作成
3. リポジトリを接続
4. 環境変数を設定（上記3つのキー）
5. デプロイ

## 📂 現在のディレクトリ構成

```
llmo/
├── src/
│   ├── components/
│   │   ├── HomePage.tsx        # ホームページ (483行)
│   │   ├── Dashboard.tsx       # ダッシュボード (313行)
│   │   ├── SeoSummary.tsx      # SEO結果表示 (863行) ⚠️
│   │   ├── Settings.tsx        # 設定画面 (541行) ⚠️
│   │   ├── AuthModal.tsx       # 認証モーダル
│   │   ├── UrlForm.tsx         # URL入力フォーム
│   │   ├── ScoreRadar.tsx      # レーダーチャート
│   │   ├── ScoreSummary.tsx    # スコア一覧
│   │   └── ImprovementsList.tsx# 改善点リスト
│   ├── contexts/
│   │   └── AuthContext.tsx     # 認証管理
│   ├── lib/
│   │   └── supabase.ts         # Supabase接続
│   ├── types.ts                # 型定義 (179行)
│   └── App.tsx                 # メインアプリ
├── supabase/
│   ├── functions/
│   │   └── analyze/
│   │       ├── index.ts        # メイン処理 (1022行) ⚠️
│   │       └── seo-advanced.ts # Advanced SEO (419行)
│   └── migrations/             # DBマイグレーション
├── netlify/
│   └── functions/              # Netlifyファンクション
│       ├── analyze.ts
│       └── lib/
├── netlify.toml                # Netlify設定
└── package.json
```

## 🔧 カスタマイズ

### スコアの重みを変更

`netlify/functions/lib/scorer.ts`の`WEIGHTS`を編集：

```typescript
const WEIGHTS = {
  aiCitation: 0.30,
  questionFit: 0.20,
  coverage: 0.20,
  structure: 0.15,
  eeat: 0.15
}
```

### LLMプロンプトの調整

`netlify/functions/lib/evaluator.ts`の`evaluateWithLLM`関数内のプロンプトを編集

## 📊 データベーススキーマ

```sql
create table analyses (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  ai_citation int check (ai_citation >= 0 and ai_citation <= 100),
  question_fit int check (question_fit >= 0 and question_fit <= 100),
  coverage int check (coverage >= 0 and coverage <= 100),
  structure int check (structure >= 0 and structure <= 100),
  eeat int check (eeat >= 0 and eeat <= 100),
  overall int check (overall >= 0 and overall <= 100),
  improvements jsonb,
  raw_result jsonb,
  created_at timestamptz default now()
);
```

## 📊 スコアリングシステム詳細

### 完全LLM管理による透明性の高いスコアリング

すべてのスコア計算はLLM（GPT-4o-mini）が直接実施。固定のIF文による計算は撤廃済み。

#### LLMO（LLM最適化）スコア配分
- **AI引用適性** (20%): AIが引用しやすいか
- **質問適合性** (20%): ユーザー質問への回答力
- **概念網羅性** (20%): トピックのカバー範囲
- **構造評価** (20%): 情報構造の質
- **E-E-A-T** (20%): 専門性・経験・権威性・信頼性

#### Advanced SEOスコア配分
- **技術的SEO** (25%)
  - Canonical URL: 15点
  - 構造化データ: 15点
  - Open Graph: 10点
  - SSL/モバイル: 25点
  - その他: 35点
- **パフォーマンスSEO** (25%)
  - HTMLサイズ: 30点
  - インラインCSS/JS: 20点
  - リンク構造: 50点
- **コンテンツSEO** (25%)
  - 文字数: 40点
  - メディア: 20点
  - 構造化: 20点
  - 情報密度: 20点
- **ユーザー体験** (25%)
  - アクセシビリティ: 40点
  - ナビゲーション: 30点
  - 読みやすさ: 30点

## 🎨 今後の機能追加案

### Phase 1: コード品質改善（実施中）
- [x] LLMスコアリング透明化
- [x] 日本語文字数カウント修正
- [ ] 大きなファイルの分割（1000行超の3ファイル）
- [ ] コンポーネント責務の明確化
- [ ] カスタムフック抽出

### Phase 2: 機能拡張
- [ ] 履歴機能（過去の診断結果を表示）
- [ ] バッチ分析（複数URL同時診断）
- [ ] 競合URL比較機能
- [ ] カスタムプロンプト設定
- [ ] CSVエクスポート機能

### Phase 3: プラットフォーム展開
- [ ] Chrome拡張版
- [ ] WordPress プラグイン版
- [ ] API公開（マーケティング会社向け）
- [ ] Slack/Teams連携

## 📝 ライセンス

MIT

## 👤 作成者

Built with ❤️ for the LLMO era
