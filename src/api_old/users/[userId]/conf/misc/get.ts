/**
 * GET /users/:userId/conf/misc
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters: なし
 *
 * Response:
 * {
 *   allow_notification_kinds: any;
 *   dm_allow_condition: any;
 *   dm_request_allow_condition: any;
 * }
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
        .select('users_line_conf(allow_notification_kinds, dm_allow_condition, dm_request_allow_condition)')
        .eq('in_spbs_id', uuid)
        .single();
    if (error || !data || !data.users_line_conf) {
        return new ApiErrorNotFound('Conf').into_resp(c);
    }
    const conf = data.users_line_conf;
    return c.json({
        allow_notification_kinds: conf.allow_notification_kinds,
        dm_allow_condition: conf.dm_allow_condition,
        dm_request_allow_condition: conf.dm_request_allow_condition,
    });
}
