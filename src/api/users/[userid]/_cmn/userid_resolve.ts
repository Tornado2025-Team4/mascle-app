import { ApiErrorNotFound, ApiErrorUnauthorized } from "@/src/api/_cmn/error";
import { mustGetCtx } from "@/src/api/_cmn/get_ctx";
import { mustGetPath } from "@/src/api/_cmn/get_path";
import { UserJwtInfo } from "@/src/api/_cmn/verify_jwt";
import { SupabaseClient } from "@supabase/supabase-js";
import { Context, MiddlewareHandler } from "hono";

export interface UserIdInfo {
    pubId: string;
    anonPubId?: string;
    specByAnon: boolean;
}

export const resolveUserId = async (
    c: Context,
    specUserId: string
): Promise<UserIdInfo> => {
    if (specUserId === 'me') {
        const userAuthnInfo = c.get('userJwtInfo') as UserJwtInfo | null;
        if (!userAuthnInfo) {
            throw new ApiErrorUnauthorized("API Endpoint", "User not authenticated");
        }
        return {
            pubId: userAuthnInfo.obj.id,
            anonPubId: undefined,
            specByAnon: false
        };
    } else if (specUserId.startsWith('@')) {
        const spClService = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
        const { data, error } = await spClService
            .from('users_master')
            .select('pub_id')
            .eq('handle', specUserId)
            .single();
        if (error || !data) {
            throw new ApiErrorNotFound("User");
        }
        return {
            pubId: data.pub_id,
            anonPubId: undefined,
            specByAnon: false
        };
    } else if (specUserId.startsWith('~')) {
        const spClService = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
        const { data, error } = await spClService
            .from('users_master')
            .select('pub_id')
            .eq('anon_pub_id', specUserId)
            .single();
        if (error || !data) {
            throw new ApiErrorNotFound("User");
        }
        return {
            pubId: data.pub_id,
            anonPubId: specUserId,
            specByAnon: true
        };
    } else {
        const spClService = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
        const { data, error } = await spClService
            .from('users_master')
            .select('pub_id')
            .eq('pub_id', specUserId)
            .single();
        if (error || !data) {
            throw new ApiErrorNotFound("User");
        }
        return {
            pubId: data.pub_id,
            anonPubId: undefined,
            specByAnon: false
        };
    }
}

export const resolveUserIdMW: MiddlewareHandler = async (c, next) => {
    const specUserId = mustGetPath(c, 'userid');
    const userIdInfo = await resolveUserId(c, specUserId);
    c.set('userIdInfo', userIdInfo);
    await next();
};
