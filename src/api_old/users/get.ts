/**
 * GET /users
 *
 * Query Parameters:
 * 現在未実装
 *
 * Response:
 * 現在未実装
 */

import { Context } from 'hono';
import { ApiErrorNotImplemented } from '../_cmn/error';

export default async function get(c: Context) {
    // > ! 未実装
    return new ApiErrorNotImplemented('endpoint').into_resp(c);
}
