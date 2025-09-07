/**
 * POST /users/:userId/status/:stateId/finish
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me'のみ）
 * - stateId: string - ステータスID（pub_idまたは'latest'）
 *
 * Request Body:
 * {
 *   finished_at: string;
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
 *   finished_at: string;
 *   menus_added: boolean;
 *   menus_cardio_added: boolean;
 * }
 */

import { Context } from 'hono';
import { ApiErrorBadRequest, ApiErrorUnauthorized, ApiErrorInternalServerError, ApiErrorNotFound, FatalErrorHandler } from '@/src/api_old/_cmn/error';
import { UserSpecificId } from '../../../_mw/userid_resolve';
import { verifyUserAuthnFn } from '@/src/api_old/_mw/verify_user_authn';

export default async function post(c: Context) {
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

    if (!body.finished_at || typeof body.finished_at !== 'string') {
        return new ApiErrorBadRequest("finished_at is required and must be a string").into_resp(c);
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
        .select('rel_id, pub_id, user_rel_id, finished_at')
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

    if (statusData.finished_at) {
        return new ApiErrorBadRequest("Training session is already finished").into_resp(c);
    }

    const statusRelId = statusData.rel_id;
    const statusPubId = statusData.pub_id;

    // finished_at を更新
    const { error: updateError } = await spClSess
        .from('status_master')
        .update({ finished_at: body.finished_at })
        .eq('rel_id', statusRelId);

    if (updateError) {
        await FatalErrorHandler(c, updateError, "updating finished_at");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    let menusAdded = false;
    let menusCardioAdded = false;

    // メニュー追加
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

            // 既存のメニューをチェック
            const { data: existingMenu } = await spClSess
                .from('status_lines_menus')
                .select('rel_id')
                .eq('status_rel_id', statusRelId)
                .eq('menu_rel_id', menuData.rel_id)
                .single();

            let statusMenuRelId;
            if (existingMenu) {
                // 既存のセットを削除
                await spClSess
                    .from('status_lines_menus_sets')
                    .delete()
                    .eq('status_menu_rel_id', existingMenu.rel_id);
                statusMenuRelId = existingMenu.rel_id;
            } else {
                // 新しいメニューを挿入
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
                statusMenuRelId = statusMenuData.rel_id;
            }

            // セット挿入
            if (menuEntry.sets && Array.isArray(menuEntry.sets) && menuEntry.sets.length > 0) {
                const setInserts = menuEntry.sets.map((set: { weight?: number; reps?: number }, index: number) => ({
                    status_menu_rel_id: statusMenuRelId,
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
        menusAdded = true;
    }

    // 有酸素メニュー追加
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

            // 既存の有酸素メニューをチェック
            const { data: existingCardio } = await spClSess
                .from('status_lines_menus_cardio')
                .select('rel_id')
                .eq('status_rel_id', statusRelId)
                .eq('menu_cardio_rel_id', cardioMenuData.rel_id)
                .single();

            let statusCardioRelId;
            if (existingCardio) {
                // 既存の詳細を削除
                await spClSess
                    .from('status_lines_menus_cardio_details')
                    .delete()
                    .eq('status_menu_cardio_rel_id', existingCardio.rel_id);
                statusCardioRelId = existingCardio.rel_id;
            } else {
                // 新しい有酸素メニューを挿入
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
                statusCardioRelId = statusCardioData.rel_id;
            }

            // 有酸素詳細挿入
            if (cardioEntry.duration || cardioEntry.distance) {
                const { error: cardioDetailsError } = await spClSess
                    .from('status_lines_menus_cardio_details')
                    .insert({
                        status_menu_cardio_rel_id: statusCardioRelId,
                        duration: cardioEntry.duration || null,
                        distance: cardioEntry.distance || null
                    });

                if (cardioDetailsError) {
                    await FatalErrorHandler(c, cardioDetailsError, "inserting cardio details");
                    return new ApiErrorInternalServerError().into_resp(c);
                }
            }
        }
        menusCardioAdded = true;
    }

    const response = {
        pub_id: statusPubId,
        finished_at: body.finished_at,
        menus_added: menusAdded,
        menus_cardio_added: menusCardioAdded
    };

    return c.json(response);
}
