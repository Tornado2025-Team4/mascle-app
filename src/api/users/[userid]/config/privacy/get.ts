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
    const response: respBody = {};

    if (mapped) {
        if (mapped.display_name !== undefined) response.display_name = mapped.display_name;
        if (mapped.description !== undefined) response.description = mapped.description;
        if (mapped.tags !== undefined) response.tags = mapped.tags;
        if (mapped.icon !== undefined) response.icon = mapped.icon;
        if (mapped.birth_date !== undefined) response.birth_date = mapped.birth_date;
        if (mapped.age !== undefined) response.age = mapped.age;
        if (mapped.generation !== undefined) response.generation = mapped.generation;
        if (mapped.gender !== undefined) response.gender = mapped.gender;
        if (mapped.registered_since !== undefined) response.registered_since = mapped.registered_since;
        if (mapped.training_since !== undefined) response.training_since = mapped.training_since;
        if (mapped.skill_level !== undefined) response.skill_level = mapped.skill_level;
        if (mapped.intents !== undefined) response.intents = mapped.intents;
        if (mapped.intent_bodyparts !== undefined) response.intent_bodyparts = mapped.intent_bodyparts;
        if (mapped.belonging_gyms !== undefined) response.belonging_gyms = mapped.belonging_gyms;
        if (mapped.status !== undefined) response.status = mapped.status;
        if (mapped.status_location !== undefined) response.status_location = mapped.status_location;
        if (mapped.status_menus !== undefined) response.status_menus = mapped.status_menus;
        if (mapped.status_histories !== undefined) response.status_histories = mapped.status_histories;
        if (mapped.followings !== undefined) response.followings = mapped.followings;
        if (mapped.followings_count !== undefined) response.followings_count = mapped.followings_count;
        if (mapped.followers !== undefined) response.followers = mapped.followers;
        if (mapped.followers_count !== undefined) response.followers_count = mapped.followers_count;
        if (mapped.posts !== undefined) response.posts = mapped.posts;
        if (mapped.posts_location !== undefined) response.posts_location = mapped.posts_location;
        if (mapped.posts_count !== undefined) response.posts_count = mapped.posts_count;
    }

    return c.json(response);
}
