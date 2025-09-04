/**
 * GET /users/:userId/conf/frontend_ui
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters: なし
 *
 * Response:
 * フロントエンドUI設定オブジェクト
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '@/src/api/_cmn/error';
import { UserSpecificId } from '../../_mw/userid_resolve';

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
    const { data, error } = await spClSess
        .from('users_master')
        .select('users_line_conf(frontend_ui_conf)')
        .eq('in_spbs_id', uuid)
        .single();
    if (error || !data || !data.users_line_conf) {
        return new ApiErrorNotFound('Conf').into_resp(c);
    }
    return c.json(data.users_line_conf.frontend_ui_conf);
}
