import { Hono } from 'hono';
import { mustGetCtx } from '../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserJwtInfo, verifyJwtMW } from '../_cmn/verify_jwt';
import { ApiErrorBadRequest, ApiErrorFatal } from '../_cmn/error';

const app_setup = new Hono();

app_setup.post('/', verifyJwtMW, async (c) => {
  try {
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
    const userJwt = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');
    const authId = userJwt.obj.id; // UUID (auth.users.id)
    const email = userJwt.obj.email ?? undefined;

    const body = await c.req.json().catch(() => ({}));
    const rawName: string | undefined = body?.display_name;
    if (!rawName || typeof rawName !== 'string') {
      throw new ApiErrorBadRequest('setup', 'display_name is required');
    }
    const displayName = rawName.trim();
    if (displayName.length === 0) {
      throw new ApiErrorBadRequest('setup', 'display_name must not be empty');
    }
    if (displayName.length > 100) {
      throw new ApiErrorBadRequest('setup', 'display_name is too long');
    }

    // users_master upsert (pub_id は auth.users.id に一致)
    const { data: existing, error: checkErr } = await spClSrv
      .from('users_master')
      .select('rel_id, pub_id, anon_pub_id, handle')
      .eq('pub_id', authId)
      .maybeSingle();
    if (checkErr) throw new ApiErrorFatal(`users_master check failed: ${checkErr.message}`);

    let userRelId: number | null = null;
    if (!existing) {
      const randomBase = crypto.randomUUID().replace(/-/g, '');
      const anonPubId = `~${randomBase.slice(0, 21)}`; // 長さ22: ~ + 21
      const baseHandle = (email?.split('@')[0] || anonPubId.slice(1)).replace(/[^a-zA-Z0-9_\.\-]/g, '').slice(0, 30);
      let handle = `@${baseHandle.replace(/^@+/, '')}`;
      if (handle.length < 3) handle = `@${anonPubId.slice(1)}`;

      // 衝突回避を数回試行
      for (let i = 0; i < 3; i++) {
        const { data: inserted, error: insErr } = await spClSrv
          .from('users_master')
          .insert({ pub_id: authId, anon_pub_id: anonPubId, handle })
          .select('rel_id, pub_id')
          .single();
        if (!insErr && inserted) {
          userRelId = inserted.rel_id;
          break;
        }
        if (insErr && /handle/i.test(insErr.message)) {
          handle = `@${baseHandle.slice(0, 27)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          continue;
        }
        throw new ApiErrorFatal(`create users_master failed: ${insErr?.message || 'unknown'}`);
      }
      if (!userRelId) {
        throw new ApiErrorFatal('create users_master failed: unknown');
      }
    } else {
      userRelId = existing.rel_id;
      // 既存ユーザーの handle を必要に応じて更新（display_name から再生成し、差分があれば更新）
      const currentHandle = existing.handle as string | null;
      const anonId = existing.anon_pub_id as string | null;
      const baseHandle = (email?.split('@')[0] || displayName || (anonId ? anonId.slice(1) : 'user'))
        .replace(/[^a-zA-Z0-9_\.\-]/g, '')
        .slice(0, 30);
      let desired = `@${baseHandle.replace(/^@+/, '')}`;
      if (desired.length < 3 && anonId) desired = `@${anonId.slice(1)}`;

      // 更新条件: 未設定/匿名デフォルト/現在値と異なる場合
      const shouldUpdate = !currentHandle || currentHandle === `@${anonId?.slice(1)}` || currentHandle !== desired;
      if (shouldUpdate) {
        for (let i = 0; i < 3; i++) {
          const { error: updErr } = await spClSrv
            .from('users_master')
            .update({ handle: desired })
            .eq('pub_id', authId);
          if (!updErr) break;
          if (/handle/i.test(updErr.message)) {
            desired = `@${baseHandle.slice(0, 27)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
            continue;
          }
          throw new ApiErrorFatal(`update users_master.handle failed: ${updErr.message}`);
        }
      }
    }

    // users_line_profile upsert
    const { data: prof, error: profSelErr } = await spClSrv
      .from('users_line_profile')
      .select('user_rel_id')
      .eq('user_rel_id', userRelId)
      .maybeSingle();
    if (profSelErr) throw new ApiErrorFatal(`profile check failed: ${profSelErr.message}`);

    if (!prof) {
      const { error: profInsErr } = await spClSrv
        .from('users_line_profile')
        .insert({ user_rel_id: userRelId, display_name: displayName });
      if (profInsErr) throw new ApiErrorFatal(`profile create failed: ${profInsErr.message}`);
    } else {
      const { error: profUpdErr } = await spClSrv
        .from('users_line_profile')
        .update({ display_name: displayName })
        .eq('user_rel_id', userRelId);
      if (profUpdErr) throw new ApiErrorFatal(`profile update failed: ${profUpdErr.message}`);
    }

    // 最終状態を返却
    const { data: finalUser } = await spClSrv
      .from('users_master')
      .select('pub_id, handle, anon_pub_id')
      .eq('pub_id', authId)
      .single();
    const { data: finalProfile } = await spClSrv
      .from('users_line_profile')
      .select('display_name')
      .eq('user_rel_id', userRelId)
      .single();
    return c.json({ ok: true, user: finalUser, profile: finalProfile });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    console.error('[setup] error', e);
    return c.json({ ok: false, error: msg }, 500);
  }
});

export default app_setup;


