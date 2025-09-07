import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Context, MiddlewareHandler } from 'hono';
import { ApiEnv } from './get_env';
import { mustGetCtx } from './get_ctx';
import { UserJwtInfo } from './verify_jwt';
import { ApiErrorUnauthorized } from './error';

export const createSupabaseSess = async (c: Context):
    Promise<SupabaseClient | null> => {
    const userAuthnInfo = c.get('userJwtInfo') as UserJwtInfo | null;
    if (!userAuthnInfo) {
        return null;
    }
    const env = mustGetCtx<ApiEnv>(c, 'env');

    const spClSess = createClient(env.supabase.url, env.supabase.key_anon, {
        global: {
            headers: {
                Authorization: `Bearer ${userAuthnInfo.raw}`
            }
        }
    });

    return spClSess;
}

export const createSupabaseSessMW: MiddlewareHandler = async (c, next) => {
    if (c.get('supabaseClientSess')) {
        await next();
        return;
    }
    const supabaseSess = await createSupabaseSess(c);
    if (!supabaseSess) {
        throw new ApiErrorUnauthorized('API Environment', 'Failed to create Supabase session');
    }
    c.set('supabaseClientSess', supabaseSess);
    await next();
}

export const createSupabaseSessMWOptional: MiddlewareHandler = async (c, next) => {
    if (c.get('supabaseClientSess')) {
        await next();
        return;
    }
    const supabaseSess = await createSupabaseSess(c);
    if (!supabaseSess) {
        await next();
        return;
    }
    c.set('supabaseClientSess', supabaseSess);
    await next();
}