import { Context } from 'hono';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';
import { ApiErrorFatal, ApiErrorBadRequest } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

interface reqBody {
  partner_pub_id: string;
}

interface respBody {
  pub_id: string;
}

export default async function post(c: Context) {
  const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
  const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

  let reqBody: reqBody;
  try {
    reqBody = await c.req.json();
  } catch {
    throw new ApiErrorBadRequest('Invalid JSON body');
  }

  if (!reqBody.partner_pub_id || typeof reqBody.partner_pub_id !== 'string') {
    throw new ApiErrorBadRequest('partner_pub_id is required');
  }

  const currentUserId = userJwtInfo.obj.id;

  const { data: currentUserData, error: currentUserError } = await spClSess
    .from('users_master')
    .select('rel_id')
    .eq('auth_id', currentUserId)
    .single();

  if (currentUserError || !currentUserData) {
    throw new ApiErrorFatal('Failed to get current user data');
  }

  const { data: partnerUserData, error: partnerUserError } = await spClSess
    .from('users_master')
    .select('rel_id')
    .eq('pub_id', reqBody.partner_pub_id)
    .single();

  if (partnerUserError || !partnerUserData) {
    throw new ApiErrorBadRequest('Partner user not found');
  }

  if (currentUserData.rel_id === partnerUserData.rel_id) {
    throw new ApiErrorBadRequest('Cannot create DM pair with yourself');
  }

  const { data: blockCheck } = await spClSess
    .from('user_relationships')
    .select('*')
    .or(`and(user_a_rel_id.eq.${currentUserData.rel_id},user_b_rel_id.eq.${partnerUserData.rel_id}),and(user_a_rel_id.eq.${partnerUserData.rel_id},user_b_rel_id.eq.${currentUserData.rel_id})`)
    .eq('relationship_type', 'blocked')
    .single();

  if (blockCheck) {
    throw new ApiErrorBadRequest('Cannot create DM pair with blocked user');
  }

  const { data: partnerUserConfig } = await spClSess
    .from('users_config_misc')
    .select('allow_dm_req_from_follower, allow_dm_req_from_all')
    .eq('user_rel_id', partnerUserData.rel_id)
    .single();

  if (!partnerUserConfig?.allow_dm_req_from_all) {
    if (!partnerUserConfig?.allow_dm_req_from_follower) {
      throw new ApiErrorBadRequest('Partner does not allow DM requests');
    }

    const { data: followRelation } = await spClSess
      .from('user_relationships')
      .select('*')
      .eq('user_a_rel_id', partnerUserData.rel_id)
      .eq('user_b_rel_id', currentUserData.rel_id)
      .eq('relationship_type', 'follow')
      .single();

    if (!followRelation) {
      throw new ApiErrorBadRequest('Partner only allows DM requests from followers');
    }
  }

  const userARelId = Math.min(currentUserData.rel_id, partnerUserData.rel_id);
  const userBRelId = Math.max(currentUserData.rel_id, partnerUserData.rel_id);

  const { data: existingPair } = await spClSess
    .from('dm_pairs_master')
    .select('pub_id')
    .eq('user_a_rel_id', userARelId)
    .eq('user_b_rel_id', userBRelId)
    .single();

  if (existingPair) {
    return c.json({ pub_id: existingPair.pub_id } as respBody);
  }

  const pairPubId = nanoid();

  const partnerAllowed = partnerUserConfig?.allow_dm_req_from_all ||
    (partnerUserConfig?.allow_dm_req_from_follower &&
      await spClSess
        .from('user_relationships')
        .select('*')
        .eq('user_a_rel_id', partnerUserData.rel_id)
        .eq('user_b_rel_id', currentUserData.rel_id)
        .eq('relationship_type', 'follow')
        .single().then(res => !!res.data));

  const { data: newPair, error: insertError } = await spClSess
    .from('dm_pairs_master')
    .insert({
      pub_id: pairPubId,
      user_a_rel_id: userARelId,
      user_b_rel_id: userBRelId,
      user_a_allowed: currentUserData.rel_id === userARelId ? true : partnerAllowed,
      user_b_allowed: currentUserData.rel_id === userBRelId ? true : partnerAllowed
    })
    .select('pub_id')
    .single();

  if (insertError || !newPair) {
    throw new ApiErrorFatal('Failed to create DM pair');
  }

  return c.json({ pub_id: newPair.pub_id } as respBody);
}