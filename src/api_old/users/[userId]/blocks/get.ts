/**
 * GET /users/:userId/blocks
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters:
 * - limit?: number - 取得件数の上限（デフォルト: 50）
 * - restart_uuid?: string - 続きから取得するためのユーザーUUID
 *
 * Response:
 * Array<{
 *   uuid: string;
 *   handle: string;
 * }>
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, ApiErrorUnauthorized, FatalErrorHandler } from '@/src/api/_cmn/error';
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

    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const restartUuidParam = c.req.query('restart_uuid');

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

    if (!currentUserRelId || currentUserRelId !== targetUserRelId) {
        return new ApiErrorUnauthorized().into_resp(c);
    }

    let query = spClSess
        .from('users_lines_blocks')
        .select(`
            created_at,
            target_user_rel_id,
            users_master!users_lines_blocks_target_user_rel_id_fkey(
                in_spbs_id,
                handle_id
            )
        `)
        .eq('user_rel_id', targetUserRelId)
        .order('created_at', { ascending: false });

    if (restartUuidParam) {
        const { data: restartUser } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', restartUuidParam)
            .single();

        if (restartUser) {
            query = query.lt('target_user_rel_id', restartUser.rel_id);
        } else {
            return new ApiErrorNotFound('Restart user').into_resp(c);
        }
    }

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data: blocksData, error: blocksError } = await query;

    if (blocksError) {
        await FatalErrorHandler(c, "Error fetching blocks data");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!blocksData) {
        return c.json([]);
    }

    const results = [];
    for (const block of blocksData) {
        if (!block.users_master || !Array.isArray(block.users_master) || block.users_master.length === 0) continue;

        const blockedUser = block.users_master[0];
        const blockedUuid = blockedUser.in_spbs_id;
        const handleId = blockedUser.handle_id;

        results.push({
            uuid: blockedUuid,
            handle: handleId
        });
    }

    return c.json(results);
}
