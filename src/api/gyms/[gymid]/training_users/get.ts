import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorTransient } from '../../../_cmn/error';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { UserJwtInfo } from '@/src/api/_cmn/verify_jwt';
import { SupabaseClient } from '@supabase/supabase-js';

interface BasicTrainingUser {
    gym_pub_id: string;
    gym_name: string;
    user_pub_id: string;
    user_handle: string;
    user_anon_pub_id: string;
    status_pub_id: string;
    started_at: string;
    finished_at: string | null;
    visibility_level: 'real' | 'anonymous' | 'hidden';
}

interface ProcessedProfile {
    pub_id?: string;
    anon_pub_id?: string;
    handle?: string;
    display_name?: string | null;
    description?: string | null;
    icon_url?: string;
    skill_level?: number | null;
    tags?: Array<{ pub_id: string; name: string }>;
    followers_count?: number | null;
    followings_count?: number | null;
}

const get = async (c: Context) => {
    const gymId = c.req.param('gymid');
    const { spCl } = mustGetSpClSessOrAnon(c);
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');
    const jwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

    if (!gymId) {
        throw new ApiErrorNotFound('Gym ID');
    }

    try {
        // ジムでトレーニング中のユーザー一覧を取得（自身を除外）
        const query = spCl
            .from('views_gym_training_users')
            .select('*')
            .eq('gym_pub_id', gymId)
            .neq('user_pub_id', jwtInfo.obj.id); // 自身を除外

        const { data: trainingUsers, error } = await query.order('started_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            throw new ApiErrorTransient(`Failed to fetch training users: ${error.message}`);
        }

        const users = trainingUsers as BasicTrainingUser[] || [];

        // 可視性レベルごとに分類
        const publicUsers = users.filter(user => user.visibility_level === 'real');
        const anonymousUsers = users.filter(user => user.visibility_level === 'anonymous');
        const hiddenUserCount = users.filter(user => user.visibility_level === 'hidden').length;

        // 公開ユーザーのプロフィール情報を取得・処理
        const publicUsersWithProfiles = await Promise.all(
            publicUsers.map(async (user) => {
                const { data: profile, error: profileErr } = await spCl
                    .from('views_user_profile')
                    .select('*')
                    .eq('pub_id', user.user_pub_id)
                    .single();

                if (profileErr) {
                    console.error('Failed to fetch public profile:', profileErr);
                    return {
                        user_pub_id: user.user_pub_id,
                        status_pub_id: user.status_pub_id,
                        started_at: user.started_at,
                        anchor_type: 'handle' as const,
                        anchor_value: user.user_handle,
                        profile: null
                    };
                }

                const processedProfile = await processProfile(profile, spClSrv);

                return {
                    user_pub_id: user.user_pub_id,
                    status_pub_id: user.status_pub_id,
                    started_at: user.started_at,
                    anchor_type: 'handle' as const,
                    anchor_value: user.user_handle,
                    profile: processedProfile
                };
            })
        );

        // 匿名ユーザーのプロフィール情報を取得・処理
        const anonymousUsersWithProfiles = await Promise.all(
            anonymousUsers.map(async (user) => {
                const { data: profile, error: profileErr } = await spCl
                    .from('views_user_profile_anon')
                    .select('*')
                    .eq('anon_pub_id', user.user_anon_pub_id)
                    .single();

                if (profileErr) {
                    console.error('Failed to fetch anonymous profile:', profileErr);
                    return {
                        status_pub_id: user.status_pub_id,
                        started_at: user.started_at,
                        anchor_type: 'anon_id' as const,
                        anchor_value: user.user_anon_pub_id,
                        profile: null
                    };
                }

                const processedProfile = await processProfile(profile, spClSrv, true);

                return {
                    status_pub_id: user.status_pub_id,
                    started_at: user.started_at,
                    anchor_type: 'anon_id' as const,
                    anchor_value: user.user_anon_pub_id,
                    profile: processedProfile
                };
            })
        );

        // レスポンスの構築
        const response = {
            gym_pub_id: gymId,
            total_count: users.length,
            sections: {
                public: {
                    count: publicUsers.length,
                    users: publicUsersWithProfiles
                },
                anonymous: {
                    count: anonymousUsers.length,
                    users: anonymousUsersWithProfiles
                },
                hidden: {
                    count: hiddenUserCount
                }
            }
        };

        return c.json(response);
    } catch (error) {
        console.error('Error fetching training users:', error);
        if (error instanceof Error && error.message.includes('ApiError')) {
            throw error;
        }
        throw new ApiErrorTransient(`Failed to fetch training users: ${error}`);
    }
};

// プロフィール処理関数（プロフィール実装を参考）
const processProfile = async (
    profile: {
        pub_id?: string;
        anon_pub_id?: string;
        handle?: string;
        display_name?: string | null;
        description?: string | null;
        icon_name?: string | null;
        skill_level?: number | null;
        tags?: Array<{ pub_id: string; name: string }>;
        followers_count?: number | null;
        followings_count?: number | null;
    },
    spClSrv: SupabaseClient,
    isAnonymous: boolean = false
): Promise<ProcessedProfile | null> => {
    if (!profile) return null;

    try {
        // アイコンの署名URL生成
        let icon_url: string | undefined = undefined;
        if (profile.icon_name) {
            const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                .from('users_icons')
                .createSignedUrl(profile.icon_name, 60 * 60);

            if (!signedUrlError && signedUrlData?.signedUrl) {
                icon_url = signedUrlData.signedUrl;
            } else {
                console.error('Failed to create signed URL for icon:', signedUrlError?.message);
            }
        }

        const result: ProcessedProfile = {
            display_name: profile.display_name ?? null,
            description: profile.description ?? null,
            skill_level: profile.skill_level ?? null,
            tags: profile.tags || [],
            followers_count: profile.followers_count ?? null,
            followings_count: profile.followings_count ?? null
        };

        if (isAnonymous) {
            if (profile.anon_pub_id) {
                result.anon_pub_id = profile.anon_pub_id;
            }
        } else {
            if (profile.pub_id) {
                result.pub_id = profile.pub_id;
            }
            if (profile.handle) {
                result.handle = profile.handle;
            }
        }

        if (icon_url) {
            result.icon_url = icon_url;
        }

        return result;
    } catch (error) {
        console.error('Error processing profile:', error);
        return null;
    }
};

export default get;
