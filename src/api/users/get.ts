import { Context } from 'hono';
import { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrorFatal, ApiErrorBadRequest } from '../_cmn/error';
import { mustGetCtx } from '../_cmn/get_ctx';

interface Tag {
    name: string;
}

interface Intent {
    intent: string;
}

interface IntentBodypart {
    bodypart: string;
}

interface BelongingGym {
    name: string;
}

interface UserRow {
    pub_id?: string;
    anon_pub_id?: string;
    handle?: string;
    display_name: string;
    description?: string;
    profile_icon_url?: string;
    generation?: number;
    gender?: string;
    training_since?: string;
    tags: Tag[];
    intents: Intent[];
    intent_bodyparts: IntentBodypart[];
    belonging_gyms: BelongingGym[];
    privacy_allowed_display_name: boolean;
}

interface reqQuery {
    handle_id?: string;
    display_name?: string;
    description?: string;
    tags?: string;
    generation?: number;
    gender?: string;
    training_since?: string;
    intents?: string;
    intent_bodyparts?: string;
    belonging_gyms?: string;
    limit: number;
}

const parseReqQuery = (c: Context): reqQuery => {
    const handle_id = c.req.query('handle_id');
    const display_name = c.req.query('display_name');
    const description = c.req.query('description');
    const tags = c.req.query('tags');
    const generationRaw = c.req.query('generation');
    const gender = c.req.query('gender');
    const training_since = c.req.query('training_since');
    const intents = c.req.query('intents');
    const intent_bodyparts = c.req.query('intent_bodyparts');
    const belonging_gyms = c.req.query('belonging_gyms');
    const limitRaw = c.req.query('limit');

    const limit = limitRaw ? Math.min(Number(limitRaw), 50) : 20;
    const generation = generationRaw ? Number(generationRaw) : undefined;

    return {
        handle_id,
        display_name,
        description,
        tags,
        generation,
        gender,
        training_since,
        intents,
        intent_bodyparts,
        belonging_gyms,
        limit
    } as reqQuery;
};

export default async function get(c: Context) {
    const spClSess = c.get('supabaseClientSess') as SupabaseClient | null;
    const spClAnon = mustGetCtx<SupabaseClient>(c, 'supabaseClientAnon');

    const rq = parseReqQuery(c);

    // 検索条件が何も指定されていない場合はエラー
    if (!rq.handle_id && !rq.display_name && !rq.description && !rq.tags &&
        !rq.generation && !rq.gender && !rq.training_since && !rq.intents &&
        !rq.intent_bodyparts && !rq.belonging_gyms) {
        throw new ApiErrorBadRequest('At least one search parameter is required');
    }

    // 認証状態に応じてビューを選択
    const viewName = spClSess ? 'views_user_profile' : 'views_user_profile_anon';
    const client = spClSess || spClAnon;

    let query = client
        .from(viewName)
        .select('*');

    // handle_id: 完全マッチ
    if (rq.handle_id) {
        if (spClSess) {
            query = query.eq('handle', rq.handle_id);
        } else {
            // 匿名ユーザーはhandleで検索できないため、anon_pub_idで検索
            // ただし、handle_idが渡された場合は実際にはpub_idまたはanon_pub_idとして扱う
            query = query.eq('anon_pub_id', rq.handle_id);
        }
    }

    // display_name: 部分マッチ（プライバシー権限がある場合のみ）
    if (rq.display_name) {
        query = query.ilike('display_name', `%${rq.display_name}%`);
    }

    // description: 部分マッチ（プライバシー権限がある場合のみ）
    if (rq.description) {
        query = query.ilike('description', `%${rq.description}%`);
    }

    // generation: 完全マッチ
    if (rq.generation !== undefined) {
        query = query.eq('generation', rq.generation);
    }

    // gender: 完全マッチ
    if (rq.gender) {
        query = query.eq('gender', rq.gender);
    }

    // training_since: 完全マッチ
    if (rq.training_since) {
        query = query.eq('training_since', rq.training_since);
    }

    // tags, intents, intent_bodyparts, belonging_gymsはJSONB配列での検索が必要
    // これらは複雑な検索になるため、基本的な実装のみ
    if (rq.tags) {
        query = query.contains('tags', `[{"name": "${rq.tags}"}]`);
    }

    if (rq.intents) {
        query = query.contains('intents', `[{"intent": "${rq.intents}"}]`);
    }

    if (rq.intent_bodyparts) {
        query = query.contains('intent_bodyparts', `[{"bodypart": "${rq.intent_bodyparts}"}]`);
    }

    if (rq.belonging_gyms) {
        query = query.contains('belonging_gyms', `[{"name": "${rq.belonging_gyms}"}]`);
    }

    // 結果を制限
    query = query.limit(rq.limit);

    const { data, error } = await query;
    if (error) {
        throw new ApiErrorFatal(`failed to search users: ${error.message}`);
    }

    // レスポンス形式に変換
    const result = (data ?? [])
        .filter((row: UserRow) => {
            // 認証済みユーザーの場合は全て、匿名の場合はプライバシー設定に従う
            if (spClSess) return true;
            // 匿名ビューの場合、completely_hiddenでないもののみ
            return row.privacy_allowed_display_name !== false;
        })
        .map((row: UserRow) => ({
            pub_id: spClSess ? row.pub_id : undefined,
            anon_pub_id: spClSess ? undefined : row.anon_pub_id,
            handle: spClSess ? row.handle : undefined,
            display_name: row.display_name || row.handle || 'ユーザー',
            description: row.description,
            profile_icon_url: row.profile_icon_url,
            generation: row.generation,
            gender: row.gender,
            training_since: row.training_since,
            tags: row.tags || [],
            intents: row.intents || [],
            intent_bodyparts: row.intent_bodyparts || [],
            belonging_gyms: row.belonging_gyms || []
        }));

    return c.json(result);
}