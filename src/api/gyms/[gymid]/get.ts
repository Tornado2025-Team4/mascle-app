import { Context } from 'hono';
import { ApiErrorFatal, ApiErrorNotFound } from '../../_cmn/error';
import { mustGetCtx } from '../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function get(c: Context) {
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');
    const gymId = c.req.param('gymid');

    const { data: gymData, error: gymError } = await spClAnon
        .from('gyms_master')
        .select(`
            pub_id,
            name,
            photo_rel_id,
            gymchain_rel_id,
            gymchain_internal_id
        `)
        .eq('pub_id', gymId)
        .single();

    if (gymError && gymError.code !== 'PGRST116') {
        throw new ApiErrorFatal(`failed to fetch gym ${gymError.message}`);
    }
    if (!gymData) {
        throw new ApiErrorNotFound("Gym");
    }

    let chain = null;
    if (gymData.gymchain_rel_id) {
        const { data: chainData, error: chainError } = await spClAnon
            .from('gymchains_master')
            .select('pub_id, name, icon_rel_id')
            .eq('rel_id', gymData.gymchain_rel_id)
            .single();

        if (chainError && chainError.code !== 'PGRST116') {
            throw new ApiErrorFatal(`failed to fetch gymchain ${chainError.message}`);
        }

        if (chainData) {
            chain = {
                pub_id: chainData.pub_id,
                name: chainData.name,
                icon_url: chainData.icon_rel_id ? `/api/storage/icons/${chainData.icon_rel_id}` : null,
                internal_id: gymData.gymchain_internal_id
            };
        }
    }

    return c.json({
        pub_id: gymData.pub_id,
        name: gymData.name,
        photo_url: gymData.photo_rel_id ? `/api/storage/photos/${gymData.photo_rel_id}` : null,
        chain
    });
}
