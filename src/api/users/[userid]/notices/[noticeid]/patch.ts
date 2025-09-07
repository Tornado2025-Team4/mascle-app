import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest, ApiErrorNotFound } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqBody {
    is_read: boolean;
}

interface respBody {
    is_read: boolean;
}

export default async function patch(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    const noticeId = c.req.param('noticeid');
    const body = await c.req.json() as reqBody;

    if (typeof body.is_read !== 'boolean') {
        throw new ApiErrorBadRequest('is_read must be a boolean');
    }

    // ユーザーのrel_idを取得
    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const userRelId = userData.rel_id;

    // 通知の存在確認
    const { data: noticeData, error: noticeError } = await spClSess
        .from('notices_master')
        .select('rel_id')
        .eq('pub_id', noticeId)
        .single();

    if (noticeError || !noticeData) {
        throw new ApiErrorNotFound(`Notice not found: ${noticeId}`);
    }

    const noticeRelId = noticeData.rel_id;

    // 通知の割り当て確認と更新
    const { data: assignmentData, error: assignmentUpdateError } = await spClSess
        .from('notices_lines_assigned_users')
        .update({ is_read: body.is_read })
        .eq('notice_rel_id', noticeRelId)
        .eq('target_user_rel_id', userRelId)
        .select('is_read')
        .single();

    if (assignmentUpdateError) {
        if (assignmentUpdateError.code === 'PGRST116') {
            throw new ApiErrorNotFound(`Notice assignment not found for user`);
        }
        throw new ApiErrorFatal(`Failed to update notice read status: ${assignmentUpdateError.message}`);
    }

    if (!assignmentData) {
        throw new ApiErrorNotFound(`Notice assignment not found for user`);
    }

    return c.json({
        is_read: assignmentData.is_read
    } as respBody);
}
