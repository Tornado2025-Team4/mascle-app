import { ApiErrorFatal } from "@/src/api/_cmn/error";
import { mustGetCtx } from "@/src/api/_cmn/get_ctx";
import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "hono";
import { UserIdInfo } from "../../_cmn/userid_resolve";
import { userIdPub2Rel } from "@/src/api/_cmn/userid_pub2rel";
import { z } from "zod";

const noticeKindEnum = [
    'matching/offline/same-gym',
    'social/follower-added',
    'social/following-posted',
    'social/following-started-training',
    'social/training-partner-request',
    'post/liked',
    'post/commented',
    'post/mentioned',
    'dm/pair/invite-received',
    'dm/pair/request-accepted',
    'dm/pair/received'
] as const;

const relshipEnum = ['anyone', 'followers', 'following', 'follow-followers', 'no-one'] as const;

const miscConfigSchema = z.object({
    frontend_ux: z.string().optional(),
    mute_notice_kinds: z.array(z.enum(noticeKindEnum)).optional(),
    dm_pair_request_allow: z.enum(relshipEnum).optional(),
    dm_pair_auto_allow: z.enum(relshipEnum).optional(),
    dm_group_request_allow: z.enum(relshipEnum).optional(),
    dm_group_auto_allow: z.enum(relshipEnum).optional(),
    enable_matching_offline: z.boolean().optional(),
}).strict();

export default async function patch(c: Context) {
    const supabase = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const userRelId = await userIdPub2Rel(supabase, userIdInfo.pubId);


    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ success: false, error: 'Invalid JSON' }, 400);
    }

    const parseResult = miscConfigSchema.safeParse(body);
    if (!parseResult.success) {
        return c.json({ success: false, error: parseResult.error.flatten() }, 400);
    }
    const updateData = parseResult.data;

    if (Object.keys(updateData).length === 0) {
        // 何も更新せずに現在のデータを返す
        const { data: currentData } = await supabase
            .from('users_line_config')
            .select('frontend_ux, mute_notice_kinds, dm_pair_request_allow, dm_pair_auto_allow, dm_group_request_allow, dm_group_auto_allow, enable_matching_offline')
            .eq('user_rel_id', userRelId)
            .single();

        return c.json(currentData || {});
    }

    const { data, error } = await supabase
        .from('users_line_config')
        .update(updateData)
        .eq('user_rel_id', userRelId)
        .select('frontend_ux, mute_notice_kinds, dm_pair_request_allow, dm_pair_auto_allow, dm_group_request_allow, dm_group_auto_allow, enable_matching_offline')
        .single();

    if (error) {
        throw new ApiErrorFatal(error.message);
    }

    return c.json(data);
}