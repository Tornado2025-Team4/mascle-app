import { MiddlewareHandler } from 'hono';
import { ApiErrorFatal } from './error';

export interface ApiEnv {
    supabase: {
        url: string,
        key_anon: string,
        key_service_pvt: string,
    }
}

const mustGetEnv = (name: string): string => {
    const env = process.env[name];
    if (typeof env === 'string') {
        return env
    } else {
        throw new ApiErrorFatal(`Environment variable '${name}' is not set.`);
    }
}

export const getEnv = async (): Promise<ApiEnv> => {
    const env = {
        supabase: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
            key_anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            key_service_pvt: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        }
    } as ApiEnv;
    if (!env.supabase.url || !env.supabase.key_anon || !env.supabase.key_service_pvt) {
        throw new ApiErrorFatal('Supabase environment variables are not set.');
    }
    return env;
}

export const getEnvMW: MiddlewareHandler = async (c, next) => {
    c.set('env', await getEnv());
    await next();
}