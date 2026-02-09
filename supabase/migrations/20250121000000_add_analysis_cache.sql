-- ============================================
-- 分析キャッシュ機能追加マイグレーション
-- ============================================

-- 正規化URL列を追加（generated column）
ALTER TABLE llmo.analyses ADD COLUMN IF NOT EXISTS normalized_url TEXT GENERATED ALWAYS AS (
  CASE
    WHEN url ~ '^https?://' THEN
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(url, '^http://', 'https://'),
            '^https://www\.', 'https://'
          ),
          '/+$', ''
        ),
        '\?.*$', ''
      )
    ELSE lower(trim(url))
  END
) STORED;

-- コンテンツハッシュ列を追加
ALTER TABLE llmo.analyses ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- キャッシュ有効期限
ALTER TABLE llmo.analyses ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');

-- キャッシュヒットカウント
ALTER TABLE llmo.analyses ADD COLUMN IF NOT EXISTS hit_count INTEGER DEFAULT 0;

-- 更新日時
ALTER TABLE llmo.analyses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 分析結果のJSON（resultカラム追加、raw_resultとは別）
ALTER TABLE llmo.analyses ADD COLUMN IF NOT EXISTS result JSONB;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_llmo_analyses_normalized_url ON llmo.analyses(normalized_url);
CREATE INDEX IF NOT EXISTS idx_llmo_analyses_content_hash ON llmo.analyses(content_hash);
CREATE INDEX IF NOT EXISTS idx_llmo_analyses_expires_at ON llmo.analyses(expires_at);

-- ヒットカウント増加用のRPC関数
CREATE OR REPLACE FUNCTION increment_analysis_hit_count(analysis_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE llmo.analyses
  SET hit_count = COALESCE(hit_count, 0) + 1
  WHERE id = analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Sitemapスナップショット履歴テーブル
-- ============================================

CREATE TABLE IF NOT EXISTS llmo.sitemap_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- ドメイン情報
  domain TEXT NOT NULL,
  sitemap_url TEXT,

  -- スナップショット統計
  total_urls INTEGER NOT NULL DEFAULT 0,
  analyzed_urls INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2),

  -- スコア分布
  score_distribution JSONB,  -- { "0-20": 5, "21-40": 10, ... }

  -- URL一覧（分析済みURLとスコア）
  url_list JSONB,  -- [{ "url": "...", "score": 75, "analyzed_at": "..." }, ...]

  -- メタデータ
  metadata JSONB
);

-- Sitemapスナップショットインデックス
CREATE INDEX IF NOT EXISTS idx_sitemap_snapshots_domain ON llmo.sitemap_snapshots(domain);
CREATE INDEX IF NOT EXISTS idx_sitemap_snapshots_created_at ON llmo.sitemap_snapshots(created_at DESC);

-- ============================================
-- 業界ベンチマークテーブル
-- ============================================

CREATE TABLE IF NOT EXISTS llmo.industry_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 分類
  industry TEXT NOT NULL,      -- technology, healthcare, finance, etc.
  content_type TEXT NOT NULL,  -- blog-post, product-page, etc.
  metric TEXT NOT NULL,        -- llmo_overall, ai_citation, etc.

  -- パーセンタイル
  p10 INTEGER NOT NULL,
  p25 INTEGER NOT NULL,
  p50 INTEGER NOT NULL,  -- median
  p75 INTEGER NOT NULL,
  p90 INTEGER NOT NULL,

  -- サンプルサイズ
  sample_count INTEGER DEFAULT 0,

  -- 更新日時
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(industry, content_type, metric)
);

-- ベンチマークインデックス
CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON llmo.industry_benchmarks(industry, content_type);

-- 初期ベンチマークデータ挿入（汎用デフォルト値）
INSERT INTO llmo.industry_benchmarks (industry, content_type, metric, p10, p25, p50, p75, p90, sample_count)
VALUES
  -- Generic / Blog Post
  ('generic', 'blog-post', 'llmo_overall', 35, 45, 55, 68, 80, 1000),
  ('generic', 'blog-post', 'ai_citation', 30, 42, 52, 65, 78, 1000),
  ('generic', 'blog-post', 'question_fit', 32, 44, 55, 67, 79, 1000),
  ('generic', 'blog-post', 'coverage', 35, 46, 57, 69, 81, 1000),
  ('generic', 'blog-post', 'structure', 38, 48, 58, 70, 82, 1000),
  ('generic', 'blog-post', 'eeat', 28, 40, 50, 62, 75, 1000),
  ('generic', 'blog-post', 'seo_overall', 40, 50, 60, 72, 84, 1000),

  -- Generic / Product Page
  ('generic', 'product-page', 'llmo_overall', 30, 40, 50, 62, 75, 500),
  ('generic', 'product-page', 'ai_citation', 25, 35, 45, 58, 72, 500),
  ('generic', 'product-page', 'seo_overall', 45, 55, 65, 77, 88, 500),

  -- Generic / Documentation
  ('generic', 'documentation', 'llmo_overall', 42, 52, 62, 74, 85, 300),
  ('generic', 'documentation', 'coverage', 48, 58, 68, 78, 88, 300),
  ('generic', 'documentation', 'structure', 50, 60, 70, 80, 90, 300),

  -- Technology / Blog Post
  ('technology', 'blog-post', 'llmo_overall', 40, 50, 60, 72, 84, 800),
  ('technology', 'blog-post', 'ai_citation', 38, 48, 58, 70, 82, 800),
  ('technology', 'blog-post', 'eeat', 35, 45, 55, 67, 80, 800),

  -- Healthcare / Blog Post (YMYL - higher standards)
  ('healthcare', 'blog-post', 'llmo_overall', 32, 42, 52, 64, 76, 400),
  ('healthcare', 'blog-post', 'eeat', 25, 38, 48, 60, 73, 400),
  ('healthcare', 'blog-post', 'ai_citation', 28, 40, 50, 62, 75, 400)
ON CONFLICT (industry, content_type, metric) DO NOTHING;

-- ============================================
-- RLS ポリシー（必要に応じて）
-- ============================================

-- sitemap_snapshots は public read, authenticated write
ALTER TABLE llmo.sitemap_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sitemap_snapshots_public_read" ON llmo.sitemap_snapshots
  FOR SELECT USING (true);

CREATE POLICY "sitemap_snapshots_authenticated_write" ON llmo.sitemap_snapshots
  FOR INSERT WITH CHECK (true);

-- industry_benchmarks は public read only
ALTER TABLE llmo.industry_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "benchmarks_public_read" ON llmo.industry_benchmarks
  FOR SELECT USING (true);
