import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorNotFound, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetPath } from '@/src/api/_cmn/get_path';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function deleteMenu(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const menuId = mustGetPath(c, 'menuid');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden('Cannot delete cardio menu for anonymous user');
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
        .from('menus_cardio_master')
        .select('rel_id, user_rel_id')
        .eq('pub_id', menuId)
        .single();

    if (menuError) {
        if (menuError.code === 'PGRST116') {
            throw new ApiErrorNotFound('Cardio menu');
        }
        throw new ApiErrorFatal(`DB access error: ${menuError.message}`);
    }

    if (menuData.user_rel_id !== userData.rel_id) {
        throw new ApiErrorForbidden('Cannot delete other user\'s cardio menu');
    }

    const { error: deleteError } = await spClSess
        .from('menus_cardio_master')
        .delete()
        .eq('rel_id', menuData.rel_id);

    if (deleteError) {
        throw new ApiErrorFatal(`Failed to delete cardio menu: ${deleteError.message}`);
    }

    return c.json({ success: true });
}
