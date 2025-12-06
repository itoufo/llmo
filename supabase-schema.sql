-- LLMO Site Doctor Database Schema
-- Supabase SQL Editor で実行してください

-- analyses テーブルの作成
create table if not exists analyses (
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

-- インデックスの作成（検索・ソート用）
create index if not exists idx_analyses_url on analyses(url);
create index if not exists idx_analyses_created_at on analyses(created_at desc);
create index if not exists idx_analyses_overall on analyses(overall desc);

-- コメント追加
comment on table analyses is 'LLMO診断結果を保存するテーブル';
comment on column analyses.url is '診断対象のURL';
comment on column analyses.ai_citation is 'AI引用スコア (0-100)';
comment on column analyses.question_fit is '質問適合スコア (0-100)';
comment on column analyses.coverage is '概念カバレッジスコア (0-100)';
comment on column analyses.structure is '構造スコア (0-100)';
comment on column analyses.eeat is 'E-E-A-Tスコア (0-100)';
comment on column analyses.overall is '総合スコア (0-100)';
comment on column analyses.improvements is '改善点のリスト（JSON配列）';
comment on column analyses.raw_result is 'LLMから返された生の評価結果（JSON）';
comment on column analyses.created_at is '診断実行日時';

-- analysis_jobs テーブルの作成（バックグラウンドジョブ管理用）
create table if not exists analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'error')),
  result jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- インデックスの作成
create index if not exists idx_analysis_jobs_status on analysis_jobs(status);
create index if not exists idx_analysis_jobs_created_at on analysis_jobs(created_at desc);

-- コメント追加
comment on table analysis_jobs is 'バックグラウンド分析ジョブを管理するテーブル';
comment on column analysis_jobs.status is 'ジョブステータス: pending, processing, completed, error';
comment on column analysis_jobs.result is '分析結果（JSON）';
comment on column analysis_jobs.error is 'エラーメッセージ';
