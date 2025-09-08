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

    let icon_url: string | null = null;
    if (data.icon_rel_id) {
        try {
            // まず storage.objects テーブルからファイル名を取得
            const { data: storageData, error: storageError } = await spClAnon
                .from('storage.objects')
                .select('name')
                .eq('id', data.icon_rel_id)
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

    return c.json({
        pub_id: data.pub_id,
        name: data.name,
        icon_url
    });
}
