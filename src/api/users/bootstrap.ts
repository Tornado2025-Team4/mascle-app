import { Context } from 'hono';
import { mustGetCtx } from '../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserJwtInfo, verifyJwtMW } from '../_cmn/verify_jwt';
import { ApiErrorFatal } from '../_cmn/error';
// Node.js 18+ / Edge Runtime で利用可能
// 依存を避けるため nanoid ではなく crypto.randomUUID を使用

export const bootstrapMW = verifyJwtMW;

export default async function post(c: Context) {
  const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
  const userJwt = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');
  const authId = userJwt.obj.id;

  // 既存チェック
  const { data: existing, error: checkErr } = await spClSrv
    .from('users_master')
    .select('rel_id, pub_id')
    .eq('auth_id', authId)
    .single();
  if (checkErr && checkErr.code !== 'PGRST116') {
    throw new ApiErrorFatal(`Bootstrap check failed: ${checkErr.message}`);
  }
  if (existing) {
    return c.json({ ok: true, pub_id: existing.pub_id, created: false });
  }

  const pubId = crypto.randomUUID();
  const anonPubId = `~${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

  const { data: inserted, error: insErr } = await spClSrv
    .from('users_master')
    .insert({ pub_id: pubId, anon_pub_id: anonPubId, auth_id: authId })
    .select('rel_id, pub_id')
    .single();
  if (insErr || !inserted) {
    throw new ApiErrorFatal(`Failed to create user: ${insErr?.message || 'unknown error'}`);
  }

  // プロフィール行も最低限作成
  const { error: profErr } = await spClSrv
    .from('users_line_profile')
    .insert({ user_rel_id: inserted.rel_id, display_name: null });
  if (profErr) {
    throw new ApiErrorFatal(`Failed to create user profile: ${profErr.message}`);
  }

  return c.json({ ok: true, pub_id: inserted.pub_id, created: true });
}


