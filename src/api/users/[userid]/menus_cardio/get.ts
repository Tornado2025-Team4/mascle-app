import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';

interface reqQuery {
    limit: number;
}

const parseReqQuery = (c: Context): reqQuery => {
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    return { limit };
};

interface respBody {
    pub_id: string;
    name: string;
}

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const { spCl } = mustGetSpClSessOrAnon(c);

    const rq = parseReqQuery(c);

    const { data: userData, error: userError } = await spCl
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        if (userError && userError.code === 'PGRST116') {
            throw new ApiErrorFatal("User not found");
        }
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const userRelId = userData.rel_id;

    // クエリ構築
    const query = spCl
        .from('menus_cardio_master')
        .select('pub_id, name')
        .eq('user_rel_id', userRelId)
        .limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`Failed to fetch cardio menus: ${error.message}`);
    }

    const result: respBody[] = (data || []).map((row) => ({
        pub_id: row.pub_id,
        name: row.name
    }));

    return c.json(result);
}
