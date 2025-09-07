import { Context, MiddlewareHandler } from 'hono';
import { FatalErrorHandler } from '@/src/api/_cmn/error';
import { UserAuthnInfo, verifyUserAuthnFn } from './verify_user_authn';

/**
 * ユーザーのプライバシー設定に基づいてアクセス権限をチェックする関数
 * @param c Honoコンテキスト
 * @param targetUserRelId 対象ユーザーのrel_id
 * @param privacyPart チェックするプライバシー項目
 * @returns アクセス可能ならtrue、不可能ならfalse
 */
export async function checkPrivacyAccess(
    c: Context,
    targetUserRelId: number,
    privacyPart: string
): Promise<boolean> {
    const spClSess = c.get('supabaseClientSess') || c.get('supabaseClientAnon');
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClient not found in context");
        return false;
    }

    const userAuthnInfo = c.get('userAuthnInfo') as UserAuthnInfo | null;
    let currentUserRelId: number | null = null;

    if (userAuthnInfo) {
        const { data: userData, error: userError } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', userAuthnInfo.userObj.id)
            .single();
        if (userData && !userError) {
            currentUserRelId = userData.rel_id;
        }
    }

    // 自分の投稿なら常にアクセス可能
    if (currentUserRelId === targetUserRelId) {
        return true;
    }

    // オンライン時のプライバシー設定を取得
    const { data: privacyData, error: privacyError } = await spClSess
        .from('users_line_conf_privacy_onlines')
        .select('visibility')
        .eq('user_rel_id', targetUserRelId)
        .eq('target_part', privacyPart)
        .single();

    if (privacyError) {
        // プライバシー設定が存在しない場合はprivateとして扱う
        return false;
    }

    const visibility = privacyData?.visibility || 'private';

    // check_visibility関数を使用してアクセス権限をチェック
    const { data: accessResult, error: accessError } = await spClSess
        .rpc('check_visibility', {
            current_user_rel_id: currentUserRelId,
            target_user_rel_id: targetUserRelId,
            visibility_setting: visibility
        });

    if (accessError) {
        await FatalErrorHandler(c, accessError, "checking visibility");
        return false;
    }

    return accessResult || false;
}

/**
 * posts アクセス権限をチェックするミドルウェア
 */
export const checkPostsAccessMW: MiddlewareHandler = async (c, next) => {
    // 認証が必要
    const result = await verifyUserAuthnFn(c);
    if (result instanceof Response) {
        return result;
    }

    await next();
};

/**
 * 投稿の可視性とプライバシー設定に基づいてアクセス権限をチェックする関数
 */
export async function checkPostAccess(
    c: Context,
    posterUserRelId: number,
    postVisibility: string
): Promise<{ canAccess: boolean; canSeeLocation: boolean }> {
    // まず、posts項目にアクセス権限があるかチェック
    const canAccessPosts = await checkPrivacyAccess(c, posterUserRelId, 'posts');
    if (!canAccessPosts) {
        return { canAccess: false, canSeeLocation: false };
    }

    const spClSess = c.get('supabaseClientSess') || c.get('supabaseClientAnon');
    if (!spClSess) {
        return { canAccess: false, canSeeLocation: false };
    }

    // 認証情報を取得
    const userAuthnInfo = c.get('userAuthnInfo') as UserAuthnInfo | null;
    let currentUserRelId: number | null = null;

    if (userAuthnInfo) {
        const { data: userData, error: userError } = await spClSess
            .from('users_master')
            .select('rel_id')
            .eq('in_spbs_id', userAuthnInfo.userObj.id)
            .single();
        if (userData && !userError) {
            currentUserRelId = userData.rel_id;
        }
    }

    // 投稿のvisibility設定に基づいてアクセス権限をチェック
    const { data: accessResult, error: accessError } = await spClSess
        .rpc('check_visibility', {
            current_user_rel_id: currentUserRelId,
            target_user_rel_id: posterUserRelId,
            visibility_setting: postVisibility
        });

    if (accessError) {
        await FatalErrorHandler(c, accessError, "checking post visibility");
        return { canAccess: false, canSeeLocation: false };
    }

    const canAccess = accessResult || false;

    // posts/location項目にアクセス権限があるかチェック
    const canSeeLocation = canAccess ? await checkPrivacyAccess(c, posterUserRelId, 'posts/location') : false;

    return { canAccess, canSeeLocation };
}
