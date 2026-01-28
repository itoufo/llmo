-- ============================================
-- スキーマ作成
-- ============================================
CREATE SCHEMA IF NOT EXISTS llmo;
CREATE SCHEMA IF NOT EXISTS learning;

-- ============================================
-- LLMO Doctor 用テーブル
-- ============================================

-- 診断結果テーブル
CREATE TABLE llmo.analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- URL情報
  url TEXT NOT NULL,
  domain TEXT GENERATED ALWAYS AS (
    CASE
      WHEN url ~ '^https?://' THEN regexp_replace(url, '^https?://([^/]+).*', '\1')
      ELSE url
    END
  ) STORED,

  -- LLMO スコア
  ai_citation INTEGER,
  question_fit INTEGER,
  coverage INTEGER,
  structure INTEGER,
  eeat INTEGER,
  llmo_overall INTEGER,

  -- SEO スコア
  seo_title INTEGER,
  seo_meta INTEGER,
  seo_headings INTEGER,
  seo_images INTEGER,
  seo_links INTEGER,
  seo_mobile INTEGER,
  seo_performance INTEGER,
  seo_overall INTEGER,

  -- 総合
  overall INTEGER,

  -- 詳細データ
  improvements JSONB,
  questions JSONB,
  seo_details JSONB,
  raw_result JSONB,

  -- LLM使用量・コスト
  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd NUMERIC(10, 6),

  -- 日付（同日重複防止用）
  created_date DATE DEFAULT CURRENT_DATE
);

-- インデックス
CREATE INDEX idx_llmo_analyses_url ON llmo.analyses(url);
CREATE INDEX idx_llmo_analyses_domain ON llmo.analyses(domain);
CREATE INDEX idx_llmo_analyses_created_at ON llmo.analyses(created_at DESC);
CREATE UNIQUE INDEX idx_llmo_analyses_url_date ON llmo.analyses(url, created_date);

-- ============================================
-- SEO Learning Hub 用テーブル（将来用）
-- ============================================

-- 学習進捗
CREATE TABLE learning.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_slug TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_slug)
);

-- クイズ結果
CREATE TABLE learning.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ブックマーク
CREATE TABLE learning.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- インデックス
CREATE INDEX idx_learning_progress_user ON learning.progress(user_id);
CREATE INDEX idx_learning_quiz_user ON learning.quiz_results(user_id);
CREATE INDEX idx_learning_bookmarks_user ON learning.bookmarks(user_id);
