import { MiddlewareHandler } from 'hono';
import { ApiErrorInternalServerError, FatalErrorHandler } from '../_cmn/error';
import { createClient } from '@/utils/supabase/client';

export const createSupabaseSessionMW: MiddlewareHandler = async (c, next) => {
    const userAuthnInfo = c.get('userAuthnInfo');
    if (!userAuthnInfo) {
        await FatalErrorHandler(c, "need to call verifyUserAuthnMW before createSupabaseSessionMW");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const supabaseClientWithSession = createClient();
    await supabaseClientWithSession.auth.setSession({
        access_token: userAuthnInfo.jwtRaw,
        refresh_token: '',
    });
    c.set('supabaseClientSess', supabaseClientWithSession);

    await next();
};
