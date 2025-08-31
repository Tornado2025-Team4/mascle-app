import { ApiErrorFatal } from "@/src/api/_cmn/error";
import { mustGetCtx } from "@/src/api/_cmn/get_ctx";
import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "hono";
import { UserIdInfo } from "../../_cmn/userid_resolve";
import { userIdPub2Rel } from "@/src/api/_cmn/userid_pub2rel";

export default async function patch(c: Context) {
    const supabase = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const userRelId = await userIdPub2Rel(supabase, userIdInfo.pubId);

    const body = await c.req.json();

    const updateData: Record<string, unknown> = {};

    if (body.frontend_ux !== undefined) updateData.frontend_ux = body.frontend_ux;
    if (body.mute_notice_kinds !== undefined) updateData.mute_notice_kinds = body.mute_notice_kinds;
    if (body.dm_pair_request_allow !== undefined) updateData.dm_pair_request_allow = body.dm_pair_request_allow;
    if (body.dm_pair_auto_allow !== undefined) updateData.dm_pair_auto_allow = body.dm_pair_auto_allow;
    if (body.dm_group_request_allow !== undefined) updateData.dm_group_request_allow = body.dm_group_request_allow;
    if (body.dm_group_auto_allow !== undefined) updateData.dm_group_auto_allow = body.dm_group_auto_allow;

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