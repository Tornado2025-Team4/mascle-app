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
    const authHeader = c.req.header('authorization');
    if (authHeader) {
        const jwt = authHeader?.replace(/^Bearer\s+/i, '');
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
    }
    throw new ApiErrorUnauthorized('API Endpoint', 'need valid JWT');
}

export const verifyJwtMWOptional: MiddlewareHandler = async (c, next) => {
    if (c.get('userJwtInfo')) {
        await next();
        return;
    }
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
    const authHeader = c.req.header('authorization');
    if (authHeader) {
        const jwt = authHeader?.replace(/^Bearer\s+/i, '');
        if (jwt) {
            const userJwtInfo = await verifyJwt(spClAnon, jwt);
            if (userJwtInfo) {
                c.set('userJwtInfo', {
                    raw: jwt,
                    obj: userJwtInfo
                });
            }
        }
    }
    await next();
}