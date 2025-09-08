import { Context } from 'hono';
import { ApiErrorFatal } from '../../../../_cmn/error';
import { mustGetCtx } from '../../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { userIdPub2Rel } from '@/src/api/_cmn/userid_pub2rel';
import { z } from 'zod';

const relshipEnum = [
    'anyone',
    'followers',
    'following',
    'follow-followers',
    'no-one',
] as const;

const privacySchema = z.object({
    display_name: z.enum(relshipEnum).optional(),
    description: z.enum(relshipEnum).optional(),
    tags: z.enum(relshipEnum).optional(),
    icon: z.enum(relshipEnum).optional(),
    birth_date: z.enum(relshipEnum).optional(),
    age: z.enum(relshipEnum).optional(),
    generation: z.enum(relshipEnum).optional(),
    gender: z.enum(relshipEnum).optional(),
    registered_since: z.enum(relshipEnum).optional(),
    training_since: z.enum(relshipEnum).optional(),
    skill_level: z.enum(relshipEnum).optional(),
    intents: z.enum(relshipEnum).optional(),
    intent_bodyparts: z.enum(relshipEnum).optional(),
    belonging_gyms: z.enum(relshipEnum).optional(),
    status: z.enum(relshipEnum).optional(),
    status_location: z.enum(relshipEnum).optional(),
    status_menus: z.enum(relshipEnum).optional(),
    status_histories: z.enum(relshipEnum).optional(),
    followings: z.enum(relshipEnum).optional(),
    followings_count: z.enum(relshipEnum).optional(),
    followers: z.enum(relshipEnum).optional(),
    followers_count: z.enum(relshipEnum).optional(),
    posts: z.enum(relshipEnum).optional(),
    posts_location: z.enum(relshipEnum).optional(),
    posts_count: z.enum(relshipEnum).optional(),
}).strict();

export default async function patch(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json({ success: false, error: 'Invalid JSON' }, 400);
    }

    const parseResult = privacySchema.safeParse(body);
    if (!parseResult.success) {
        return c.json({ success: false, error: parseResult.error.flatten() }, 400);
    }
    const updateData = parseResult.data;

    const relId = await userIdPub2Rel(spClSess, userIdInfo.pubId);

    const { data: existingData, error: fetchError } = await spClSess
        .from('users_line_privacy')
        .select('*')
        .eq('user_rel_id', relId)
        .limit(1);

    if (fetchError) {
        throw new ApiErrorFatal('Failed to get user privacy settings');
    }

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
