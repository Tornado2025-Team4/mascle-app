import { Hono } from 'hono';
import { mustGetCtx } from '../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

//! api/authに依存: 現在フロントエンドから直接使用されていないが、認証状態チェック用のエンドポイント
const app_auth = new Hono();

const getCookieMap = (cookieHeader?: string | null): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  cookieHeader.split(/;\s*/).forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const k = decodeURIComponent(pair.slice(0, idx));
      const v = decodeURIComponent(pair.slice(idx + 1));
      map[k] = v;
    }
  });
  return map;
};

app_auth.get('/me', async (c) => {
  //! api/authに依存: このエンドポイントは現在フロントエンドから使用されていない
  //! 実際の認証チェックはmiddleware.tsで/api/users/me/profileを使用している
  const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
  const authHeader = c.req.header('authorization');
  let token: string | null = null;
  if (authHeader?.match(/^Bearer\s+/i)) {
    token = authHeader.replace(/^Bearer\s+/i, '');
  } else {
    const cookies = getCookieMap(c.req.header('cookie'));
    token = cookies['sb-access-token'] || null;
  }
  if (!token) {
    return c.json({ authenticated: false, reason: 'missing token' }, 401);
  }
  const { data, error } = await spClAnon.auth.getUser(token);
  if (error || !data?.user) {
    return c.json({ authenticated: false, reason: error?.message || 'invalid token' }, 401);
  }
  return c.json({ authenticated: true, user: data.user });
});

export default app_auth;


