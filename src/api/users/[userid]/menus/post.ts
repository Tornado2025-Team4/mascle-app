import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest, ApiErrorNotFound } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

interface reqBody {
    name: string;
    bodypart?: {
        pub_id: string;
    };
}

interface respBody {
    pub_id: string;
}

export default async function post(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    const body = await c.req.json() as reqBody;

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        throw new ApiErrorBadRequest('name is required and must be a non-empty string');
    }

    const trimmedName = body.name.trim();
    if (trimmedName.length > 100) {
        throw new ApiErrorBadRequest('name must be 100 characters or less');
    }

    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        if (userError.code === 'PGRST116') {
            throw new ApiErrorNotFound(`User not found: ${userError?.message}`);
        }
        throw new ApiErrorFatal(`Failed to fetch user: ${userError?.message}`);
    }

    let bodypartRelId: number | null = null;
    if (body.bodypart?.pub_id) {
        const { data: bodypartData, error: bodypartError } = await spClSess
            .from('bodyparts_master')
            .select('rel_id')
            .eq('pub_id', body.bodypart.pub_id)
            .single();

        if (bodypartError || !bodypartData) {
            if (bodypartError?.code === 'PGRST116') {
                throw new ApiErrorNotFound(`Bodypart not found: ${body.bodypart.pub_id}`);
            }
            throw new ApiErrorFatal(`Failed to fetch bodypart: ${bodypartError?.message}`);
        }
        bodypartRelId = bodypartData.rel_id;
    }

    const menuPubId = nanoid(21);

    const { error: insertError } = await spClSess
        .from('menus_master')
        .insert({
            pub_id: menuPubId,
            user_rel_id: userData.rel_id,
            name: trimmedName,
            bodypart_rel_id: bodypartRelId
        });

    if (insertError) {
        throw new ApiErrorFatal(`Failed to create menu: ${insertError.message}`);
    }

    return c.json({
        pub_id: menuPubId
    } as respBody);
}
