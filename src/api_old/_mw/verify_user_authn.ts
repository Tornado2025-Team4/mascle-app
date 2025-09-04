import { Context, MiddlewareHandler } from 'hono';
import { User } from '@supabase/supabase-js';
import { ApiErrorUnauthorized, ApiErrorInternalServerError, FatalErrorHandler } from '@/src/api/_cmn/error';

export interface UserAuthnInfo {
    jwtRaw: string
    userObj: User
}

export const verifyUserAuthnMW: MiddlewareHandler = async (c, next) => {
    const result = await verifyUserAuthnFn(c);
    if (result instanceof Response) {
        return result;
    }
    await next();
}

export const verifyUserAuthnFn = async (c: Context): Promise<Response | void> => {
    if (c.get('userAuthnInfo')) {
        return;
    }

    const authHeader = c.req.header('authorization');
    if (!authHeader) {
        return new ApiErrorUnauthorized().into_resp(c);
    }
    const jwt = authHeader?.replace(/^Bearer\s+/i, '');
    if (!jwt) {
        return new ApiErrorUnauthorized().into_resp(c);
    }
    const spClAnon = c.get('supabaseClientAnon');
    if (!spClAnon) {
        await FatalErrorHandler(c, "supabaseClientAnon not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const { data, error } = await spClAnon.auth.getUser(jwt);
    if (error || !data.user) {
        return new ApiErrorUnauthorized().into_resp(c);
    }
    c.set('userAuthnInfo', {
        jwtRaw: jwt,
        userObj: data.user
    } as UserAuthnInfo);

    return;
}