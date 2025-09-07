import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorFatal, ApiErrorBadRequest } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';
import { SupabaseClient } from '@supabase/supabase-js';

interface UserSummary {
    pub_id: string;
    handle: string;
    display_name?: string;
    description?: string;
    tags?: Array<{
        pub_id: string;
        name: string;
    }>;
    icon_url?: string;
    skill_level?: string;
    followings_count?: number;
    followers_count?: number;
}

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const { spCl: spClSA } = mustGetSpClSessOrAnon(c);
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const limitRaw = c.req.query('limit');
    const limit = limitRaw ? Math.min(Number(limitRaw), 100) : 20;

    if (isNaN(limit) || limit <= 0) {
        throw new ApiErrorBadRequest('limit must be a positive number');
    }

    const { data: userRel, error: userRelError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userRelError || !userRel) {
        throw new ApiErrorFatal(`Failed to get user rel_id: ${userRelError?.message}`);
    }

    const { data: followersData, error: followersError } = await spClSA
        .from('views_user_rel')
        .select('follower_user_pub_id')
        .eq('followed_user_pub_id', userIdInfo.pubId)
        .eq('privacy_allowed', true)
        .limit(limit);

    if (followersError) {
        throw new ApiErrorFatal(`Failed to get followers: ${followersError.message}`);
    }

    const followerPubIds = followersData.map(f => f.follower_user_pub_id);

    if (followerPubIds.length === 0) {
        return c.json([]);
    }

    const { data: profilesData, error: profilesError } = await spClSA
        .from('views_user_profile')
        .select('*')
        .in('pub_id', followerPubIds);

    if (profilesError) {
        throw new ApiErrorFatal(`Failed to get user profiles: ${profilesError.message}`);
    }

    const response: UserSummary[] = await Promise.all(
        profilesData.map(async (profile) => {
            let icon_url: string | undefined = undefined;
            if (profile.icon_name) {
                try {
                    const { data: signedUrlData } = await spClSrv.storage
                        .from('users_icons')
                        .createSignedUrl(profile.icon_name, 60 * 60);

                    if (signedUrlData?.signedUrl) {
                        icon_url = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for icon:', e);
                }
            }

            return {
                pub_id: profile.pub_id,
                handle: profile.handle,
                display_name: profile.display_name,
                description: profile.description,
                tags: profile.tags || [],
                icon_url,
                skill_level: profile.skill_level,
                followings_count: profile.followings_count,
                followers_count: profile.followers_count
            };
        })
    );

    return c.json(response);
}