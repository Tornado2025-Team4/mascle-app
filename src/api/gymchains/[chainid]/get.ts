import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorNotFound } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
    const chainId = c.req.param('chainid');

    const { data, error } = await spClAnon
        .from('gymchains_master')
        .select('pub_id, name, icon_rel_id')
        .eq('pub_id', chainId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new ApiErrorFatal(`failed to fetch gymchain ${error.message}`);
    }
    if (!data) {
        throw new ApiErrorNotFound("Gymchain");
    }

    return c.json({
        pub_id: data.pub_id,
        name: data.name,
        icon_url: data.icon_rel_id ? `/api/storage/icons/${data.icon_rel_id}` : null
    });
}
