import { ApiErrorFatal } from "@/src/api/_cmn/error";
import { mustGetCtx } from "@/src/api/_cmn/get_ctx";
import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "hono";
import { UserIdInfo } from "../../_cmn/userid_resolve";
import { userIdPub2Rel } from "@/src/api/_cmn/userid_pub2rel";
import { z } from "zod";

const noticeKindEnum = [
    'matching/offline/same-gym',
    'matching/online/recommend',
    'social/follower-added',
    'social/following-posted',
    'social/following-started-training',
    'social/training-partner-request',
    'post/liked',
    'post/commented',
    'post/mentioned',
    'dm/pair/invite-received',
    'dm/pair/request-accepted',
    'dm/pair/received',
    'dm/group/invite-received',
    'dm/group/request-accepted',
    'dm/group/request-received',
    'dm/group/member-added',
    'dm/group/received',
    'report/resolved',
    'report/rejected',
    'system/warning',
    'system/announcement',
    'other'
] as const;

const miscConfigSchema = z.object({
    frontend_ux: z.string().optional(),
    mute_notice_kinds: z.array(z.enum(noticeKindEnum)).optional(),
    dm_pair_request_allow: z.boolean().optional(),
    dm_pair_auto_allow: z.boolean().optional(),
    dm_group_request_allow: z.boolean().optional(),
    dm_group_auto_allow: z.boolean().optional(),
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
        return c.json({ success: true });
    }

    const { error } = await supabase
        .from('users_line_config')
        .update(updateData)
        .eq('user_rel_id', userRelId);

    if (error) {
        throw new ApiErrorFatal(error.message);
    }

    return c.json({ success: true });
}