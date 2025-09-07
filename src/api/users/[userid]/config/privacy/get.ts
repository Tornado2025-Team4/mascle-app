import { Context } from 'hono';
import { ApiErrorFatal } from '../../../../_cmn/error';
import { mustGetCtx } from '../../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { userIdPub2Rel } from '@/src/api/_cmn/userid_pub2rel';
import { relship } from '@/src/api/_cmn/enum_relship';

interface respBody {
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
    status_menus?: relship;
    status_histories?: relship;
    followings?: relship;
    followings_count?: relship;
    followers?: relship;
    followers_count?: relship;
    posts?: relship;
    posts_location?: relship;
    posts_count?: relship;
}

type PrivacyRow = {
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
    status_menus?: relship;
    status_histories?: relship;
    followings?: relship;
    followings_count?: relship;
    followers?: relship;
    followers_count?: relship;
    posts?: relship;
    posts_location?: relship;
    posts_count?: relship;
};

export default async function get(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    const relId = await userIdPub2Rel(spClSess, userIdInfo.pubId);

    let res: PrivacyRow[] = [];

    const { data: privacyData, error } = await spClSess
        .from('users_line_privacy')
        .select('*')
        .eq('user_rel_id', relId)
        .limit(1);
    if (error) {
        throw new ApiErrorFatal('Failed to get user privacy settings');
    }

    if (!privacyData || (Array.isArray(privacyData) && privacyData.length === 0)) {
        const { error: insertError } = await spClSess
            .from('users_line_privacy')
            .insert([{ user_rel_id: relId }]);
        if (insertError) {
            throw new ApiErrorFatal(`Failed to insert user privacy settings: ${insertError.message}`);
        }
        const { data: newPrivacyData, error: newError } = await spClSess
            .from('users_line_privacy')
            .select('*')
            .eq('user_rel_id', relId)
            .limit(1);
        if (newError) {
            throw new ApiErrorFatal(`Failed to get user privacy settings after insert: ${newError.message}`);
        }
        if (!newPrivacyData || (Array.isArray(newPrivacyData) && newPrivacyData.length === 0)) {
            throw new ApiErrorFatal('Failed to get user privacy settings after insert: No data found');
        }
        res = newPrivacyData;
    } else {
        res = privacyData;
    }

    const mapped = res && Array.isArray(res) ? res[0] : res;
    const response: respBody = mapped ? {
        display_name: mapped.display_name,
        description: mapped.description,
        tags: mapped.tags,
        icon: mapped.icon,
        birth_date: mapped.birth_date,
        age: mapped.age,
        generation: mapped.generation,
        gender: mapped.gender,
        registered_since: mapped.registered_since,
        training_since: mapped.training_since,
        skill_level: mapped.skill_level,
        intents: mapped.intents,
        intent_bodyparts: mapped.intent_bodyparts,
        belonging_gyms: mapped.belonging_gyms,
        status: mapped.status,
        status_location: mapped.status_location,
        status_menus: mapped.status_menus,
        status_histories: mapped.status_histories,
        followings: mapped.followings,
        followings_count: mapped.followings_count,
        followers: mapped.followers,
        followers_count: mapped.followers_count,
        posts: mapped.posts,
        posts_location: mapped.posts_location,
        posts_count: mapped.posts_count,
    } : {};

    return c.json(response);
}
