/**
 * GET /users/:userId/conf/privacy/:type
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 * - type: 'online' | 'offline' - プライバシー設定の種類
 *
 * Query Parameters: なし
 *
 * Response:
 * Record<string, string> - { target_part: visibility }
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '@/src/api/_cmn/error';
import { UserSpecificId } from '../../../_mw/userid_resolve';

export default async function get(c: Context) {
    const userSpecificId = c.get('userSpecificId') as UserSpecificId | undefined;
    if (!userSpecificId) {
        await FatalErrorHandler(c, "userSpecificId not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const uuid = userSpecificId.uuid.v;
    const spClSess = c.get('supabaseClientSess');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClientSess not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const type = c.req.param('type');
    if (type !== 'online' && type !== 'offline') {
        return new ApiErrorNotFound('PrivacyType').into_resp(c);
    }
    const table = type === 'online'
        ? 'users_line_conf_privacy_onlines'
        : 'users_line_conf_privacy_offlines';
    const { data, error } = await spClSess
        .from('users_master')
        .select(`${table}(target_part, visibility)`)
        .eq('in_spbs_id', uuid)
        .single();
    if (error || !data) {
        return new ApiErrorNotFound('PrivacyConf').into_resp(c);
    }
    const confRaw = data[table];
    const confArr = Array.isArray(confRaw)
        ? confRaw
        : confRaw
            ? [confRaw]
            : [];
    const result: Record<string, string> = {};
    for (const row of confArr) {
        if (row && row.target_part && row.visibility) {
            result[row.target_part] = row.visibility;
        }
    }
    return c.json(result);
}
