import { Context } from 'hono';
import { UserIdInfo } from '../../_cmn/userid_resolve';
import { ApiErrorNotFound, ApiErrorFatal, ApiErrorBadRequest, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetPath } from '@/src/api/_cmn/get_path';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqBody {
    started_at?: string;
    finished_at?: string | null;
    gym_pub_id?: string | null;
    partners?: Array<{
        pub_id: string;
    }>;
    menus?: Array<{
        menu: {
            pub_id: string;
        };
        sets: Array<{
            weight?: number;
            reps?: number;
        }>;
    }>;
    menus_cardio?: Array<{
        menu: {
            pub_id: string;
        };
        duration?: string;
        distance?: number;
    }>;
}

interface respBody {
    pub_id: string;
}

export default async function patch(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const stateId = mustGetPath(c, 'stateid');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const body = await c.req.json() as reqBody;

    // latestの場合は最新のステータスpub_idを取得
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

    // ステータスの存在確認と権限チェック
    const { data: statusData, error: statusError } = await spClSess
        .from('status_master')
        .select('rel_id, user_rel_id')
        .eq('pub_id', targetStatusPubId)
        .single();

    if (statusError) {
        if (statusError.code === 'PGRST116') {
            throw new ApiErrorNotFound('Status');
        }
        throw new ApiErrorFatal(`DB access error: ${statusError.message}`);
    }

    // ユーザーのrel_idを取得して権限確認
    const { data: userData, error: userError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    if (statusData.user_rel_id !== userData.rel_id) {
        throw new ApiErrorForbidden('Cannot edit other user\'s status');
    }

    const statusRelId = statusData.rel_id;

    try {
        // ステータス基本情報の更新
        const updateData: {
            started_at?: string;
            finished_at?: string | null;
            gym_rel_id?: number | null;
        } = {};

        if (body.started_at !== undefined) {
            const startedAt = new Date(body.started_at);
            if (isNaN(startedAt.getTime())) {
                throw new ApiErrorBadRequest('Invalid started_at format');
            }
            if (startedAt > new Date()) {
                throw new ApiErrorBadRequest('started_at cannot be in the future');
            }
            updateData.started_at = startedAt.toISOString();
        }

        if (body.finished_at !== undefined) {
            if (body.finished_at === null) {
                updateData.finished_at = null;
            } else {
                const finishedAt = new Date(body.finished_at);
                if (isNaN(finishedAt.getTime())) {
                    throw new ApiErrorBadRequest('Invalid finished_at format');
                }
                updateData.finished_at = finishedAt.toISOString();
            }
        }

        if (body.gym_pub_id !== undefined) {
            if (body.gym_pub_id === null) {
                updateData.gym_rel_id = null;
            } else {
                const { data: gymData, error: gymError } = await spClSess
                    .from('gyms_master')
                    .select('rel_id')
                    .eq('pub_id', body.gym_pub_id)
                    .single();

                if (gymError || !gymData) {
                    throw new ApiErrorBadRequest(`Gym not found: ${body.gym_pub_id}`);
                }
                updateData.gym_rel_id = gymData.rel_id;
            }
        }

        // ステータス更新
        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await spClSess
                .from('status_master')
                .update(updateData)
                .eq('rel_id', statusRelId);

            if (updateError) {
                throw new ApiErrorFatal(`Failed to update status: ${updateError.message}`);
            }
        }

        // パートナーの更新
        if (body.partners !== undefined) {
            // 既存のパートナーを削除
            const { error: deletePartnersError } = await spClSess
                .from('status_lines_partners')
                .delete()
                .eq('status_rel_id', statusRelId);

            if (deletePartnersError) {
                throw new ApiErrorFatal(`Failed to delete existing partners: ${deletePartnersError.message}`);
            }

            // 新しいパートナーを追加
            if (body.partners.length > 0) {
                const partnerRelIds: number[] = [];
                for (const partner of body.partners) {
                    const { data: partnerData, error: partnerError } = await spClSrv
                        .from('users_master')
                        .select('rel_id')
                        .eq('pub_id', partner.pub_id)
                        .single();

                    if (partnerError || !partnerData) {
                        throw new ApiErrorBadRequest(`Partner not found: ${partner.pub_id}`);
                    }
                    partnerRelIds.push(partnerData.rel_id);
                }

                const partnerInserts = partnerRelIds.map(partnerRelId => ({
                    status_rel_id: statusRelId,
                    partner_user_rel_id: partnerRelId
                }));

                const { error: partnersError } = await spClSess
                    .from('status_lines_partners')
                    .insert(partnerInserts);

                if (partnersError) {
                    throw new ApiErrorFatal(`Failed to add partners: ${partnersError.message}`);
                }
            }
        }

        // メニューの更新
        if (body.menus !== undefined) {
            await updateMenus(spClSess, statusRelId, body.menus);
        }

        // 有酸素メニューの更新
        if (body.menus_cardio !== undefined) {
            await updateCardioMenus(spClSess, statusRelId, body.menus_cardio);
        }

        return c.json({
            pub_id: targetStatusPubId
        } as respBody);

    } catch (error) {
        if (error instanceof ApiErrorFatal || error instanceof ApiErrorBadRequest || error instanceof ApiErrorForbidden) {
            throw error;
        }
        throw new ApiErrorFatal(`Unexpected error: ${error}`);
    }
}

const updateMenus = async (
    spClSess: SupabaseClient,
    statusRelId: number,
    menus: Array<{
        menu: { pub_id: string };
        sets: Array<{ weight?: number; reps?: number }>;
    }>
) => {
    // 既存のメニューとセットを削除
    const { error: deleteMenusError } = await spClSess
        .from('status_lines_menus')
        .delete()
        .eq('status_rel_id', statusRelId);

    if (deleteMenusError) {
        throw new ApiErrorFatal(`Failed to delete existing menus: ${deleteMenusError.message}`);
    }

    // 新しいメニューを追加
    for (const menuItem of menus) {
        // メニューのrel_idを取得
        const { data: menuData, error: menuError } = await spClSess
            .from('menus_master')
            .select('rel_id')
            .eq('pub_id', menuItem.menu.pub_id)
            .single();

        if (menuError || !menuData) {
            throw new ApiErrorBadRequest(`Menu not found: ${menuItem.menu.pub_id}`);
        }

        // status_lines_menusに挿入
        const { data: statusMenuData, error: statusMenuError } = await spClSess
            .from('status_lines_menus')
            .insert({
                status_rel_id: statusRelId,
                menu_rel_id: menuData.rel_id
            })
            .select('rel_id')
            .single();

        if (statusMenuError || !statusMenuData) {
            throw new ApiErrorFatal(`Failed to insert menu: ${statusMenuError?.message}`);
        }

        // セットを追加
        if (menuItem.sets.length > 0) {
            const setInserts = menuItem.sets.map((set, index) => ({
                status_menu_rel_id: statusMenuData.rel_id,
                set_num: index + 1,
                weight: set.weight,
                reps: set.reps
            }));

            const { error: setsError } = await spClSess
                .from('status_lines_menus_sets')
                .insert(setInserts);

            if (setsError) {
                throw new ApiErrorFatal(`Failed to insert sets: ${setsError.message}`);
            }
        }
    }
};

const updateCardioMenus = async (
    spClSess: SupabaseClient,
    statusRelId: number,
    cardioMenus: Array<{
        menu: { pub_id: string };
        duration?: string;
        distance?: number;
    }>
) => {
    // 既存の有酸素メニューを削除
    const { error: deleteCardioMenusError } = await spClSess
        .from('status_lines_menus_cardio')
        .delete()
        .eq('status_rel_id', statusRelId);

    if (deleteCardioMenusError) {
        throw new ApiErrorFatal(`Failed to delete existing cardio menus: ${deleteCardioMenusError.message}`);
    }

    // 新しい有酸素メニューを追加
    for (const cardioMenuItem of cardioMenus) {
        // 有酸素メニューのrel_idを取得
        const { data: cardioMenuData, error: cardioMenuError } = await spClSess
            .from('menus_cardio_master')
            .select('rel_id')
            .eq('pub_id', cardioMenuItem.menu.pub_id)
            .single();

        if (cardioMenuError || !cardioMenuData) {
            throw new ApiErrorBadRequest(`Cardio menu not found: ${cardioMenuItem.menu.pub_id}`);
        }

        // status_lines_menus_cardioに挿入
        const { data: statusCardioMenuData, error: statusCardioMenuError } = await spClSess
            .from('status_lines_menus_cardio')
            .insert({
                status_rel_id: statusRelId,
                menu_cardio_rel_id: cardioMenuData.rel_id
            })
            .select('rel_id')
            .single();

        if (statusCardioMenuError || !statusCardioMenuData) {
            throw new ApiErrorFatal(`Failed to insert cardio menu: ${statusCardioMenuError?.message}`);
        }

        // 詳細情報を追加
        if (cardioMenuItem.duration !== undefined || cardioMenuItem.distance !== undefined) {
            const { error: cardioDetailsError } = await spClSess
                .from('status_lines_menus_cardio_details')
                .insert({
                    status_menu_cardio_rel_id: statusCardioMenuData.rel_id,
                    duration: cardioMenuItem.duration || null,
                    distance: cardioMenuItem.distance || null
                });

            if (cardioDetailsError) {
                throw new ApiErrorFatal(`Failed to insert cardio details: ${cardioDetailsError.message}`);
            }
        }
    }
};