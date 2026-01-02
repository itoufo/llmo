-- ============================================
-- Learning スキーマ用 RLS ポリシー
-- ============================================

-- progress テーブル
ALTER TABLE learning.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON learning.progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON learning.progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON learning.progress FOR UPDATE
  USING (auth.uid() = user_id);

-- quiz_results テーブル
ALTER TABLE learning.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON learning.quiz_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON learning.quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- bookmarks テーブル
ALTER TABLE learning.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bookmarks"
  ON learning.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- progress テーブル拡張
-- ============================================
ALTER TABLE learning.progress
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- quiz_results テーブル拡張
ALTER TABLE learning.quiz_results
  ADD COLUMN IF NOT EXISTS total_questions INTEGER,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION learning.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS progress_updated_at ON learning.progress;
CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON learning.progress
  FOR EACH ROW
  EXECUTE FUNCTION learning.update_updated_at();
