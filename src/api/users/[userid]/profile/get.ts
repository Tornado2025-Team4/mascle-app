import { Context } from 'hono';
import { ApiErrorFatal } from '../../../_cmn/error';
import { mustGetCtx } from '../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from './../_cmn/userid_resolve';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';

interface respBody {
    pub_id?: string
    anon_pub_id?: string
    handle?: string
    display_name?: string
    description?: string
    icon_url?: string
    birth_date?: string
    age?: number
    generation?: number
    gender?: string
    registerd_since?: string
    training_since?: string
    skill_level?: string
    tags?: string[]
    intents?: string[]
    intent_bodyparts?: string[]
    belonging_gyms?: string[]
    status?: {
        started_at?: string
        finished_at?: string
        is_auto_detected?: boolean
        gym_pub_id?: string
    }
    follows_count?: number
    followers_count?: number
    posts_count?: number
}

export default async function get(c: Context) {
    const { spCl } = mustGetSpClSessOrAnon(c);
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    let response: respBody;

    if (userIdInfo.anonPubId) {
        response = await getdata_anon(c, spCl, userIdInfo.anonPubId);
    } else {
        response = await getdata(c, spCl, userIdInfo.pubId);
    }

    return c.json(response);
}

const getdata = async (c: Context, spCl: SupabaseClient, userPubId: string): Promise<respBody> => {
    const { data: main, error: mainErr } = await spCl
        .from('view_users_line_profile')
        .select('*')
        .eq('pub_id', userPubId)
        .single();
    const { data: tags, error: tagsErr } = await spCl
        .from('view_users_lines_tags')
        .select('*')
        .eq('user_pub_id', userPubId);
    const { data: intents, error: intentsErr } = await spCl
        .from('view_users_lines_intents')
        .select('*')
        .eq('user_pub_id', userPubId);
    const { data: intentBodyparts, error: intentBodypartsErr } = await spCl
        .from('view_users_lines_intent_bodyparts')
        .select('*')
        .eq('user_pub_id', userPubId);
    const { data: belongingGyms, error: belongingGymsErr } = await spCl
        .from('view_users_lines_belonging_gyms')
        .select('*')
        .eq('user_pub_id', userPubId);
    const { data: viewStatusMaster, error: viewStatusMasterErr } = await spCl
        .from('view_status_master')
        .select('*')
        .eq('user_pub_id', userPubId)
        .order('started_at', { ascending: false, nullsFirst: true })
        .limit(1);
    const { data: summary, error: summaryErr } = await spCl
        .from('view_users_summary')
        .select('*')
        .eq('user_pub_id', userPubId)
        .single();

    if (mainErr || tagsErr || intentsErr || intentBodypartsErr || belongingGymsErr || viewStatusMasterErr || summaryErr) {
        throw new ApiErrorFatal(`DB access error: ${(mainErr || tagsErr || intentsErr || intentBodypartsErr || belongingGymsErr || viewStatusMasterErr || summaryErr)?.message}`);
    }

    const status = viewStatusMaster && viewStatusMaster.length > 0 ? viewStatusMaster[0] : null;

    const convertRelIdsToPubIds = async (relIds: number[], tableName: string) => {
        if (relIds.length === 0) return [];
        const { data, error } = await spCl
            .from(tableName)
            .select('pub_id, rel_id')
            .in('rel_id', relIds);
        if (error) {
            console.error(`Failed to convert rel_ids to pub_ids for ${tableName}:`, error);
            return [];
        }
        const relIdToPubId = Object.fromEntries(data.map(item => [item.rel_id, item.pub_id]));
        return relIds.map(relId => relIdToPubId[relId]).filter(Boolean);
    };

    const tagRelIds = tags?.map((tag: { tag_rel_id: number }) => tag.tag_rel_id).filter(id => id !== null) || [];
    const intentRelIds = intents?.map((intent: { intent_rel_id: number }) => intent.intent_rel_id).filter(id => id !== null) || [];
    const bodypartRelIds = intentBodyparts?.map((bp: { bodypart_rel_id: number }) => bp.bodypart_rel_id).filter(id => id !== null) || [];
    const gymRelIds = belongingGyms?.map((gym: { gym_rel_id: number }) => gym.gym_rel_id).filter(id => id !== null) || []

    const [tagPubIds, intentPubIds, bodypartPubIds, gymPubIds] = await Promise.all([
        convertRelIdsToPubIds(tagRelIds, 'tags_master'),
        convertRelIdsToPubIds(intentRelIds, 'intents_master'),
        convertRelIdsToPubIds(bodypartRelIds, 'bodyparts_master'),
        convertRelIdsToPubIds(gymRelIds, 'gyms_master')
    ]);

    let gymPubIdForStatus: string | undefined = undefined;
    if (status?.gym_rel_id) {
        const gymStatusPubIds = await convertRelIdsToPubIds([status.gym_rel_id], 'gyms_master');
        gymPubIdForStatus = gymStatusPubIds[0];
    }

    let icon_url: string | null = null;
    if (main?.icon_rel_id) {
        try {
            const { data: signedUrlData, error: signedUrlError } = await spCl.storage
                .from('users_icons')
                .createSignedUrl(main.icon_rel_id, 60 * 60);

            if (!signedUrlError && signedUrlData?.signedUrl) {
                icon_url = signedUrlData.signedUrl;
            }
        } catch (e) {
            console.error('Failed to create signed URL for icon:', e);
        }
    }

    return {
        pub_id: main?.pub_id,
        anon_pub_id: main?.anon_pub_id,
        handle: main?.handle,
        display_name: main?.display_name,
        description: main?.description,
        icon_url: icon_url || undefined,
        birth_date: main?.birth_date,
        age: main?.age,
        generation: main?.generation,
        gender: main?.gender,
        registerd_since: main?.registerd_since,
        training_since: main?.training_since,
        skill_level: main?.skill_level,
        tags: tagPubIds,
        intents: intentPubIds,
        intent_bodyparts: bodypartPubIds,
        belonging_gyms: gymPubIds,
        status: status ? {
            started_at: status.started_at,
            finished_at: status.finished_at,
            is_auto_detected: status.is_auto_detected,
            gym_pub_id: gymPubIdForStatus
        } : undefined,
        follows_count: summary?.follows_count,
        followers_count: summary?.followers_count,
        posts_count: summary?.posts_count
    };
};

const getdata_anon = async (c: Context, spCl: SupabaseClient, userAnonPubId: string): Promise<respBody> => {
    const { data: main, error: mainErr } = await spCl
        .from('view_users_line_profile_anon')
        .select('*')
        .eq('pub_id', userAnonPubId)
        .single();
    const { data: tags, error: tagsErr } = await spCl
        .from('view_users_lines_tags_anon')
        .select('*')
        .eq('user_pub_id', userAnonPubId);
    const { data: intents, error: intentsErr } = await spCl
        .from('view_users_lines_intents_anon')
        .select('*')
        .eq('user_pub_id', userAnonPubId);
    const { data: intentBodyparts, error: intentBodypartsErr } = await spCl
        .from('view_users_lines_intent_bodyparts_anon')
        .select('*')
        .eq('user_pub_id', userAnonPubId);
    const { data: belongingGyms, error: belongingGymsErr } = await spCl
        .from('view_users_lines_belonging_gyms_anon')
        .select('*')
        .eq('user_pub_id', userAnonPubId);
    const { data: viewStatusMaster, error: viewStatusMasterErr } = await spCl
        .from('view_status_master_anon')
        .select('*')
        .eq('user_pub_id', userAnonPubId)
        .order('started_at', { ascending: false, nullsFirst: true })
        .limit(1);
    const { data: summary, error: summaryErr } = await spCl
        .from('view_users_summary_anon')
        .select('*')
        .eq('user_pub_id', userAnonPubId)
        .single();

    if (mainErr || tagsErr || intentsErr || intentBodypartsErr || belongingGymsErr || viewStatusMasterErr || summaryErr) {
        throw new ApiErrorFatal(`DB access error: ${(mainErr || tagsErr || intentsErr || intentBodypartsErr || belongingGymsErr || viewStatusMasterErr || summaryErr)?.message}`);
    }

    const status = viewStatusMaster && viewStatusMaster.length > 0 ? viewStatusMaster[0] : null;

    const convertRelIdsToPubIds = async (relIds: number[], tableName: string) => {
        if (relIds.length === 0) return [];
        const { data, error } = await spCl
            .from(tableName)
            .select('pub_id, rel_id')
            .in('rel_id', relIds);
        if (error) {
            console.error(`Failed to convert rel_ids to pub_ids for ${tableName}:`, error);
            return [];
        }
        const relIdToPubId = Object.fromEntries(data.map(item => [item.rel_id, item.pub_id]));
        return relIds.map(relId => relIdToPubId[relId]).filter(Boolean);
    };

    const tagRelIds = tags?.map((tag: { tag_rel_id: number }) => tag.tag_rel_id).filter(id => id !== null) || [];
    const intentRelIds = intents?.map((intent: { intent_rel_id: number }) => intent.intent_rel_id).filter(id => id !== null) || [];
    const bodypartRelIds = intentBodyparts?.map((bp: { bodypart_rel_id: number }) => bp.bodypart_rel_id).filter(id => id !== null) || [];
    const gymRelIds = belongingGyms?.map((gym: { gym_rel_id: number }) => gym.gym_rel_id).filter(id => id !== null) || [];

    const [tagPubIds, intentPubIds, bodypartPubIds, gymPubIds] = await Promise.all([
        convertRelIdsToPubIds(tagRelIds, 'tags_master'),
        convertRelIdsToPubIds(intentRelIds, 'intents_master'),
        convertRelIdsToPubIds(bodypartRelIds, 'bodyparts_master'),
        convertRelIdsToPubIds(gymRelIds, 'gyms_master')
    ]);

    let gymPubIdForStatus: string | undefined = undefined;
    if (status?.gym_rel_id) {
        const gymStatusPubIds = await convertRelIdsToPubIds([status.gym_rel_id], 'gyms_master');
        gymPubIdForStatus = gymStatusPubIds[0];
    }

    let icon_url: string | null = null;
    if (main?.icon_rel_id) {
        try {
            const { data: signedUrlData, error: signedUrlError } = await spCl.storage
                .from('users_icons')
                .createSignedUrl(main.icon_rel_id, 60 * 60);

            if (!signedUrlError && signedUrlData?.signedUrl) {
                icon_url = signedUrlData.signedUrl;
            }
        } catch (e) {
            console.error('Failed to create signed URL for icon:', e);
        }
    }

    return {
        pub_id: main?.pub_id,
        anon_pub_id: main?.anon_pub_id,
        handle: main?.handle,
        display_name: main?.display_name,
        description: main?.description,
        icon_url: icon_url || undefined,
        birth_date: main?.birth_date,
        age: main?.age,
        generation: main?.generation,
        gender: main?.gender,
        registerd_since: main?.registerd_since,
        training_since: main?.training_since,
        skill_level: main?.skill_level,
        tags: tagPubIds,
        intents: intentPubIds,
        intent_bodyparts: bodypartPubIds,
        belonging_gyms: gymPubIds,
        status: status ? {
            started_at: status.started_at,
            finished_at: status.finished_at,
            is_auto_detected: status.is_auto_detected,
            gym_pub_id: gymPubIdForStatus
        } : undefined,
        follows_count: summary?.follows_count,
        followers_count: summary?.followers_count,
        posts_count: summary?.posts_count
    };
};
