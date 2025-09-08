import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

interface reqBody {
    name: string;
}

interface respBody {
    pub_id: string;
}

export default async function post(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden('Cannot create cardio menu for anonymous user');
    }

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
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const menuPubId = nanoid(21);

    const { error: insertError } = await spClSess
        .from('menus_cardio_master')
        .insert({
            pub_id: menuPubId,
            user_rel_id: userData.rel_id,
            name: trimmedName
        });

    if (insertError) {
        throw new ApiErrorFatal(`Failed to create cardio menu: ${insertError.message}`);
    }

    return c.json({
        pub_id: menuPubId
    } as respBody);
}
