
import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorNotFound, ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetPath } from '@/src/api/_cmn/get_path';
import { SupabaseClient } from '@supabase/supabase-js';
import { convDateForFE, precision } from '@/src/api/_cmn/conv_date_for_fe';

interface respBody {
    pub_id: string;
    user_pub_id: string;
    started_at: string;
    finished_at?: string | null;
    is_auto_detected: boolean;
    gym?: {
        pub_id: string;
        name: string;
        photo_url?: string;
        gymchain?: {
            pub_id: string;
            name: string;
            icon_url?: string;
            internal_id?: string;
        };
    } | null;
    partners: Array<{
        pub_id: string;// >! これ忘れてる
        handle: string;
        display_name?: string;
        description?: string;
        tags: Array<{
            pub_id: string;
            name: string;
        }>;
        icon_url?: string;
        skill_level?: string;
        followings_count?: number;
        followers_count?: number;
    }>;
    menus: Array<{
        menu: {
            pub_id: string;
            name: string;
            bodypart?: {
                pub_id: string;
                name: string;
            };
        };
        sets: Array<{
            weight?: number;
            reps?: number;
        }>;
    }>;
    menus_cardio: Array<{
        menu: {
            pub_id: string;
            name: string;
        };
        duration?: string;
        distance?: number;
    }>;
}

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const stateId = mustGetPath(c, 'stateid');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    // latestの場合は最新のステータスを取得
    let targetStatusPubId = stateId;
    if (stateId === 'latest') {
        const { data: latestStatus, error: latestError } = await spClSess
            .from('views_user_status')
            .select('pub_id')
            .eq('user_pub_id', userIdInfo.pubId)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latestError) {
            throw new ApiErrorFatal(`DB access error: ${latestError.message}`);
        }

        if (!latestStatus) {
            throw new ApiErrorNotFound('Status');
        }

        targetStatusPubId = latestStatus.pub_id;
    }

    // ステータス詳細を取得
    const { data: status, error: statusError } = await spClSess
        .from('views_user_status')
        .select('*')
        .eq('pub_id', targetStatusPubId)
        .single();

    if (statusError) {
        if (statusError.code === 'PGRST116') {
            throw new ApiErrorNotFound('Status');
        }
        throw new ApiErrorFatal(`DB access error: ${statusError.message}`);
    }

    if (!status.privacy_allowed_status) {
        throw new ApiErrorNotFound('Status');
    }

    // メニュー情報を取得
    const { data: menusData, error: menusError } = await spClSess
        .from('views_user_status_menus')
        .select('*')
        .eq('state_pub_id', targetStatusPubId)
        .single();

    if (menusError && menusError.code !== 'PGRST116') {
        throw new ApiErrorFatal(`DB access error: ${menusError.message}`);
    }

    // 有酸素メニュー情報を取得
    const { data: cardioMenusData, error: cardioMenusError } = await spClSess
        .from('views_user_status_menus_cardio')
        .select('*')
        .eq('state_pub_id', targetStatusPubId)
        .single();

    if (cardioMenusError && cardioMenusError.code !== 'PGRST116') {
        throw new ApiErrorFatal(`DB access error: ${cardioMenusError.message}`);
    }

    // 署名URLを生成して整形
    const formattedResponse = await formatStatusDetailResponse(
        spClSrv,
        status,
        menusData,
        cardioMenusData
    );

    return c.json(formattedResponse);
}

const formatStatusDetailResponse = async (
    spClSrv: SupabaseClient,
    status: {
        pub_id: string;
        user_pub_id: string;
        started_at: string;
        finished_at?: string | null;
        is_auto_detected: boolean;
        gym?: {
            pub_id: string;
            name: string;
            photo_name?: string;
            gymchain?: {
                pub_id: string;
                name: string;
                icon_name?: string;
                internal_id?: string;
            };
        } | null;
        partners?: Array<{
            pub_id: string;
            handle: string;
            display_name?: string;
            description?: string;
            tags?: Array<{
                pub_id: string;
                name: string;
            }>;
            icon_name?: string;
            skill_level?: string;
            followings_count?: number;
            followers_count?: number;
        }>;
    },
    menusData: {
        menus: Array<{
            menu: {
                pub_id: string;
                name: string;
                bodypart?: {
                    pub_id: string;
                    name: string;
                };
            };
            sets: Array<{
                weight?: number;
                reps?: number;
            }>;
        }>;
    } | null,
    cardioMenusData: {
        menus: Array<{
            menu: {
                pub_id: string;
                name: string;
            };
            duration?: string;
            distance?: number;
        }>;
    } | null
): Promise<respBody> => {
    // gym情報の署名URL生成
    let gym = null;
    if (status.gym) {
        let photo_url: string | undefined = undefined;
        if (status.gym.photo_name) {
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                    .from('gyms_photos')
                    .createSignedUrl(status.gym.photo_name, 60 * 60);

                if (!signedUrlError && signedUrlData?.signedUrl) {
                    photo_url = signedUrlData.signedUrl;
                }
            } catch (e) {
                console.error('Failed to create signed URL for gym photo:', e);
            }
        }

        // gymchainのicon署名URL生成
        let gymchain_with_icon_url;
        if (status.gym.gymchain) {
            let gymchain_icon_url: string | undefined = undefined;
            if (status.gym.gymchain.icon_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('gymchains_icons')
                        .createSignedUrl(status.gym.gymchain.icon_name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        gymchain_icon_url = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for gymchain icon:', e);
                }
            }

            gymchain_with_icon_url = {
                pub_id: status.gym.gymchain.pub_id,
                name: status.gym.gymchain.name,
                icon_url: gymchain_icon_url,
                internal_id: status.gym.gymchain.internal_id
            };
        }

        gym = {
            pub_id: status.gym.pub_id,
            name: status.gym.name,
            photo_url,
            gymchain: gymchain_with_icon_url
        };
    }

    // パートナーのアイコン署名URL生成
    const partners = Array.isArray(status.partners)
        ? await Promise.all(status.partners.map(async (partner: {
            pub_id: string;
            handle: string;
            display_name?: string;
            description?: string;
            tags?: Array<{
                pub_id: string;
                name: string;
            }>;
            icon_name?: string;
            skill_level?: string;
            followings_count?: number;
            followers_count?: number;
        }) => {
            let icon_url: string | undefined = undefined;
            if (partner.icon_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('users_icons')
                        .createSignedUrl(partner.icon_name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        icon_url = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for partner icon:', e);
                }
            }

            return {
                pub_id: partner.pub_id,
                handle: partner.handle,
                display_name: partner.display_name,
                description: partner.description,
                tags: partner.tags || [],
                icon_url,
                skill_level: partner.skill_level,
                followings_count: partner.followings_count,
                followers_count: partner.followers_count
            };
        }))
        : [];

    // メニューデータの整形
    const menus = menusData?.menus || [];
    const menus_cardio = cardioMenusData?.menus || [];

    return {
        pub_id: status.pub_id,
        user_pub_id: status.user_pub_id,
        started_at: convDateForFE(new Date(status.started_at), precision.MINUTE),
        finished_at: status.finished_at ? convDateForFE(new Date(status.finished_at), precision.MINUTE) : null,
        is_auto_detected: status.is_auto_detected,
        gym,
        partners,
        menus,
        menus_cardio
    };
};