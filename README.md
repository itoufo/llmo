# LLMO Site Doctor

URLを入力するだけで、LLM（ChatGPT / Gemini / Claude等）が「引用したくなる度」をスコア化するLLMO診断ツール。

## 🎯 概要

LLMO（LLM Search Optimization）は、従来のSEOとは異なり、AI検索エンジンに最適化するための新しい概念です。このツールは、WebページがLLMから見てどれだけ「引用されやすいか」を診断します。

### 診断項目

- **AI引用スコア** - LLMが回答素材として使いやすいか
- **質問適合スコア** - よくある質問にどれだけ答えられているか
- **概念カバレッジ** - テーマで必要な概念をカバーしているか
- **構造スコア** - 見出し・箇条書き・Q&A形式などが整っているか
- **E-E-A-Tスコア** - 専門性・経験・権威性・信頼性があるか

## 🛠 技術スタック

- **フロントエンド**: Vite + React + TypeScript + TailwindCSS
- **バックエンド**: Netlify Functions (Node.js)
- **データベース**: Supabase (PostgreSQL)
- **LLM**: OpenAI GPT-4
- **グラフ**: Recharts
- **ホスティング**: Netlify

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

## 📂 ディレクトリ構成

```
llmo/
├── netlify/
│   └── functions/
│       ├── analyze.ts          # メイン診断API
│       ├── lib/
│       │   ├── fetcher.ts      # HTML取得
│       │   ├── extractor.ts    # 本文抽出
│       │   ├── evaluator.ts    # LLM評価
│       │   └── scorer.ts       # スコア計算
│       └── types/
│           └── index.ts        # 型定義
├── src/
│   ├── components/
│   │   ├── UrlForm.tsx         # URL入力フォーム
│   │   ├── ScoreRadar.tsx      # レーダーチャート
│   │   ├── ScoreSummary.tsx    # スコア一覧
│   │   └── ImprovementsList.tsx# 改善点リスト
│   ├── types.ts                # フロントエンド型定義
│   ├── App.tsx                 # メインアプリ
│   └── main.tsx
├── supabase-schema.sql         # DB スキーマ
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

## 🎨 今後の機能追加案

- [ ] 履歴機能（過去の診断結果を表示）
- [ ] サイトマップXML一括診断
- [ ] 競合URL比較機能
- [ ] 自動リライト提案機能
- [ ] Chrome拡張版
- [ ] WordPress プラグイン版
- [ ] API公開（マーケティング会社向け）

## 📝 ライセンス

MIT

## 👤 作成者

Built with ❤️ for the LLMO era
