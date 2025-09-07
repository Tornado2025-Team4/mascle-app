import { Context } from 'hono';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';
import { ApiErrorFatal, ApiErrorNotFound, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function deleteMessage(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

    const dmid = c.req.param('dmid');
    const messageid = c.req.param('messageid');

    if (!dmid || !messageid) {
        throw new ApiErrorNotFound('Message not found');
    }

    const currentUserId = userJwtInfo.obj.id;

    const { data: currentUserData, error: currentUserError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('auth_id', currentUserId)
        .single();

    if (currentUserError || !currentUserData) {
        throw new ApiErrorFatal('Failed to get current user data');
    }

    const { data: pairData, error: pairError } = await spClSess
        .from('dm_pairs_master')
        .select('rel_id, user_a_rel_id, user_b_rel_id')
        .eq('pub_id', dmid)
        .single();

    if (pairError || !pairData) {
        throw new ApiErrorNotFound('DM pair not found');
    }

    const isUserA = pairData.user_a_rel_id === currentUserData.rel_id;
    const isUserB = pairData.user_b_rel_id === currentUserData.rel_id;

    if (!isUserA && !isUserB) {
        throw new ApiErrorNotFound('DM pair not found');
    }

    const { data: messageData, error: messageError } = await spClSess
        .from('dm_pair_messages_master')
        .select('sent_user_rel_id')
        .eq('pub_id', messageid)
        .eq('dm_pair_rel_id', pairData.rel_id)
        .single();

    if (messageError || !messageData) {
        throw new ApiErrorNotFound('Message not found');
    }

    if (messageData.sent_user_rel_id !== currentUserData.rel_id) {
        throw new ApiErrorForbidden('You can only delete your own messages');
    }

    const { error: deleteError } = await spClSess
        .from('dm_pair_messages_master')
        .delete()
        .eq('pub_id', messageid)
        .eq('dm_pair_rel_id', pairData.rel_id)
        .eq('sent_user_rel_id', currentUserData.rel_id);

    if (deleteError) {
        throw new ApiErrorFatal('Failed to delete message');
    }

    return c.json({ success: true });
}