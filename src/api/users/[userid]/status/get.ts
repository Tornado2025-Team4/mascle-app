import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorNotFound, ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const { spCl } = mustGetSpClSessOrAnon(c);

    const { data: userData, error: userError } = await spCl
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorNotFound("User");
    }

    const userRelId = userData.rel_id;

    const viewName = userIdInfo.specByAnon ? 'view_status_master_anon' : 'view_status_master';

    let query = spCl
        .from(viewName)
        .select('pub_id, started_at, finished_at, is_auto_detected, gym_rel_id')
        .eq('user_rel_id', userRelId)
        .order('started_at', { ascending: false });

    if (!userIdInfo.specByAnon) {
        query = query.eq('user_rel_id', userData.rel_id);
    } else {
        query = query.eq('user_anon_pub_id', userIdInfo.anonPubId);
    }

    const { data, error } = await query
        .eq('privacy_allowed', true)
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return c.json(null);
        }
        throw new ApiErrorFatal(`DB access error ${error.message}`);
    }

    if (!data) {
        return c.json(null);
    }

    return c.json({
        history_pub_id: data.pub_id,
        started_at: data.started_at,
        finished_at: data.finished_at,
        is_auto_detected: data.is_auto_detected,
        gym_pub_id: data.gym_rel_id
    });
}