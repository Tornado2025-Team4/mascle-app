/**
 * GET /users/:userId
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters: なし
 *
 * Response:
 * {
 *   uuid: string;
 *   handle_id: string;
 * }
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '@/src/api/_cmn/error';
import { UnemptyString } from '@/src/api/_cmn/unemptystr';

export default async function get(c: Context) {
    const userSpecificId = c.get('userSpecificId') as { uuid: UnemptyString } | undefined;
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
        .select('handle_id')
        .eq('in_spbs_id', uuid)
        .single();
    if (error || !data) {
        return new ApiErrorNotFound('User').into_resp(c);
    }

    return c.json({
        uuid,
        handle_id: data.handle_id,
    });
}
