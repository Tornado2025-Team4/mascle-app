import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest, ApiErrorForbidden, ApiErrorNotFound } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';

interface reqBody {
    target_user_pub_id: string;
    action: 'block' | 'unblock';
}

interface respBody {
    success: boolean;
}

export default async function patch(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const userJwtInfo = c.get('userJwtInfo') as UserJwtInfo | null;
    if (!userJwtInfo || userJwtInfo.obj.id !== userIdInfo.pubId) {
        throw new ApiErrorForbidden('blocks', 'Can only modify your own block list');
    }

    const body = await c.req.json() as reqBody;

    if (!body.target_user_pub_id || typeof body.target_user_pub_id !== 'string') {
        throw new ApiErrorBadRequest('target_user_pub_id is required');
    }

    if (!body.action || !['block', 'unblock'].includes(body.action)) {
        throw new ApiErrorBadRequest('action must be "block" or "unblock"');
    }

    const { data: pathUserRel, error: pathUserRelError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (pathUserRelError || !pathUserRel) {
        throw new ApiErrorFatal(`Failed to get path user rel_id: ${pathUserRelError?.message}`);
    }

    const { data: targetUserRel, error: targetUserRelError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', body.target_user_pub_id)
        .single();

    if (targetUserRelError || !targetUserRel) {
        throw new ApiErrorNotFound('Target user not found');
    }

    if (pathUserRel.rel_id === targetUserRel.rel_id) {
        throw new ApiErrorBadRequest('Cannot block/unblock yourself');
    }

    if (body.action === 'block') {
        await spClSess
            .from('users_lines_followings')
            .delete()
            .or(`and(user_rel_id.eq.${pathUserRel.rel_id},target_user_rel_id.eq.${targetUserRel.rel_id}),and(user_rel_id.eq.${targetUserRel.rel_id},target_user_rel_id.eq.${pathUserRel.rel_id})`);

        const { error: insertError } = await spClSess
            .from('users_lines_blocks')
            .insert({
                user_rel_id: pathUserRel.rel_id,
                target_user_rel_id: targetUserRel.rel_id
            });

        if (insertError) {
            if (insertError.code === '23505') {
                throw new ApiErrorBadRequest('Already blocking this user');
            }
            throw new ApiErrorFatal(`Failed to block user: ${insertError.message}`);
        }
    } else {
        const { error: deleteError } = await spClSess
            .from('users_lines_blocks')
            .delete()
            .eq('user_rel_id', pathUserRel.rel_id)
            .eq('target_user_rel_id', targetUserRel.rel_id);

        if (deleteError) {
            throw new ApiErrorFatal(`Failed to unblock user: ${deleteError.message}`);
        }
    }

    return c.json({ success: true } as respBody);
}