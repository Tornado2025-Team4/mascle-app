/**
 * GET /users/:userId/training_state/histories
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters:
 * - is_offline?: boolean - オフラインかどうか（デフォルト: false）
 * - before?: string - 指定日時以前の履歴を取得
 * - after?: string - 指定日時以降の履歴を取得
 * - limit?: number - 取得件数の上限（デフォルト: 50）
 * - restart_pub_id?: string - 続きから取得するための履歴pub_id
 *
 * Response:
 * Array<{
 *   pub_id: string;
 *   started_at: string;
 *   finished_at: string;
 *   is_auto_detected: boolean;
 *   gym_pub_id: string | null;
 *   gym_name: string | null;
 * }>
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { UserSpecificId } from '../../_mw/userid_resolve';
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
  const beforeParam = c.req.query('before');
  const afterParam = c.req.query('after');
  const limitParam = c.req.query('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const restartPubIdParam = c.req.query('restart_pub_id');

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

  const targetParts = [
    'profile/training_state',
    'profile/training_state/histories',
    'profile/training_state/location'
  ];

  const { data: visibilityResults, error: visibilityError } = await spClSess.rpc('check_multiple_visibility', {
    is_offline: isOffline,
    current_user_rel_id: currentUserRelId,
    target_user_rel_id: targetUserRelId,
    target_parts: targetParts
  });

  if (visibilityError) {
    await FatalErrorHandler(c, visibilityError, "Visibility check");
    return new ApiErrorInternalServerError().into_resp(c);
  }

  const accessMap = new Map();
  if (visibilityResults) {
    for (const result of visibilityResults) {
      accessMap.set(result.target_part, result.has_access);
    }
  }

  if (!accessMap.get('profile/training_state') || !accessMap.get('profile/training_state/histories')) {
    return new ApiErrorForbidden().into_resp(c);
  }

  const hasLocationAccess = accessMap.get('profile/training_state/location') || false;

  let query = spClSess
    .from('users_lines_training_state_histories')
    .select(`
            pub_id,
            started_at,
            finished_at,
            is_auto_detected,
            gym_rel_id,
            gym_master(
                pub_id,
                name
            )
        `)
    .eq('user_rel_id', targetUserRelId)
    .order('started_at', { ascending: false });

  if (beforeParam) {
    query = query.lt('started_at', beforeParam);
  }

  if (afterParam) {
    query = query.gt('started_at', afterParam);
  }

  if (restartPubIdParam) {
    query = query.lt('pub_id', restartPubIdParam);
  }

  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data: historiesData, error: historiesError } = await query;

  if (historiesError) {
    await FatalErrorHandler(c, historiesError, "fetching training histories");
    return new ApiErrorInternalServerError().into_resp(c);
  }

  if (!historiesData) {
    return c.json([]);
  }

  const results = historiesData.map(history => {
    const gym = history.gym_master && Array.isArray(history.gym_master) && history.gym_master.length > 0
      ? history.gym_master[0]
      : null;

    return {
      pub_id: history.pub_id,
      started_at: history.started_at,
      finished_at: history.finished_at,
      is_auto_detected: history.is_auto_detected,
      gym_pub_id: hasLocationAccess && gym ? gym.pub_id : null,
      gym_name: hasLocationAccess && gym ? gym.name : null
    };
  });

  return c.json(results);
}
