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
            let icon_url: string | null = null;
            if (chainData.icon_rel_id) {
                try {
                    // まず storage.objects テーブルからファイル名を取得
                    const { data: storageData, error: storageError } = await spClAnon
                        .from('storage.objects')
                        .select('name')
                        .eq('id', chainData.icon_rel_id)
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

            chain = {
                pub_id: chainData.pub_id,
                name: chainData.name,
                icon_url,
                internal_id: gymData.gymchain_internal_id
            };
        }
    }

    let photo_url: string | null = null;
    if (gymData.photo_rel_id) {
        try {
            // まず storage.objects テーブルからファイル名を取得
            const { data: storageData, error: storageError } = await spClAnon
                .from('storage.objects')
                .select('name')
                .eq('id', gymData.photo_rel_id)
                .single();

            if (!storageError && storageData?.name) {
                // ファイル名を使って署名付きURLを生成
                const { data: signedUrlData, error: signedUrlError } = await spClAnon.storage
                    .from('gyms_photos')
                    .createSignedUrl(storageData.name, 60 * 60);

                if (!signedUrlError && signedUrlData?.signedUrl) {
                    photo_url = signedUrlData.signedUrl;
                }
            }
        } catch (e) {
            console.error('Failed to create signed URL for gym photo:', e);
        }
    }

    return c.json({
        pub_id: gymData.pub_id,
        name: gymData.name,
        photo_url,
        chain
    });
}
