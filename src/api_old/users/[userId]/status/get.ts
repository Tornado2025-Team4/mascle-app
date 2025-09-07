/**
 * GET /users/:userId/status
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Response:
 * {
 *   pub_id: string;
 *   user_pub_id: string;
 *   started_at: string;
 *   finished_at: string | null;
 *   is_auto_detected: boolean;
 *   gym?: {
 *     pub_id: string;
 *     name: string;
 *     photo_url?: string;
 *     gymchain?: {
 *       pub_id: string;
 *       name: string;
 *       icon_url?: string;
 *       internal_id: string;
 *     };
 *   };
 *   partners: Array<{
 *     handle: string;
 *     display_name?: string;
 *     description?: string;
 *     tags: Array<{
 *       pub_id: string;
 *       name: string;
 *     }>;
 *     icon_url?: string;
 *     skill_level?: string;
 *     followings_count?: number;
 *     followers_count?: number;
 *   }>;
 * } | null
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '@/src/api_old/_cmn/error';
import { UserSpecificId } from '../_mw/userid_resolve';

export default async function get(c: Context) {
    const userSpecificId = c.get('userSpecificId') as UserSpecificId | undefined;
    if (!userSpecificId) {
        await FatalErrorHandler(c, "userSpecificId not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const uuid = userSpecificId.uuid.v;

    const spClSess = c.get('supabaseClientSess') || c.get('supabaseClientAnon');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClient not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    // ユーザーが存在するかチェック
    const { data: userCheck, error: userCheckError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('in_spbs_id', uuid)
        .single();

    if (userCheckError || !userCheck) {
        return new ApiErrorNotFound('User').into_resp(c);
    }

    // 認証情報があれば現在のユーザーIDを設定
    const userAuthnInfo = c.get('userAuthnInfo');
    let currentUserRelId = null;
    if (userAuthnInfo) {
        const { data: currentUserData } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', userAuthnInfo.userObj.id)
            .single();
        currentUserRelId = currentUserData?.rel_id;
    }

    if (currentUserRelId) {
        await spClSess.rpc('set_config', {
            setting_name: 'app.current_user_rel_id',
            new_value: currentUserRelId.toString(),
            is_local: true
        });
    }

    // 最新の状態を取得（未終了のものまたは最新の終了したもの）
    const { data, error } = await spClSess
        .from('views_user_status')
        .select('*')
        .eq('user_pub_id', uuid)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            return c.json(null);
        }
        await FatalErrorHandler(c, error, "fetching user status");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!data || !data.privacy_allowed_status) {
        return c.json(null);
    }

    // ジムの写真の署名済みURL作成
    let gym = null;
    if (data.gym) {
        const gymData = data.gym as {
            pub_id: string;
            name: string;
            photo_rel_id?: string;
            photo_name?: string;
            gymchain?: {
                pub_id: string;
                name: string;
                icon_rel_id?: string;
                icon_name?: string;
                internal_id: string;
            };
        };
        let photo_url = null;
        let gymchain_icon_url = null;

        if (gymData.photo_rel_id && gymData.photo_name) {
            const photoPath = gymData.photo_name;
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                    .from('gyms_photos')
                    .createSignedUrl(photoPath, 60 * 60);
                if (signedUrlError) {
                    await FatalErrorHandler(c, signedUrlError, "creating signed URL for gym photo");
                } else {
                    photo_url = signedUrlData?.signedUrl || null;
                }
            } catch (e) {
                await FatalErrorHandler(c, e, "exception creating signed URL for gym photo");
            }
        }

        if (gymData.gymchain?.icon_rel_id && gymData.gymchain?.icon_name) {
            const iconPath = gymData.gymchain.icon_name;
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                    .from('gymchains_icons')
                    .createSignedUrl(iconPath, 60 * 60);
                if (signedUrlError) {
                    await FatalErrorHandler(c, signedUrlError, "creating signed URL for gymchain icon");
                } else {
                    gymchain_icon_url = signedUrlData?.signedUrl || null;
                }
            } catch (e) {
                await FatalErrorHandler(c, e, "exception creating signed URL for gymchain icon");
            }
        }

        gym = {
            pub_id: gymData.pub_id,
            name: gymData.name,
            photo_url,
            gymchain: gymData.gymchain ? {
                pub_id: gymData.gymchain.pub_id,
                name: gymData.gymchain.name,
                icon_url: gymchain_icon_url,
                internal_id: gymData.gymchain.internal_id
            } : undefined
        };
    }

    // パートナーのアイコン署名済みURL作成
    const partners = [];
    if (data.partners && Array.isArray(data.partners)) {
        for (const partner of data.partners) {
            let icon_url = null;
            if (partner.icon_rel_id && partner.icon_name) {
                const iconPath = partner.icon_name;
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                        .from('users_icons')
                        .createSignedUrl(iconPath, 60 * 60);
                    if (signedUrlError) {
                        await FatalErrorHandler(c, signedUrlError, "creating signed URL for partner icon");
                    } else {
                        icon_url = signedUrlData?.signedUrl || null;
                    }
                } catch (e) {
                    await FatalErrorHandler(c, e, "exception creating signed URL for partner icon");
                }
            }

            partners.push({
                handle: partner.handle,
                display_name: partner.display_name,
                description: partner.description,
                tags: partner.tags || [],
                icon_url,
                skill_level: partner.skill_level,
                followings_count: partner.followings_count,
                followers_count: partner.followers_count
            });
        }
    }

    const response = {
        pub_id: data.pub_id,
        user_pub_id: data.user_pub_id,
        started_at: data.started_at,
        finished_at: data.finished_at,
        is_auto_detected: data.is_auto_detected,
        gym,
        partners
    };

    return c.json(response);
}
