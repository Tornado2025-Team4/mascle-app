import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorNotFound, ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';

interface reqQuery {
    limit: number;
    before?: string;
    after?: string;
}

interface respBody {
    pub_id: string;
}

const parseReqQuery = (c: Context): reqQuery => {
    const limitRaw = c.req.query('limit');
    const before = c.req.query('before');
    const after = c.req.query('after');

    const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;

    return { limit, before, after } as reqQuery;
};

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const rq = parseReqQuery(c);

    let response: respBody[];

    if (userIdInfo.anonPubId) {
        response = await getdata_anon(c, userIdInfo.anonPubId, rq);
    } else {
        response = await getdata(c, userIdInfo.pubId, rq);
    }

    return c.json(response);
}

const getdata = async (c: Context, userPubId: string, rq: reqQuery): Promise<respBody[]> => {
    const { spCl: spClSA } = mustGetSpClSessOrAnon(c);

    let query = spClSA
        .from('views_user_status')
        .select('pub_id, started_at, privacy_allowed_status')
        .eq('user_pub_id', userPubId)
        .order('started_at', { ascending: false });

    // before/afterパラメータでフィルタリング
    if (rq.before) {
        query = query.lt('started_at', rq.before);
    }
    if (rq.after) {
        query = query.gt('started_at', rq.after);
    }

    query = query.limit(rq.limit);

    const { data: statuses, error: statusErr } = await query;

    if (statusErr) {
        throw new ApiErrorFatal(`DB access error: ${statusErr.message}`);
    }

    // プライバシー権限があるもののみフィルタリング
    const result = (statuses ?? [])
        .filter(status => status.privacy_allowed_status)
        .map(status => ({
            pub_id: status.pub_id
        }));

    return result;
};

const getdata_anon = async (c: Context, userAnonPubId: string, rq: reqQuery): Promise<respBody[]> => {
    const { spCl: spClSA } = mustGetSpClSessOrAnon(c);

    // 匿名ユーザーの場合、まずユーザーのpub_idを取得
    const { data: user, error: userErr } = await spClSA
        .from('users_master')
        .select('pub_id')
        .eq('anon_pub_id', userAnonPubId)
        .single();

    if (userErr || !user) {
        throw new ApiErrorNotFound("User");
    }

    let query = spClSA
        .from('views_user_status')
        .select('pub_id, started_at, privacy_allowed_status')
        .eq('user_pub_id', user.pub_id)
        .order('started_at', { ascending: false });

    // before/afterパラメータでフィルタリング
    if (rq.before) {
        query = query.lt('started_at', rq.before);
    }
    if (rq.after) {
        query = query.gt('started_at', rq.after);
    }

    query = query.limit(rq.limit);

    const { data: statuses, error: statusErr } = await query;

    if (statusErr) {
        throw new ApiErrorFatal(`DB access error: ${statusErr.message}`);
    }

    // プライバシー権限があるもののみフィルタリング
    const result = (statuses ?? [])
        .filter(status => status.privacy_allowed_status)
        .map(status => ({
            pub_id: status.pub_id
        }));

    return result;
};