/**
 * PATCH /users/:userId/status/:stateId
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me'のみ）
 * - stateId: string - ステータスID（pub_idまたは'latest'）
 *
 * Request Body:
 * {
 *   started_at?: string;
 *   finished_at?: string;
 *   gym_pub_id?: string;
 *   partners?: Array<{
 *     pub_id: string;
 *   }>;
 *   menus?: Array<{
 *     menu: {
 *       pub_id: string;
 *     };
 *     sets: Array<{
 *       weight?: number;
 *       reps?: number;
 *     }>;
 *   }>;
 *   menus_cardio?: Array<{
 *     menu: {
 *       pub_id: string;
 *     };
 *     duration?: string;
 *     distance?: number;
 *   }>;
 * }
 *
 * Response:
 * {
 *   pub_id: string;
 *   updated_fields: string[];
 * }
 */

import { Context } from 'hono';
import { ApiErrorBadRequest, ApiErrorUnauthorized, ApiErrorInternalServerError, ApiErrorNotFound, FatalErrorHandler } from '@/src/api_old/_cmn/error';
import { UserSpecificId } from '../../_mw/userid_resolve';
import { verifyUserAuthnFn } from '@/src/api_old/_mw/verify_user_authn';

export default async function patch(c: Context) {
    // 認証チェック
    const result = await verifyUserAuthnFn(c);
    if (result instanceof Response) {
        return result;
    }

    const userSpecificId = c.get('userSpecificId') as UserSpecificId | undefined;
    if (!userSpecificId || !userSpecificId.isSelf) {
        return new ApiErrorUnauthorized().into_resp(c);
    }

    const userAuthnInfo = c.get('userAuthnInfo');
    if (!userAuthnInfo) {
        return new ApiErrorUnauthorized().into_resp(c);
    }

    const stateId = c.req.param('stateId');
    if (!stateId) {
        return new ApiErrorNotFound('State').into_resp(c);
    }

    const spClSess = c.get('supabaseClientSess');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClientSess not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    // リクエストボディの検証
    let body;
    try {
        body = await c.req.json();
    } catch {
        return new ApiErrorBadRequest("Invalid JSON").into_resp(c);
    }

    // ユーザー情報取得
    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('in_spbs_id', userAuthnInfo.userObj.id)
        .single();

    if (userError || !userData) {
        return new ApiErrorNotFound('User').into_resp(c);
    }

    const userRelId = userData.rel_id;

    // ステータス情報取得・権限確認
    let statusQuery = spClSess
        .from('status_master')
        .select('rel_id, pub_id, user_rel_id')
        .eq('user_rel_id', userRelId);

    if (stateId === 'latest') {
        statusQuery = statusQuery.order('started_at', { ascending: false }).limit(1);
    } else {
        statusQuery = statusQuery.eq('pub_id', stateId);
    }

    const { data: statusData, error: statusError } = await statusQuery.single();

    if (statusError) {
        if (statusError.code === 'PGRST116') {
            return new ApiErrorNotFound('Status').into_resp(c);
        }
        await FatalErrorHandler(c, statusError, "fetching status");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!statusData || statusData.user_rel_id !== userRelId) {
        return new ApiErrorNotFound('Status').into_resp(c);
    }

    const statusRelId = statusData.rel_id;
    const statusPubId = statusData.pub_id;
    const updatedFields = [];

    // status_master の更新
    const statusUpdates: Record<string, unknown> = {};

    if (body.started_at) {
        statusUpdates.started_at = body.started_at;
        updatedFields.push('started_at');
    }

    if (body.finished_at !== undefined) {
        statusUpdates.finished_at = body.finished_at;
        updatedFields.push('finished_at');
    }

    if (body.gym_pub_id !== undefined) {
        if (body.gym_pub_id) {
            const { data: gymData, error: gymError } = await spClSess
                .from('gyms_master')
                .select('rel_id')
                .eq('pub_id', body.gym_pub_id)
                .single();

            if (gymError || !gymData) {
                return new ApiErrorNotFound('Gym').into_resp(c);
            }
            statusUpdates.gym_rel_id = gymData.rel_id;
        } else {
            statusUpdates.gym_rel_id = null;
        }
        updatedFields.push('gym');
    }

    if (Object.keys(statusUpdates).length > 0) {
        const { error: updateError } = await spClSess
            .from('status_master')
            .update(statusUpdates)
            .eq('rel_id', statusRelId);

        if (updateError) {
            await FatalErrorHandler(c, updateError, "updating status");
            return new ApiErrorInternalServerError().into_resp(c);
        }
    }

    // パートナー更新
    if (body.partners !== undefined) {
        // 既存のパートナーを削除
        const { error: deletePartnersError } = await spClSess
            .from('status_lines_partners')
            .delete()
            .eq('status_rel_id', statusRelId);

        if (deletePartnersError) {
            await FatalErrorHandler(c, deletePartnersError, "deleting existing partners");
            return new ApiErrorInternalServerError().into_resp(c);
        }

        // 新しいパートナーを挿入
        if (body.partners && Array.isArray(body.partners) && body.partners.length > 0) {
            const partnerRelIds = [];
            for (const partner of body.partners) {
                if (!partner.pub_id) {
                    return new ApiErrorBadRequest("Partner pub_id is required").into_resp(c);
                }

                const { data: partnerData, error: partnerError } = await spClSess
                    .from('users_master')
                    .select('rel_id')
                    .eq('pub_id', partner.pub_id)
                    .single();

                if (partnerError || !partnerData) {
                    return new ApiErrorNotFound('Partner user').into_resp(c);
                }
                partnerRelIds.push(partnerData.rel_id);
            }

            const partnerInserts = partnerRelIds.map(partnerRelId => ({
                status_rel_id: statusRelId,
                partner_user_rel_id: partnerRelId
            }));

            const { error: insertPartnersError } = await spClSess
                .from('status_lines_partners')
                .insert(partnerInserts);

            if (insertPartnersError) {
                await FatalErrorHandler(c, insertPartnersError, "inserting partners");
                return new ApiErrorInternalServerError().into_resp(c);
            }
        }
        updatedFields.push('partners');
    }

    // メニュー更新
    if (body.menus !== undefined) {
        // 既存のメニューとセットを削除
        const { error: deleteMenusError } = await spClSess
            .from('status_lines_menus')
            .delete()
            .eq('status_rel_id', statusRelId);

        if (deleteMenusError) {
            await FatalErrorHandler(c, deleteMenusError, "deleting existing menus");
            return new ApiErrorInternalServerError().into_resp(c);
        }

        // 新しいメニューを挿入
        if (body.menus && Array.isArray(body.menus) && body.menus.length > 0) {
            for (const menuEntry of body.menus) {
                if (!menuEntry.menu?.pub_id) {
                    return new ApiErrorBadRequest("Menu pub_id is required").into_resp(c);
                }

                const { data: menuData, error: menuError } = await spClSess
                    .from('menus_master')
                    .select('rel_id')
                    .eq('pub_id', menuEntry.menu.pub_id)
                    .single();

                if (menuError || !menuData) {
                    return new ApiErrorNotFound('Menu').into_resp(c);
                }

                const { data: statusMenuData, error: statusMenuError } = await spClSess
                    .from('status_lines_menus')
                    .insert({
                        status_rel_id: statusRelId,
                        menu_rel_id: menuData.rel_id
                    })
                    .select('rel_id')
                    .single();

                if (statusMenuError || !statusMenuData) {
                    await FatalErrorHandler(c, statusMenuError, "inserting status menu");
                    return new ApiErrorInternalServerError().into_resp(c);
                }

                // セット挿入
                if (menuEntry.sets && Array.isArray(menuEntry.sets) && menuEntry.sets.length > 0) {
                    const setInserts = menuEntry.sets.map((set: { weight?: number; reps?: number }, index: number) => ({
                        status_menu_rel_id: statusMenuData.rel_id,
                        set_num: index + 1,
                        weight: set.weight || null,
                        reps: set.reps || null
                    }));

                    const { error: setSetsError } = await spClSess
                        .from('status_lines_menus_sets')
                        .insert(setInserts);

                    if (setSetsError) {
                        await FatalErrorHandler(c, setSetsError, "inserting menu sets");
                        return new ApiErrorInternalServerError().into_resp(c);
                    }
                }
            }
        }
        updatedFields.push('menus');
    }

    // 有酸素メニュー更新
    if (body.menus_cardio !== undefined) {
        // 既存の有酸素メニューを削除
        const { error: deleteCardioError } = await spClSess
            .from('status_lines_menus_cardio')
            .delete()
            .eq('status_rel_id', statusRelId);

        if (deleteCardioError) {
            await FatalErrorHandler(c, deleteCardioError, "deleting existing cardio menus");
            return new ApiErrorInternalServerError().into_resp(c);
        }

        // 新しい有酸素メニューを挿入
        if (body.menus_cardio && Array.isArray(body.menus_cardio) && body.menus_cardio.length > 0) {
            for (const cardioEntry of body.menus_cardio) {
                if (!cardioEntry.menu?.pub_id) {
                    return new ApiErrorBadRequest("Cardio menu pub_id is required").into_resp(c);
                }

                const { data: cardioMenuData, error: cardioMenuError } = await spClSess
                    .from('menus_cardio_master')
                    .select('rel_id')
                    .eq('pub_id', cardioEntry.menu.pub_id)
                    .single();

                if (cardioMenuError || !cardioMenuData) {
                    return new ApiErrorNotFound('Cardio menu').into_resp(c);
                }

                const { data: statusCardioData, error: statusCardioError } = await spClSess
                    .from('status_lines_menus_cardio')
                    .insert({
                        status_rel_id: statusRelId,
                        menu_cardio_rel_id: cardioMenuData.rel_id
                    })
                    .select('rel_id')
                    .single();

                if (statusCardioError || !statusCardioData) {
                    await FatalErrorHandler(c, statusCardioError, "inserting status cardio menu");
                    return new ApiErrorInternalServerError().into_resp(c);
                }

                // 有酸素詳細挿入
                if (cardioEntry.duration || cardioEntry.distance) {
                    const { error: cardioDetailsError } = await spClSess
                        .from('status_lines_menus_cardio_details')
                        .insert({
                            status_menu_cardio_rel_id: statusCardioData.rel_id,
                            duration: cardioEntry.duration || null,
                            distance: cardioEntry.distance || null
                        });

                    if (cardioDetailsError) {
                        await FatalErrorHandler(c, cardioDetailsError, "inserting cardio details");
                        return new ApiErrorInternalServerError().into_resp(c);
                    }
                }
            }
        }
        updatedFields.push('menus_cardio');
    }

    const response = {
        pub_id: statusPubId,
        updated_fields: updatedFields
    };

    return c.json(response);
}
