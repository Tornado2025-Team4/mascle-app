import { Context } from 'hono';
import { ApiErrorFatal } from '../../../../_cmn/error';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';

export default async function get(c: Context) {
    const { spCl } = mustGetSpClSessOrAnon(c);
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    const startedBefore = c.req.query('started_before');
    const startedAfter = c.req.query('started_after');
    const finishedBefore = c.req.query('finished_before');
    const finishedAfter = c.req.query('finished_after');
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const gymPubId = c.req.query('on');

    const { data: userData, error: userError } = await spCl
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const viewName = userIdInfo.specByAnon ? 'view_status_master_anon' : 'view_status_master';

    let query = spCl
        .from(viewName)
        .select('pub_id, started_at, finished_at, is_auto_detected, gym_rel_id')
        .order('started_at', { ascending: false })
        .eq('privacy_allowed', true);

    if (!userIdInfo.specByAnon) {
        query = query.eq('user_rel_id', userData.rel_id);
    } else {
        query = query.eq('user_anon_pub_id', userIdInfo.anonPubId);
    }

    if (startedBefore) {
        query = query.lt('started_at', startedBefore);
    }

    if (startedAfter) {
        query = query.gt('started_at', startedAfter);
    }

    if (finishedBefore) {
        query = query.lt('finished_at', finishedBefore);
    }

    if (finishedAfter) {
        query = query.gt('finished_at', finishedAfter);
    }

    if (gymPubId) {
        const { data: gymData, error: gymError } = await spCl
            .from('gyms_master')
            .select('rel_id')
            .eq('pub_id', gymPubId)
            .single();

        if (gymError || !gymData) {
            return c.json([]);
        }

        query = query.eq('gym_rel_id', gymData.rel_id);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
        throw new ApiErrorFatal(`DB access error: ${error.message}`);
    }

    if (!data) {
        return c.json([]);
    }

    const result = data.map(item => ({
        history_pub_id: item.pub_id,
        started_at: item.started_at,
        finished_at: item.finished_at,
        is_auto_detected: item.is_auto_detected,
        gym_pub_id: item.gym_rel_id
    }));

    return c.json(result);
}