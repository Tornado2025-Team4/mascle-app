import { Hono } from 'hono';
import { createSupabaseSessMW } from '../../../_cmn/create_supasess';
import { SupabaseClient } from '@supabase/supabase-js';
import { mustGetCtx } from '../../../_cmn/get_ctx';
import { UserJwtInfo } from '../../../_cmn/verify_jwt';

const app = new Hono();

app.use('*', createSupabaseSessMW);

app.get('/', async (c) => {
    try {
        const supabase = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
        const userJwtInfo = mustGetCtx<UserJwtInfo>(c, 'userJwtInfo');

        // URL パラメータから userid を取得
        const requestedUserId = c.req.param('userid');

        // 自分の情報か、または 'me' の場合は自分のJWT情報を使用
        const targetUserId = (requestedUserId === 'me') ? userJwtInfo.obj.id : requestedUserId;

        // ユーザーの現在のトレーニング状況から現在のジム情報を取得
        // finished_at IS NULL AND gym_rel_id IS NOT NULL の条件で判定
        const { data, error } = await supabase
            .from('views_user_current_gym')
            .select('gym_pub_id, gym_name, status_pub_id, started_at')
            .eq('user_pub_id', targetUserId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // 現在トレーニング中でない、またはジムが設定されていない場合
                return c.json({
                    gym: null,
                    is_training: false
                });
            }
            console.error('Error fetching current gym from training status:', error);
            return c.json({ error: 'Failed to fetch current gym' }, 500);
        }

        return c.json({
            gym: {
                pub_id: data.gym_pub_id,
                name: data.gym_name
            },
            is_training: true,
            status: {
                pub_id: data.status_pub_id,
                started_at: data.started_at
            }
        });

    } catch (error) {
        console.error('Error in GET /api/users/[userid]/current-gym:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export default app;
