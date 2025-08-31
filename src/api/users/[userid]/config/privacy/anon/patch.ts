import { Context } from 'hono';
import { ApiErrorFatal } from '../../../../../_cmn/error';
import { mustGetCtx } from '../../../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from '../../../_cmn/userid_resolve';
import { userIdPub2Rel } from '@/src/api/_cmn/userid_pub2rel';
import { relship } from '@/src/api/_cmn/enum_relship';


interface reqBody {
    no_hideall_on_offline?: boolean;
    handle_id?: relship;
    display_name?: relship;
    description?: relship;
    tags?: relship;
    icon?: relship;
    birth_date?: relship;
    age?: relship;
    generation?: relship;
    gender?: relship;
    registered_since?: relship;
    training_since?: relship;
    skill_level?: relship;
    intents?: relship;
    intent_bodyparts?: relship;
    status?: relship;
    status_location?: relship;
    followings?: relship;
    followings_count?: relship;
    followers?: relship;
    followers_count?: relship;
    posts_count?: relship;
}

export default async function patch(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    const body: reqBody = await c.req.json();

    const relId = await userIdPub2Rel(spClSess, userIdInfo.pubId);

    const { data: existingData, error: fetchError } = await spClSess
        .from('users_line_privacy_anon')
        .select('*')
        .eq('user_rel_id', relId)
        .limit(1);

    if (fetchError) {
        throw new ApiErrorFatal('Failed to get user privacy anon settings');
    }

    const updateData: Record<string, boolean | relship> = {};

    Object.keys(body).forEach((key) => {
        if (body[key as keyof reqBody] !== undefined) {
            updateData[key] = body[key as keyof reqBody] as boolean | relship;
        }
    });

    if (!existingData || existingData.length === 0) {
        const insertData = { user_rel_id: relId, ...updateData };
        const { error: insertError } = await spClSess
            .from('users_line_privacy_anon')
            .insert([insertData]);
        if (insertError) {
            throw new ApiErrorFatal(`Failed to insert user privacy anon settings: ${insertError.message}`);
        }
    } else {
        const { error: updateError } = await spClSess
            .from('users_line_privacy_anon')
            .update(updateData)
            .eq('user_rel_id', relId);

        if (updateError) {
            throw new ApiErrorFatal(`Failed to update user privacy anon settings: ${updateError.message}`);
        }
    }

    return c.json({ success: true });
}
