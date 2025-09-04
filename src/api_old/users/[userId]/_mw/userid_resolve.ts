import { MiddlewareHandler } from 'hono';
import { ApiErrorInternalServerError, ApiErrorNotFound, ApiErrorUnauthorized } from '@/src/api/_cmn/error';
import { UnemptyString } from '@/src/api/_cmn/unemptystr';
import { UserAuthnInfo, verifyUserAuthnFn } from '../../../_mw/verify_user_authn';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UserSpecificId {
    uuid: UnemptyString,
    isUuidVerified: boolean,
    isSelf: boolean
}

export const resolveUserIdMW: MiddlewareHandler = async (c, next) => {
    if (c.get('userSpecificId')) {
        return await next();
    }

    const userIdRaw = c.req.param('userId');
    if (!userIdRaw) {
        return new ApiErrorUnauthorized().into_resp(c);
    }
    const userId = UnemptyString
        .new_safe(userIdRaw);
    if (!userId) {
        return new ApiErrorUnauthorized().into_resp(c);
    }

    // 自己指定の場合
    if (userId.v === 'me') {
        const result = await verifyUserAuthnFn(c);
        if (result instanceof Response) {
            return result;
        }
        const userAuthnInfo = c.get('userAuthnInfo') as UserAuthnInfo | null;
        if (!userAuthnInfo) {
            return new ApiErrorUnauthorized().into_resp(c);
        }
        const uuid = UnemptyString.new_safe(userAuthnInfo.userObj.id);
        if (!uuid) {
            return new ApiErrorUnauthorized().into_resp(c);
        }
        c.set('userSpecificId', {
            uuid: uuid,
            isUuidVerified: true,
            isSelf: true
        } as UserSpecificId);
    }
    // ハンドルネーム指定の場合
    else if (userId.v.startsWith('@')) {
        const handle = userId.v.slice(1);
        const handleUnempty = UnemptyString.new_safe(handle);
        if (!handleUnempty) {
            return new ApiErrorNotFound("User").into_resp(c);
        }
        const apClSess = c.get('supabaseClientSess');
        if (!apClSess) {
            console.error("Supabase client is not available");
            return new ApiErrorInternalServerError().into_resp(c);
        }
        const { data, error } = await apClSess
            .from('users_master')
            .select('in_spbs_id')
            .eq('handle_id', handle)
            .single();
        if (error || !data) {
            return new ApiErrorNotFound("User").into_resp(c);
        }
        const uuid = UnemptyString.new_safe(data.in_spbs_id);
        if (!uuid) {
            return new ApiErrorNotFound("User").into_resp(c);
        }
        c.set('userSpecificId', {
            uuid: uuid,
            isUuidVerified: true,
            isSelf: false
        } as UserSpecificId);
    }
    // uuidフォーマット
    else if (uuidRegex.test(userId.v)) {
        c.set('userSpecificId', {
            uuid: userId,
            isUuidVerified: false,
            isSelf: false
        } as UserSpecificId);
    } else {
        return new ApiErrorUnauthorized().into_resp(c);
    }

    return await next();
}
