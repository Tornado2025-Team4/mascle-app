/**
 * GET /users/:userId/training_state/histories/:trainingStateId
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 * - trainingStateId: string - トレーニング状態のpub_id
 *
 * Query Parameters: なし
 *
 * Response:
 * {
 *   started_at: string;
 *   finished_at: string;
 *   is_auto_detected: boolean;
 *   gym_pub_id: string | null;
 *   gym_name: string | null;
 * }
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { UserSpecificId } from '../../../_mw/userid_resolve';
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

  const trainingStateId = c.req.param('trainingStateId');
  if (!trainingStateId) {
    return new ApiErrorNotFound('Training state ID').into_resp(c);
  }

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

  const isOffline = false;
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
    await FatalErrorHandler(c, visibilityError, "checking visibility for training state history");
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

  const { data: historyData, error: historyError } = await spClSess
    .from('users_lines_training_state_histories')
    .select(`
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
    .eq('pub_id', trainingStateId)
    .single();

  if (historyError || !historyData) {
    return new ApiErrorNotFound('Training state history').into_resp(c);
  }

  const gym = historyData.gym_master && Array.isArray(historyData.gym_master) && historyData.gym_master.length > 0
    ? historyData.gym_master[0]
    : null;

  const result = {
    started_at: historyData.started_at,
    finished_at: historyData.finished_at,
    is_auto_detected: historyData.is_auto_detected,
    gym_pub_id: hasLocationAccess && gym ? gym.pub_id : null,
    gym_name: hasLocationAccess && gym ? gym.name : null
  };

  return c.json(result);
}
