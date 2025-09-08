import { SupabaseClient, User } from "@supabase/supabase-js";
import { MiddlewareHandler } from "hono";
import { mustGetCtx } from "./get_ctx";
import { ApiErrorUnauthorized } from "./error";

export interface UserJwtInfo {
    raw: string,
    obj: User
}

export const verifyJwt = async (
    spClAnon: SupabaseClient,
    token: string
): Promise<User | null> => {
    const { data, error } = await spClAnon.auth.getUser(token);
    if (error || !data || !data.user) {
        return null;
    }
    return data.user;
}

export const verifyJwtMW: MiddlewareHandler = async (c, next) => {
    if (c.get('userJwtInfo')) {
        await next();
        return;
    }
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    let jwt: string | undefined;

    // 1. Authorizationヘッダーから取得を試行
    const authHeader = c.req.header('authorization');
    if (authHeader) {
        jwt = authHeader?.replace(/^Bearer\s+/i, '');
    }

    // 2. cookieから取得を試行
    if (!jwt) {
        const cookieHeader = c.req.header('cookie');
        if (cookieHeader) {
            // Supabaseのauth-tokenクッキーを探す
            const authTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
            if (authTokenMatch) {
                try {
                    // base64エンコードされたJSONをデコード
                    const base64Data = authTokenMatch[1].replace('base64-', '');
                    const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
                    const authData = JSON.parse(decoded);
                    jwt = authData.access_token;
                } catch (error) {
                    console.warn('Failed to parse auth token from cookie:', error);
                }
            }
        }
    }

    if (jwt) {
        const userJwtInfo = await verifyJwt(spClAnon, jwt);
        if (userJwtInfo) {
            c.set('userJwtInfo', {
                raw: jwt,
                obj: userJwtInfo
            });
            await next();
            return;
        }
    }

    throw new ApiErrorUnauthorized('API Endpoint', 'need valid JWT');
}

export const verifyJwtMWOptional: MiddlewareHandler = async (c, next) => {
    if (c.get('userJwtInfo')) {
        await next();
        return;
    }
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    let jwt: string | undefined;

    // 1. Authorizationヘッダーから取得を試行
    const authHeader = c.req.header('authorization');
    if (authHeader) {
        jwt = authHeader?.replace(/^Bearer\s+/i, '');
    }

    // 2. cookieから取得を試行
    if (!jwt) {
        const cookieHeader = c.req.header('cookie');
        if (cookieHeader) {
            // Supabaseのauth-tokenクッキーを探す
            const authTokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
            if (authTokenMatch) {
                try {
                    // base64エンコードされたJSONをデコード
                    const base64Data = authTokenMatch[1].replace('base64-', '');
                    const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
                    const authData = JSON.parse(decoded);
                    jwt = authData.access_token;
                } catch (error) {
                    console.warn('Failed to parse auth token from cookie:', error);
                }
            }
        }
    }

    if (jwt) {
        const userJwtInfo = await verifyJwt(spClAnon, jwt);
        if (userJwtInfo) {
            c.set('userJwtInfo', {
                raw: jwt,
                obj: userJwtInfo
            });
        }
    }

    await next();
}