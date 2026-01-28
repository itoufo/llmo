-- ============================================
-- マルチテナント・ユーザー対応
-- ============================================

-- テナント（OEM先企業）テーブル
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- テナント情報
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URLスラッグ（例: acme-corp）

  -- カスタマイズ設定（OEM用）
  settings JSONB DEFAULT '{}'::jsonb,
  -- 例: { "logo_url": "...", "primary_color": "#xxx", "custom_domain": "..." }

  -- プラン・制限
  plan TEXT DEFAULT 'free', -- free, pro, enterprise
  monthly_limit INTEGER DEFAULT 100, -- 月間診断上限

  -- 状態
  is_active BOOLEAN DEFAULT true
);

-- テナントユーザー関連テーブル
CREATE TABLE public.tenant_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ロール
  role TEXT DEFAULT 'member', -- owner, admin, member

  -- 招待状態
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, user_id)
);

-- ユーザープロファイル（auth.usersの拡張）
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- プロファイル情報
  display_name TEXT,
  avatar_url TEXT,

  -- デフォルトテナント（複数テナント所属時）
  default_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- ============================================
-- llmo.analyses にユーザー・テナント追加
-- ============================================

ALTER TABLE llmo.analyses
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

CREATE INDEX idx_llmo_analyses_user ON llmo.analyses(user_id);
CREATE INDEX idx_llmo_analyses_tenant ON llmo.analyses(tenant_id);

-- ============================================
-- RLS（Row Level Security）設定
-- ============================================

-- テナントテーブル
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenants" ON public.tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their tenant" ON public.tenants
  FOR UPDATE USING (
    id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- テナントユーザーテーブル
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant members" ON public.tenant_users
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tenant users" ON public.tenant_users
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- プロファイルテーブル
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 診断結果テーブル
ALTER TABLE llmo.analyses ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の診断結果を閲覧可能
CREATE POLICY "Users can view own analyses" ON llmo.analyses
  FOR SELECT USING (user_id = auth.uid());

-- テナントメンバーはテナントの診断結果を閲覧可能
CREATE POLICY "Tenant members can view tenant analyses" ON llmo.analyses
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- ユーザーは自分の診断結果を作成可能
CREATE POLICY "Users can insert own analyses" ON llmo.analyses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- サービスロールは全てアクセス可能（Edge Function用）
CREATE POLICY "Service role has full access" ON llmo.analyses
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- トリガー: プロファイル自動作成
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- トリガー: 新規ユーザーにデフォルトテナント作成
-- ============================================

CREATE OR REPLACE FUNCTION public.create_default_tenant()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- 個人テナントを作成
  INSERT INTO public.tenants (name, slug, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', 'Personal'),
    'personal-' || REPLACE(NEW.id::text, '-', ''),
    'free'
  )
  RETURNING id INTO new_tenant_id;

  -- ユーザーをテナントオーナーとして追加
  INSERT INTO public.tenant_users (tenant_id, user_id, role, accepted_at)
  VALUES (new_tenant_id, NEW.id, 'owner', NOW());

  -- デフォルトテナントとして設定
  UPDATE public.profiles
  SET default_tenant_id = new_tenant_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_tenant();
