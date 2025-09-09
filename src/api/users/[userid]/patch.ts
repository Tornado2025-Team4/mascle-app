import { Context } from 'hono';
import { ApiErrorBadRequest, ApiErrorConflict, ApiErrorFatal } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from './_cmn/userid_resolve';

export default async function patch(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    const body = await c.req.json();

    const updateTarget = {
        handle: body.hasOwnProperty('handle') ? body.handle ?? null : undefined
    } as {
        handle?: string
    };

    if (
        updateTarget.handle !== undefined
        && updateTarget.handle === null // NN
    ) {
        throw new ApiErrorBadRequest("Handle cannot be null");
    }

    if (
        updateTarget.handle !== undefined
        && !/^@[a-zA-Z0-9_\.-]{3,30}$/.test(updateTarget.handle)
    ) {
        throw new ApiErrorBadRequest("Handle format is invalid", "Should match ^@[a-zA-Z0-9_\\.-]{3,30}$");
    }

    const { error: updateError } = await spClSess
        .from('users_master')
        .update(updateTarget)
        .eq('pub_id', userIdInfo.pubId);
    if (updateError) {
        if (updateError.code === '23505') {
            throw new ApiErrorConflict("Handle", "Already taken");
        }
        throw new ApiErrorFatal(`DB update error ${updateError.message}`);
    }

    const { error: initedError } = await spClSess
        .from('users_master')
        .update({ inited: true })
        .eq('pub_id', userIdInfo.pubId);
    if (initedError) {
        throw new ApiErrorFatal(`Failed to update inited flag: ${initedError.message}`);
    }

    return c.json({ success: true });
}
