import { Context } from 'hono';
import { ApiErrorFatal } from '../../../../_cmn/error';
import { mustGetCtx } from '../../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { userIdPub2Rel } from '@/src/api/_cmn/userid_pub2rel';
import { relship } from '@/src/api/_cmn/enum_relship';


interface reqBody {
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
    belonging_gyms?: relship;
    status?: relship;
    status_location?: relship;
    status_histories?: relship;
    followings?: relship;
    followings_count?: relship;
    followers?: relship;
    followers_count?: relship;
    posts?: relship;
    posts_location?: relship;
    posts_count?: relship;
    belonging_dm_groups?: relship;
}

export default async function patch(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    const body: reqBody = await c.req.json();

    const relId = await userIdPub2Rel(spClSess, userIdInfo.pubId);

    const { data: existingData, error: fetchError } = await spClSess
        .from('users_line_privacy')
        .select('*')
        .eq('user_rel_id', relId)
        .limit(1);

    if (fetchError) {
        throw new ApiErrorFatal('Failed to get user privacy settings');
    }

    const updateData: Partial<reqBody> = {};

    Object.keys(body).forEach((key) => {
        if (body[key as keyof reqBody] !== undefined) {
            updateData[key as keyof reqBody] = body[key as keyof reqBody];
        }
    });

    if (!existingData || existingData.length === 0) {
        const insertData = { user_rel_id: relId, ...updateData };
        const { error: insertError } = await spClSess
            .from('users_line_privacy')
            .insert([insertData]);
        if (insertError) {
            throw new ApiErrorFatal(`Failed to insert user privacy settings: ${insertError.message}`);
        }
    } else {
        const { error: updateError } = await spClSess
            .from('users_line_privacy')
            .update(updateData)
            .eq('user_rel_id', relId);

        if (updateError) {
            throw new ApiErrorFatal(`Failed to update user privacy settings: ${updateError.message}`);
        }
    }

    return c.json({ success: true });
}
