import { Context } from 'hono';
import { ApiErrorFatal } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqQuery {
    name?: string;
    limit: number;
}

const parseReqQuery = (c: Context): reqQuery => {
    const name = c.req.query('name');
    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    return { name, limit } as reqQuery;
};

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    let query = spClAnon
        .from('gymchains_master')
        .select('pub_id, name, icon_rel_id');

    if (rq.name) {
        query = query.ilike('name', `%${rq.name}%`);
    }

    query = query.limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to fetch gymchains ${error.message}`);
    }

    const result = await Promise.all((data ?? []).map(async (row) => {
        let icon_url: string | null = null;

        if (row.icon_rel_id) {
            try {
                // まず storage.objects テーブルからファイル名を取得
                const { data: storageData, error: storageError } = await spClAnon
                    .from('storage.objects')
                    .select('name')
                    .eq('id', row.icon_rel_id)
                    .single();

                if (!storageError && storageData?.name) {
                    // ファイル名を使って署名付きURLを生成
                    const { data: signedUrlData, error: signedUrlError } = await spClAnon.storage
                        .from('gymchains_icons')
                        .createSignedUrl(storageData.name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        icon_url = signedUrlData.signedUrl;
                    }
                }
            } catch (e) {
                console.error('Failed to create signed URL for gymchain icon:', e);
            }
        }

        return {
            pub_id: row.pub_id,
            name: row.name,
            icon_url
        };
    }));

    return c.json(result);
}
