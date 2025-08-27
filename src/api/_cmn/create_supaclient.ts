import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Context, MiddlewareHandler } from 'hono';
import { ApiEnv } from './get_env';
import { mustGetCtx } from './get_ctx';

export const createSupabaseClient = async (c: Context):
    Promise<{ anon: SupabaseClient, service: SupabaseClient }> => {
    const env = mustGetCtx<ApiEnv>(c, 'env');
    return {
        anon: createClient(
            env.supabase.url,
            env.supabase.key_anon),
        service: createClient(
            env.supabase.url,
            env.supabase.key_service_pvt)
    }
}

export const createSupabaseClientMW: MiddlewareHandler = async (c, next) => {
    const { anon, service } = await createSupabaseClient(c);

    c.set('supabaseClientAnon', anon);
    c.set('supabaseClientService', service);

    await next();
}