/**
 * GET /users/:userId/follows
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters:
 * - is_offline?: boolean - オフラインかどうか（デフォルト: false）
 * - limit?: number - 取得件数の上限（デフォルト: 50）
 * - restart_uuid?: string - 続きから取得するためのユーザーUUID
 * - resolve_icon_url?: boolean - アイコンの署名URLを生成するかどうか（デフォルト: false）
 *
 * Response:
 * Array<{
 *   uuid: string;
 *   handle: string;
 *   display_name: string | null;
 *   description: string | null;
 *   icon: string | null;
 *   icon_path: string[] | null;
 *   icon_url: string | null;
 * }>
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '@/src/api/_cmn/error';
import { UserSpecificId } from '../_mw/userid_resolve';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function get(c: Context) {
    const userSpecificId = c.get('userSpecificId') as UserSpecificId | undefined;
    if (!userSpecificId) {
        await FatalErrorHandler(c, "userSpecificId not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const uuid = userSpecificId.uuid.v;

    const spClSess = c.get('supabaseClientSess') as SupabaseClient;
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClientSess not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const isOfflineParam = c.req.query('is_offline');
    const isOffline = isOfflineParam === 'true';
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const restartUuidParam = c.req.query('restart_uuid');
    const resolveIconUrlParam = c.req.query('resolve_icon_url');
    const resolveIconUrl = resolveIconUrlParam === 'true';

    const { data: userCheck, error: userCheckError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('in_spbs_id', uuid)
        .single();

    if (userCheckError || !userCheck) {
        return new ApiErrorNotFound('User').into_resp(c);
    }

    const targetUserRelId = userCheck.rel_id;

    const userAuthnInfo = c.get('userAuthnInfo');
    let currentUserRelId = null;
    if (userAuthnInfo) {
        const { data: currentUserData } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', userAuthnInfo.userObj.id)
            .single();
        currentUserRelId = currentUserData?.rel_id;
    }

    if (currentUserRelId) {
        await spClSess.rpc('set_config', {
            setting_name: 'app.current_user_rel_id',
            new_value: currentUserRelId.toString(),
            is_local: true
        });
    }

    const viewName = isOffline ? 'view_user_profile_offline' : 'view_user_profile_online';
    const { data: profileCheck, error: profileError } = await spClSess
        .from(viewName)
        .select('rel_id')
        .eq('rel_id', targetUserRelId)
        .single();

    if (profileError || !profileCheck) {
        return new ApiErrorNotFound('Profile access denied').into_resp(c);
    }

    let query = spClSess
        .from('users_lines_follows')
        .select(`
            created_at,
            target_user_rel_id,
            users_master!users_lines_follows_target_user_rel_id_fkey(
                in_spbs_id,
                handle_id
            )
        `)
        .eq('user_rel_id', targetUserRelId)
        .order('created_at', { ascending: false });

    if (restartUuidParam) {
        const { data: restartUser, error: restartUserError } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', restartUuidParam)
            .single();
        if (!restartUserError && restartUser?.rel_id) {
            query = query.lt('rel_id', restartUser.rel_id);
        }
    }

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data: followsData, error: followsError } = await query;

    if (followsError) {
        console.error('Follows fetch error:', followsError);
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!followsData) {
        return c.json([]);
    }

    const results = [];
    for (const follow of followsData) {
        if (!follow.users_master || !Array.isArray(follow.users_master) || follow.users_master.length === 0) continue;

        const targetUser = follow.users_master[0];
        const targetUuid = targetUser.in_spbs_id;
        const handleId = targetUser.handle_id;

        const { data: profileData } = await spClSess
            .from(viewName)
            .select('display_name, description, icon, icon_path')
            .eq('rel_id', follow.target_user_rel_id)
            .single();

        let iconUrl: string | null = null;
        if (resolveIconUrl && profileData?.icon_path) {
            const bucket = 'users_icons';
            const iconPath = profileData.icon_path.join('/');
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                    .from(bucket)
                    .createSignedUrl(iconPath, 60 * 60);
                if (!signedUrlError && signedUrlData?.signedUrl) {
                    iconUrl = signedUrlData.signedUrl;
                }
            } catch (e) {
                console.error('icon signed url exception:', e);
            }
        }

        results.push({
            uuid: targetUuid,
            handle: handleId,
            display_name: profileData?.display_name || null,
            description: profileData?.description || null,
            icon: profileData?.icon || null,
            icon_path: profileData?.icon_path || null,
            icon_url: iconUrl
        });
    }

    return c.json(results);
}
