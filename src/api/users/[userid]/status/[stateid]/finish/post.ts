import { Context } from 'hono';
import { UserIdInfo } from '../../../_cmn/userid_resolve';
import { ApiErrorNotFound, ApiErrorFatal, ApiErrorBadRequest, ApiErrorForbidden } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetPath } from '@/src/api/_cmn/get_path';
import { SupabaseClient } from '@supabase/supabase-js';

interface reqBody {
    finished_at: string;
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

export default async function post(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');
    const stateId = mustGetPath(c, 'stateid');
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    // 自分自身のステータスのみ終了可能
    if (userIdInfo.specByAnon) {
        throw new ApiErrorForbidden('Cannot finish status for anonymous user');
    }

    const body = await c.req.json() as reqBody;

    // バリデーション
    if (!body.finished_at) {
        throw new ApiErrorBadRequest('finished_at is required');
    }

    const finishedAt = new Date(body.finished_at);
    if (isNaN(finishedAt.getTime())) {
        throw new ApiErrorBadRequest('Invalid finished_at format');
    }

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
    const { data: statusData, error: statusError } = await spClSrv
        .from('status_master')
        .select('rel_id, user_rel_id, started_at, finished_at')
        .eq('pub_id', targetStatusPubId)
        .single();

    if (statusError) {
        if (statusError.code === 'PGRST116') {
            throw new ApiErrorNotFound('Status');
        }
        throw new ApiErrorFatal(`DB access error: ${statusError.message}`);
    }

    // ユーザーのrel_idを取得して権限確認
    const { data: userData, error: userError } = await spClSrv
        .from('users_master')
        .select('rel_id')
        .eq('pub_id', userIdInfo.pubId)
        .single();

    if (userError || !userData) {
        throw new ApiErrorFatal(`User not found: ${userError?.message}`);
    }

    if (statusData.user_rel_id !== userData.rel_id) {
        throw new ApiErrorForbidden('Cannot finish other user\'s status');
    }

    // 既に終了している場合はエラー
    if (statusData.finished_at) {
        throw new ApiErrorBadRequest('Status is already finished');
    }

    // 開始時刻より前の終了時刻は許可しない
    const startedAt = new Date(statusData.started_at);
    if (finishedAt <= startedAt) {
        throw new ApiErrorBadRequest('finished_at must be after started_at');
    }

    const statusRelId = statusData.rel_id;

    try {
        // finished_atを更新
        const { error: updateError } = await spClSess
            .from('status_master')
            .update({ finished_at: finishedAt.toISOString() })
            .eq('rel_id', statusRelId);

        if (updateError) {
            throw new ApiErrorFatal(`Failed to finish status: ${updateError.message}`);
        }

        // メニューの更新
        if (body.menus !== undefined) {
            await updateMenus(spClSess, spClSrv, statusRelId, body.menus);
        }

        // 有酸素メニューの更新
        if (body.menus_cardio !== undefined) {
            await updateCardioMenus(spClSess, spClSrv, statusRelId, body.menus_cardio);
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
    spClSA: SupabaseClient,
    spClSrv: SupabaseClient,
    statusRelId: number,
    menus: Array<{
        menu: { pub_id: string };
        sets: Array<{ weight?: number; reps?: number }>;
    }>
) => {
    // 既存のメニューとセットを削除
    const { error: deleteMenusError } = await spClSA
        .from('status_lines_menus')
        .delete()
        .eq('status_rel_id', statusRelId);

    if (deleteMenusError) {
        throw new ApiErrorFatal(`Failed to delete existing menus: ${deleteMenusError.message}`);
    }

    // 新しいメニューを追加
    for (const menuItem of menus) {
        // メニューのrel_idを取得
        const { data: menuData, error: menuError } = await spClSrv
            .from('menus_master')
            .select('rel_id')
            .eq('pub_id', menuItem.menu.pub_id)
            .single();

        if (menuError || !menuData) {
            throw new ApiErrorBadRequest(`Menu not found: ${menuItem.menu.pub_id}`);
        }

        // status_lines_menusに挿入
        const { data: statusMenuData, error: statusMenuError } = await spClSA
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

            const { error: setsError } = await spClSA
                .from('status_lines_menus_sets')
                .insert(setInserts);

            if (setsError) {
                throw new ApiErrorFatal(`Failed to insert sets: ${setsError.message}`);
            }
        }
    }
};

const updateCardioMenus = async (
    spClSA: SupabaseClient,
    spClSrv: SupabaseClient,
    statusRelId: number,
    cardioMenus: Array<{
        menu: { pub_id: string };
        duration?: string;
        distance?: number;
    }>
) => {
    // 既存の有酸素メニューを削除
    const { error: deleteCardioMenusError } = await spClSA
        .from('status_lines_menus_cardio')
        .delete()
        .eq('status_rel_id', statusRelId);

    if (deleteCardioMenusError) {
        throw new ApiErrorFatal(`Failed to delete existing cardio menus: ${deleteCardioMenusError.message}`);
    }

    // 新しい有酸素メニューを追加
    for (const cardioMenuItem of cardioMenus) {
        // 有酸素メニューのrel_idを取得
        const { data: cardioMenuData, error: cardioMenuError } = await spClSrv
            .from('menus_cardio_master')
            .select('rel_id')
            .eq('pub_id', cardioMenuItem.menu.pub_id)
            .single();

        if (cardioMenuError || !cardioMenuData) {
            throw new ApiErrorBadRequest(`Cardio menu not found: ${cardioMenuItem.menu.pub_id}`);
        }

        // status_lines_menus_cardioに挿入
        const { data: statusCardioMenuData, error: statusCardioMenuError } = await spClSA
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
            const { error: cardioDetailsError } = await spClSA
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