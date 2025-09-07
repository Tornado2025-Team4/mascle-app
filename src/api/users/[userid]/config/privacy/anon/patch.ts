import { Context } from 'hono';
import { ApiErrorFatal } from '../../../../../_cmn/error';
import { mustGetCtx } from '../../../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from '../../../_cmn/userid_resolve';
import { userIdPub2Rel } from '@/src/api/_cmn/userid_pub2rel';
import { relship } from '@/src/api/_cmn/enum_relship';
import { z } from 'zod';

const relshipEnum = [
    'anyone',
    'followers',
    'following',
    'follow-followers',
    'no-one',
] as const;

const anonPrivacySchema = z.object({
    completely_hidden: z.boolean().optional(),
    view_real_profile: z.enum(relshipEnum).optional(),
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
    followings: z.enum(relshipEnum).optional(),
    followings_count: z.enum(relshipEnum).optional(),
    followers: z.enum(relshipEnum).optional(),
    followers_count: z.enum(relshipEnum).optional(),
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

    const parseResult = anonPrivacySchema.safeParse(body);
    if (!parseResult.success) {
        return c.json({ success: false, error: parseResult.error.flatten() }, 400);
    }
    const updateData = parseResult.data;

    const relId = await userIdPub2Rel(spClSess, userIdInfo.pubId);

    const { data: existingData, error: fetchError } = await spClSess
        .from('users_line_privacy_anon')
        .select('*')
        .eq('user_rel_id', relId)
        .limit(1);

    if (fetchError) {
        throw new ApiErrorFatal('Failed to get user privacy anon settings');
    }


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
