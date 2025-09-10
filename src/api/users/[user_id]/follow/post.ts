import { Context } from 'hono';
import { mustGetSpClSessOrAnon } from '../../../_cmn/get_supaclient';

export async function POST(c: Context) {
    const { spCl } = mustGetSpClSessOrAnon(c);
    const user_id = c.req.param('user_id');

    if (!user_id) {
        return c.json({ error: 'User ID is required' }, 400);
    }

    try {
        // 現在のユーザー情報を取得
        const { data: currentUserData } = await spCl.auth.getUser();
        if (!currentUserData.user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        // 現在のユーザーのrel_idを取得
        const { data: currentUserProfile } = await spCl
            .from('users_master')
            .select('rel_id')
            .eq('auth_user_id', currentUserData.user.id)
            .single();

        if (!currentUserProfile) {
            return c.json({ error: 'Current user not found' }, 404);
        }

        // 対象ユーザーのrel_idを取得
        const { data: targetUserProfile } = await spCl
            .from('users_master')
            .select('rel_id')
            .eq('pub_id', user_id)
            .single();

        if (!targetUserProfile) {
            return c.json({ error: 'Target user not found' }, 404);
        }

        // 自分自身をフォローしようとしている場合はエラー
        if (currentUserProfile.rel_id === targetUserProfile.rel_id) {
            return c.json({ error: 'Cannot follow yourself' }, 400);
        }

        // 既にフォローしているかチェック
        const { data: existingFollow } = await spCl
            .from('users_lines_followings')
            .select('rel_id')
            .eq('user_rel_id', currentUserProfile.rel_id)
            .eq('target_user_rel_id', targetUserProfile.rel_id)
            .single();

        if (existingFollow) {
            return c.json({ error: 'Already following' }, 409);
        }

        // フォロー関係を作成
        const { error: followError } = await spCl
            .from('users_lines_followings')
            .insert({
                user_rel_id: currentUserProfile.rel_id,
                target_user_rel_id: targetUserProfile.rel_id
            });

        if (followError) {
            console.error('Follow error:', followError);
            return c.json({ error: 'Failed to follow user' }, 500);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error('Follow operation error:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
}
