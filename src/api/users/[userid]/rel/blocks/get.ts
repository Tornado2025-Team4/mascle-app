import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';

interface UserSummary {
        pub_id: string;
        handle: string;
}

export default async function get(c: Context) {
        const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
        const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
        const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

        const userJwtInfo = c.get('userJwtInfo') as UserJwtInfo | null;
        if (!userJwtInfo || userJwtInfo.obj.id !== userIdInfo.pubId) {
                throw new ApiErrorForbidden('blocks', 'Can only access own blocks');
        }

        const limitRaw = c.req.query('limit');
        const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

        if (isNaN(limit) || limit <= 0) {
                throw new ApiErrorBadRequest('limit must be a positive number');
        }

        const { data: userRel, error: userRelError } = await spClSrv
                .from('users_master')
                .select('rel_id')
                .eq('pub_id', userIdInfo.pubId)
                .single();

        if (userRelError || !userRel) {
                throw new ApiErrorFatal(`Failed to get user rel_id: ${userRelError?.message}`);
        }

        const { data: blocksData, error: blocksError } = await spClSess
                .from('users_lines_blocks')
                .select(`
                        target_user_rel_id,
                        users_master!target_user_rel_id(pub_id, handle)
                `)
                .eq('user_rel_id', userRel.rel_id)
                .limit(limit);

        if (blocksError) {
                throw new ApiErrorFatal(`Failed to get blocks: ${blocksError.message}`);
        }

        const response: UserSummary[] = blocksData.map(block => {
                const userData = Array.isArray(block.users_master) ? block.users_master[0] : block.users_master;
                return {
                        pub_id: userData.pub_id,
                        handle: userData.handle
                };
        });

        return c.json(response);
}