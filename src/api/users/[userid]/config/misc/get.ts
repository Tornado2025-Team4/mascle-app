import { ApiErrorFatal } from "@/src/api/_cmn/error";
import { mustGetCtx } from "@/src/api/_cmn/get_ctx";
import { SupabaseClient } from "@supabase/supabase-js";
import { Context } from "hono";
import { UserIdInfo } from "../../_cmn/userid_resolve";
import { userIdPub2Rel } from "@/src/api/_cmn/userid_pub2rel";

export default async function get(c: Context) {
    const supabase = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');

    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const userRelId = await userIdPub2Rel(supabase, userIdInfo.pubId);

    const { data, error } = await supabase
        .from('users_line_config')
        .select('frontend_ux, mute_notice_kinds, dm_pair_request_allow, dm_pair_auto_allow, dm_group_request_allow, dm_group_auto_allow')
        .eq('user_rel_id', userRelId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new ApiErrorFatal(error.message);
    }

    if (!data) {
        const { error } = await supabase
            .from('users_line_config')
            .insert({ user_rel_id: userRelId })
            .single();

        if (error) {
            throw new ApiErrorFatal(error.message);
        }
    }

    const { data: data2, error: error2 } = await supabase
        .from('users_line_config')
        .select('frontend_ux, mute_notice_kinds, dm_pair_request_allow, dm_pair_auto_allow, dm_group_request_allow, dm_group_auto_allow')
        .eq('user_rel_id', userRelId)
        .single();

    if (error2) {
        if (error2.code !== 'PGRST116') {
            throw new ApiErrorFatal(`Failed to retrieve user line config after insertion: ${error2.message}`);
        }
        throw new ApiErrorFatal(error2.message);
    }

    return c.json(data2);
};