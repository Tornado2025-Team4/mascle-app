import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorNotFound } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';

interface reqQuery {
    limit: number;
    bodypart?: string;
}

const parseReqQuery = (c: Context): reqQuery => {
    const limitRaw = c.req.query('limit');
    const bodypart = c.req.query('bodypart');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    const result: reqQuery = { limit };
    if (bodypart) result.bodypart = bodypart;

    return result;
};

interface BodypartInfo {
    pub_id: string;
    name: string;
}

interface respBody {
    pub_id: string;
    name: string;
    bodypart: BodypartInfo | null;
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
            throw new ApiErrorNotFound("User");
        }
        throw new ApiErrorFatal(`failed to fetch: ${userError?.message}`);
    }

    const userRelId = userData.rel_id;

    // クエリ構築
    let query = spCl
        .from('menus_master')
        .select(`
            pub_id,
            name,
            bodyparts_master (
                pub_id,
                bodypart
            )
        `)
        .eq('user_rel_id', userRelId);

    // bodypartフィルタリング
    if (rq.bodypart) {
        const { data: bodypartData, error: bodypartError } = await spCl
            .from('bodyparts_master')
            .select('rel_id')
            .eq('pub_id', rq.bodypart)
            .single();

        if (bodypartError || !bodypartData) {
            if (bodypartError.code === 'PGRST116') {
                throw new ApiErrorNotFound(`Bodypart not found: ${rq.bodypart}`);
            }
            throw new ApiErrorFatal(`Failed to fetch bodypart: ${bodypartError?.message}`);
        }

        query = query.eq('bodypart_rel_id', bodypartData.rel_id);
    }

    query = query.limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`Failed to fetch menus: ${error.message}`);
    }

    // 推論が上手くいかないため強制変換(bodyparts_masterが配列になってしまう)
    const menuData = data as unknown as { pub_id: string, name: string, bodyparts_master: { pub_id: string, bodypart: string } }[];

    const result: respBody[] = (menuData || []).map((row) => ({
        pub_id: row.pub_id,
        name: row.name,
        bodypart: row.bodyparts_master ? {
            pub_id: row.bodyparts_master.pub_id,
            name: row.bodyparts_master.bodypart
        } : null
    }));

    return c.json(result);
}
