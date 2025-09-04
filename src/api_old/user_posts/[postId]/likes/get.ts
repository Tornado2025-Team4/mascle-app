/**
 * GET /user_posts/:postId/likes
 *
 * Path Parameters:
 * - postId: string - 投稿ID（pub_id）
 *
 * Query Parameters:
 * - limit?: number - 取得件数の上限（デフォルト: 20、最大: 100）
 * - restart_rel_id?: string - ページネーション用の再開rel_id
 * - resolve_icon_url?: boolean - ユーザーアイコンの署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * [{
 *   uuid: string;
 *   handle: string;
 *   display_name: string | null;
 *   description: string | null;
 *   icon: string | null;
 *   icon_path: string | null;
 *   icon_url?: string | null;
 * }]
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '../../../_cmn/error';
import { checkPostAccess } from '../../../_mw/check_privacy_access';

export default async function get(c: Context) {
    const spClSess = c.get('supabaseClientSess') || c.get('supabaseClientAnon');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClient not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const postId = c.req.param('postId');
    if (!postId) {
        return new ApiErrorNotFound('Post').into_resp(c);
    }

    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;
    const restartRelId = c.req.query('restart_rel_id');
    const resolveIconUrl = c.req.query('resolve_icon_url') === 'true';

    const userAuthnInfo = c.get('userAuthnInfo');
    let currentUserRelId: number | null = null;
    if (userAuthnInfo) {
        const { data: userData, error: userError } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', userAuthnInfo.userObj.id)
            .single();
        if (userData && !userError) {
            currentUserRelId = userData.rel_id;
        }
    }

    if (currentUserRelId) {
        await spClSess.rpc('set_config', {
            setting: 'app.current_user_rel_id',
            value: currentUserRelId.toString()
        });
    }

    const { data: post, error: postError } = await spClSess
        .from('view_user_posts')
        .select('rel_id, pub_id, user_rel_id, visibility')
        .eq('pub_id', postId)
        .single();

    if (postError || !post) {
        return new ApiErrorNotFound('Post').into_resp(c);
    }

    // 投稿へのアクセス権をチェック
    const { canAccess } = await checkPostAccess(
        c,
        post.user_rel_id,
        post.visibility
    );

    if (!canAccess) {
        return new ApiErrorNotFound('Post').into_resp(c);
    }

    let query = spClSess
        .from('user_lines_post_like')
        .select(`
            rel_id,
            user_rel_id,
            created_at
        `)
        .eq('post_rel_id', post.rel_id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (restartRelId) {
        const restartRelIdNum = Number(restartRelId);
        if (!isNaN(restartRelIdNum)) {
            query = query.lt('rel_id', restartRelIdNum);
        }
    }

    const { data: likes, error } = await query;

    if (error) {
        await FatalErrorHandler(c, error, "fetching likes");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!likes || likes.length === 0) {
        return c.json([]);
    }

    const result = [];

    for (const like of likes) {
        const { data: profile, error: profileError } = await spClSess
            .from('view_user_profile_online')
            .select(`
                handle_id,
                display_name,
                description,
                icon,
                icon_path,
                users_master!rel_id(in_spbs_id)
            `)
            .eq('rel_id', like.user_rel_id)
            .single();

        if (profileError) {
            continue;
        }

        let iconUrl: string | null = null;
        if (resolveIconUrl && profile?.icon) {
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                    .from('user_icons')
                    .createSignedUrl(profile.icon, 60 * 60);

                if (!signedUrlError && signedUrlData?.signedUrl) {
                    iconUrl = signedUrlData.signedUrl;
                }
            } catch (e) {
                await FatalErrorHandler(c, e, "creating signed URL for user icon");
            }
        }

        result.push({
            uuid: profile?.users_master?.in_spbs_id || '',
            handle: profile?.handle_id || '',
            display_name: profile?.display_name || null,
            description: profile?.description || null,
            icon: profile?.icon || null,
            icon_path: profile?.icon_path ? (
                Array.isArray(profile.icon_path)
                    ? profile.icon_path.join('/')
                    : profile.icon_path
            ) : null,
            icon_url: resolveIconUrl ? iconUrl : undefined
        });
    }

    return c.json(result);
}