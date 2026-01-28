-- ============================================
-- 修正: auth.usersへの直接トリガーを削除し、
-- 代わりにSupabase Authフックで処理
-- ============================================

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- プロファイル作成用のRPC関数
-- （Supabase Auth Hookまたはクライアントサイドから呼び出し）
CREATE OR REPLACE FUNCTION public.handle_new_user(
  user_id UUID,
  user_email TEXT,
  user_metadata JSONB
)
RETURNS void AS $$
DECLARE
  new_tenant_id UUID;
  user_name TEXT;
BEGIN
  -- メタデータから名前を取得
  user_name := COALESCE(user_metadata->>'name', user_email);
  
  -- プロファイルが存在しない場合のみ作成
  INSERT INTO public.profiles (id, display_name)
  VALUES (user_id, user_name)
  ON CONFLICT (id) DO NOTHING;
  
  -- デフォルトテナントが存在しない場合のみ作成
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_users 
    WHERE tenant_users.user_id = handle_new_user.user_id
  ) THEN
    -- 個人テナントを作成
    INSERT INTO public.tenants (name, slug, plan)
    VALUES (
      user_name || '''s Workspace',
      'personal-' || REPLACE(user_id::text, '-', ''),
      'free'
    )
    RETURNING id INTO new_tenant_id;
    
    -- ユーザーをテナントオーナーとして追加
    INSERT INTO public.tenant_users (tenant_id, user_id, role, accepted_at)
    VALUES (new_tenant_id, handle_new_user.user_id, 'owner', NOW());
    
    -- デフォルトテナントとして設定
    UPDATE public.profiles
    SET default_tenant_id = new_tenant_id
    WHERE profiles.id = handle_new_user.user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- プロファイル作成後のトリガーも削除（循環参照を防ぐ）
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.create_default_tenant();

-- RPC関数へのアクセス権限を付与
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;