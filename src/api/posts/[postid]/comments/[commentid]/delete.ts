import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorNotFound, ApiErrorForbidden } from '../../../../_cmn/error';
import { mustGetCtx } from '../../../../_cmn/get_ctx';
import { UserJwtInfo } from '../../../../_cmn/verify_jwt';

export default async function del(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
    const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');
    const postid = c.req.param('postid');
    const commentid = c.req.param('commentid');

    const currentUserId = userJwtInfo.obj.id;

    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', currentUserId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    // まず投稿へのアクセス権限を確認
    const { data: postViewData, error: postViewError } = await spClSess
        .from('views_user_post')
        .select('pub_id, privacy_allowed_posts')
        .eq('pub_id', postid)
        .single();

    if (postViewError || !postViewData || !postViewData.privacy_allowed_posts) {
        throw new ApiErrorNotFound('Post');
    }

    // アクセス権限が確認できたら、サービスロールで実際のデータ操作
    const { data: commentData, error: commentError } = await spClSrv
        .from('comments_master')
        .select('rel_id, user_rel_id')
        .eq('pub_id', commentid)
        .single();

    if (commentError || !commentData) {
        throw new ApiErrorNotFound('Comment');
    }

    if (commentData.user_rel_id !== userData.rel_id) {
        throw new ApiErrorForbidden('Comment deletion');
    }

    const { error: deleteError } = await spClSrv
        .from('comments_master')
        .delete()
        .eq('rel_id', commentData.rel_id);

    if (deleteError) {
        throw new ApiErrorFatal(`Failed to delete comment: ${deleteError.message}`);
    }

    return c.json({ success: true });
}