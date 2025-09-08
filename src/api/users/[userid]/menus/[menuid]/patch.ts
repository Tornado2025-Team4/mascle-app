import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest, ApiErrorNotFound, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetPath } from '@/src/api/_cmn/get_path';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqBody {
    name?: string;
    bodypart?: {
        pub_id: string;
    };
}

export default async function patch(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const menuId = mustGetPath(c, 'menuid');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden('Cannot edit menu for anonymous user');
    }

    const body = await c.req.json() as reqBody;

    if (body.name !== undefined) {
        if (typeof body.name !== 'string' || body.name.trim().length === 0) {
            throw new ApiErrorBadRequest('name must be a non-empty string');
        }
        if (body.name.trim().length > 100) {
            throw new ApiErrorBadRequest('name must be 100 characters or less');
        }
    }

    const { data: userData, error: userError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    const { data: menuData, error: menuError } = await spClSrv
        .from('menus_master')
        .select('rel_id, user_rel_id')
        .eq('pub_id', menuId)
        .single();

    if (menuError) {
        if (menuError.code === 'PGRST116') {
            throw new ApiErrorNotFound('Menu');
        }
        throw new ApiErrorFatal(`DB access error: ${menuError.message}`);
    }

    if (menuData.user_rel_id !== userData.rel_id) {
        throw new ApiErrorForbidden('Cannot edit other user\'s menu');
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
        updateData.name = body.name.trim();
    }

    if (body.bodypart !== undefined) {
        if (body.bodypart.pub_id) {
            const { data: bodypartData, error: bodypartError } = await spClSess
                .from('bodyparts_master')
                .select('rel_id')
                .eq('pub_id', body.bodypart.pub_id)
                .single();

            if (bodypartError || !bodypartData) {
                throw new ApiErrorBadRequest(`Bodypart not found: ${body.bodypart.pub_id}`);
            }
            updateData.bodypart_rel_id = bodypartData.rel_id;
        } else {
            updateData.bodypart_rel_id = null;
        }
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiErrorBadRequest('No fields to update');
    }

    const { error: updateError } = await spClSess
        .from('menus_master')
        .update(updateData)
        .eq('rel_id', menuData.rel_id);

    if (updateError) {
        throw new ApiErrorFatal(`Failed to update menu: ${updateError.message}`);
    }

    return c.json({ success: true });
}
