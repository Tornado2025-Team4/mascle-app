import { Context } from 'hono';
import { ApiErrorFatal } from '../../../_cmn/error';
import { mustGetCtx } from '../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from './../_cmn/userid_resolve';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';
import { convDateForFE, convDurationForFE, precision } from '@/src/api/_cmn/conv_date_for_fe';

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
    registered_since?: string
    training_since?: string
    skill_level?: string
    tags?: Array<{
        pub_id: string
        name: string
    }>
    intents?: Array<{
        pub_id: string
        intent: string
    }>
    intent_bodyparts?: Array<{
        pub_id: string
        bodypart: string
    }>
    belonging_gyms?: Array<{
        pub_id: string
        name: string
        gymchain?: {
            pub_id: string
            name: string
            icon_url?: string
            internal_id?: string
        }
        photo_url?: string
        joined_since?: string
    }>
    followings_count?: number
    followers_count?: number
    posts_count?: number
}

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    let response: respBody;

    if (userIdInfo.anonPubId) {
        response = await getdata_anon(c, userIdInfo.anonPubId);
    } else {
        response = await getdata(c, userIdInfo.pubId);
    }

    return c.json(response);
}

const getdata = async (c: Context, userPubId: string): Promise<respBody> => {
    const { spCl: spClSA } = mustGetSpClSessOrAnon(c);
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const { data: profile, error: profileErr } = await spClSA
        .from('views_user_profile')
        .select('*')
        .eq('pub_id', userPubId)
        .single();

    if (profileErr) {
        throw new ApiErrorFatal(`DB access error: ${profileErr.message}`);
    }

    if (!profile) {
        throw new ApiErrorFatal('User not found');
    }

    // アイコンの署名URL生成
    let icon_url: string | undefined = undefined;
    if (profile.icon_name) {
        const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
            .from('users_icons')
            .createSignedUrl(profile.icon_name, 60 * 60);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            throw new ApiErrorFatal(`Failed to create signed URL for icon: ${signedUrlError?.message || 'unknown error'}`);
        } else {
            icon_url = signedUrlData.signedUrl;
        }
    }

    // belonging_gymsのphoto署名URL生成
    const belonging_gyms = Array.isArray(profile.belonging_gyms)
        ? await Promise.all(profile.belonging_gyms.map(async (gym: {
            pub_id: string;
            name: string;
            gymchain?: {
                pub_id: string;
                name: string;
                icon_rel_id?: string;
                icon_name?: string;
                internal_id?: string;
            };
            photo_rel_id?: string;
            photo_name?: string;
            joined_since?: string;
        }) => {
            let photo_url: string | undefined = undefined;
            if (gym.photo_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('gyms_photos')
                        .createSignedUrl(gym.photo_name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        photo_url = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for gym photo:', e);
                }
            }

            // gymchainのicon署名URL生成
            let gymchain_with_icon_url;
            if (gym.gymchain) {
                let gymchain_icon_url: string | undefined = undefined;
                if (gym.gymchain.icon_name) {
                    try {
                        const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                            .from('gymchains_icons')
                            .createSignedUrl(gym.gymchain.icon_name, 60 * 60);

                        if (!signedUrlError && signedUrlData?.signedUrl) {
                            gymchain_icon_url = signedUrlData.signedUrl;
                        }
                    } catch (e) {
                        console.error('Failed to create signed URL for gymchain icon:', e);
                    }
                }

                gymchain_with_icon_url = {
                    ...gym.gymchain,
                    icon_url: gymchain_icon_url,
                    icon_rel_id: undefined, // 元のicon_rel_idフィールドは削除
                    icon_name: undefined // 元のicon_nameフィールドは削除
                };
            }

            return {
                ...gym,
                photo_url,
                photo_rel_id: undefined, // 元のphoto_rel_idフィールドは削除
                photo_name: undefined, // 元のphoto_nameフィールドは削除
                gymchain: gymchain_with_icon_url,
                joined_since: gym.joined_since ? convDurationForFE(new Date(gym.joined_since), new Date(), precision.DAY) : undefined
            };
        }))
        : [];

    return {
        pub_id: profile.pub_id,
        handle: profile.handle,
        display_name: profile.display_name,
        description: profile.description,
        icon_url,
        birth_date: profile.birth_date ? convDateForFE(new Date(profile.birth_date), precision.DAY) : undefined,
        age: profile.age,
        generation: profile.generation,
        gender: profile.gender,
        registered_since: profile.registered_since ? convDurationForFE(new Date(profile.registered_since), new Date(), precision.DAY) : undefined,
        training_since: profile.training_since ? convDurationForFE(new Date(profile.training_since), new Date(), precision.DAY) : undefined,
        skill_level: profile.skill_level,
        tags: profile.tags || [],
        intents: profile.intents || [],
        intent_bodyparts: profile.intent_bodyparts || [],
        belonging_gyms,
        followings_count: profile.followings_count,
        followers_count: profile.followers_count,
        posts_count: profile.posts_count
    };
};

const getdata_anon = async (c: Context, userAnonPubId: string): Promise<respBody> => {
    const { spCl: spClSA } = mustGetSpClSessOrAnon(c);
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const { data: profile, error: profileErr } = await spClSA
        .from('views_user_profile_anon')
        .select('*')
        .eq('pub_id', userAnonPubId)
        .single();

    if (profileErr) {
        throw new ApiErrorFatal(`DB access error: ${profileErr.message}`);
    }

    if (!profile) {
        throw new ApiErrorFatal('User not found');
    }

    // アイコンの署名URL生成
    let icon_url: string | undefined = undefined;
    if (profile.icon_name) {
        try {
            const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                .from('users_icons')
                .createSignedUrl(profile.icon_name, 60 * 60);

            if (!signedUrlError && signedUrlData?.signedUrl) {
                icon_url = signedUrlData.signedUrl;
            }
        } catch (e) {
            console.error('Failed to create signed URL for icon:', e);
        }
    }

    // belonging_gymsのphoto署名URL生成
    const belonging_gyms = Array.isArray(profile.belonging_gyms)
        ? await Promise.all(profile.belonging_gyms.map(async (gym: {
            pub_id: string;
            name: string;
            gymchain?: {
                pub_id: string;
                name: string;
                icon_rel_id?: string;
                icon_name?: string;
                internal_id?: string;
            };
            photo_rel_id?: string;
            photo_name?: string;
            joined_since?: string;
        }) => {
            let photo_url: string | undefined = undefined;
            if (gym.photo_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('gyms_photos')
                        .createSignedUrl(gym.photo_name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        photo_url = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for gym photo:', e);
                }
            }

            // gymchainのicon署名URL生成
            let gymchain_with_icon_url;
            if (gym.gymchain) {
                let gymchain_icon_url: string | undefined = undefined;
                if (gym.gymchain.icon_name) {
                    try {
                        const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                            .from('gymchains_icons')
                            .createSignedUrl(gym.gymchain.icon_name, 60 * 60);

                        if (!signedUrlError && signedUrlData?.signedUrl) {
                            gymchain_icon_url = signedUrlData.signedUrl;
                        }
                    } catch (e) {
                        console.error('Failed to create signed URL for gymchain icon:', e);
                    }
                }

                gymchain_with_icon_url = {
                    ...gym.gymchain,
                    icon_url: gymchain_icon_url,
                    icon_rel_id: undefined, // 元のicon_rel_idフィールドは削除
                    icon_name: undefined // 元のicon_nameフィールドは削除
                };
            }

            return {
                ...gym,
                photo_url,
                photo_rel_id: undefined, // 元のphoto_rel_idフィールドは削除
                photo_name: undefined, // 元のphoto_nameフィールドは削除
                gymchain: gymchain_with_icon_url,
                joined_since: gym.joined_since ? convDurationForFE(new Date(gym.joined_since), new Date(), precision.DAY) : undefined
            };
        }))
        : [];

    return {
        pub_id: profile.pub_id,
        anon_pub_id: profile.anon_pub_id,
        handle: profile.handle,
        display_name: profile.display_name,
        description: profile.description,
        icon_url,
        birth_date: profile.birth_date ? convDateForFE(new Date(profile.birth_date), precision.DAY) : undefined,
        age: profile.age,
        generation: profile.generation,
        gender: profile.gender,
        registered_since: profile.registered_since ? convDurationForFE(new Date(profile.registered_since), new Date(), precision.DAY) : undefined,
        training_since: profile.training_since ? convDurationForFE(new Date(profile.training_since), new Date(), precision.DAY) : undefined,
        skill_level: profile.skill_level,
        tags: profile.tags || [],
        intents: profile.intents || [],
        intent_bodyparts: profile.intent_bodyparts || [],
        belonging_gyms,
        followings_count: profile.followings_count,
        followers_count: profile.followers_count,
        posts_count: profile.posts_count
    };
};
