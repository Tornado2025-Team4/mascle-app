import { Context } from 'hono';
import { mustGetSpClSessOrAnon } from '../_cmn/get_supaclient';
import { mustGetCtx } from '../_cmn/get_ctx';
import { ApiErrorFatal } from '../_cmn/error';
import { SupabaseClient } from '@supabase/supabase-js';

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
    icon_rel_id?: string;
    icon_name?: string;
    generation?: number;
    gender?: string;
    training_since?: string;
    tags: Tag[];
    intents: Intent[];
    intent_bodyparts: IntentBodypart[];
    belonging_gyms: BelongingGym[];
    privacy_allowed_display_name: boolean;
    is_following?: boolean;
    is_followed_by?: boolean;
}

type reqQuery = {
    handle_id?: string;
    display_name?: string;
    description?: string;
    tags?: string;
    generation?: number;
    gender?: string;
    training_since?: string;
    training_since_condition?: string;
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
    const training_since_condition = c.req.query('training_since_condition');
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
        training_since_condition,
        intents,
        intent_bodyparts,
        belonging_gyms,
        limit
    } as reqQuery;
};

export default async function get(c: Context) {
    const { spCl } = mustGetSpClSessOrAnon(c);
    const spClSrv = mustGetCtx<SupabaseClient>(c, 'supabaseClientService');

    const rq = parseReqQuery(c);

    // まず、関連テーブルでのフィルタリングが必要かチェック
    let userRelIds: number[] | null = null;

    // intents検索：関連テーブルで検索（サービスクライアント使用）
    if (rq.intents && rq.intents !== 'all') {
        const { data: intentUsers } = await spClSrv
            .from('users_lines_intents')
            .select('user_rel_id, intents_master!inner(intent)')
            .eq('intents_master.intent', rq.intents);

        if (intentUsers && intentUsers.length > 0) {
            userRelIds = intentUsers.map(u => u.user_rel_id);
        } else {
            // 該当するユーザーがいない場合は空の結果を返す
            return c.json([]);
        }
    }

    // intent_bodyparts検索：関連テーブルで検索（サービスクライアント使用）
    if (rq.intent_bodyparts && rq.intent_bodyparts !== 'all') {
        const { data: bodypartUsers } = await spClSrv
            .from('users_lines_intent_bodyparts')
            .select('user_rel_id, bodyparts_master!inner(bodypart)')
            .eq('bodyparts_master.bodypart', rq.intent_bodyparts);

        if (bodypartUsers && bodypartUsers.length > 0) {
            const bodypartUserRelIds = bodypartUsers.map(u => u.user_rel_id);
            userRelIds = userRelIds ? userRelIds.filter(id => bodypartUserRelIds.includes(id)) : bodypartUserRelIds;
        } else {
            return c.json([]);
        }
    }

    // tags検索：関連テーブルで検索（サービスクライアント使用）
    if (rq.tags) {
        // タグ名から#プレフィックスを除去
        const tagName = rq.tags.startsWith('#') ? rq.tags.slice(1) : rq.tags;
        const { data: tagUsers, error: tagError } = await spClSrv
            .from('users_lines_tags')
            .select('user_rel_id, tags_master!inner(name)')
            .eq('tags_master.name', tagName);

        if (tagError) {
            throw new ApiErrorFatal(`Tag search error: ${tagError.message}`);
        }

        if (tagUsers && tagUsers.length > 0) {
            const tagUserRelIds = tagUsers.map(u => u.user_rel_id);
            userRelIds = userRelIds ? userRelIds.filter(id => tagUserRelIds.includes(id)) : tagUserRelIds;
        } else {
            return c.json([]);
        }
    }


    // belonging_gyms検索：関連テーブルで検索（サービスクライアント使用）
    if (rq.belonging_gyms) {
        const { data: gymUsers } = await spClSrv
            .from('users_lines_belonging_gyms')
            .select('user_rel_id, gyms_master!inner(name)')
            .eq('gyms_master.name', rq.belonging_gyms);

        if (gymUsers && gymUsers.length > 0) {
            const gymUserRelIds = gymUsers.map(u => u.user_rel_id);
            userRelIds = userRelIds ? userRelIds.filter(id => gymUserRelIds.includes(id)) : gymUserRelIds;
        } else {
            return c.json([]);
        }
    }

    // views_user_profileからの検索
    let query = spCl
        .from('views_user_profile')
        .select('*');

    // 関連テーブルでフィルタリングした結果があれば適用
    if (userRelIds !== null) {
        if (userRelIds.length === 0) {
            return c.json([]);
        }
        // ビューではuser_rel_idではなくpub_idを使うため、users_masterテーブルで変換が必要（サービスクライアント使用）
        const { data: userMasters, error: masterError } = await spClSrv
            .from('users_master')
            .select('pub_id')
            .in('rel_id', userRelIds);

        if (masterError) {
            throw new ApiErrorFatal(`User master conversion error: ${masterError.message}`);
        }

        if (userMasters && userMasters.length > 0) {
            const pubIds = userMasters.map(u => u.pub_id);
            query = query.in('pub_id', pubIds);
        } else {
            return c.json([]);
        }
    }

    // handle_id: 完全マッチ
    if (rq.handle_id) {
        query = query.eq('handle', rq.handle_id);
    }

    // display_name: 部分マッチ
    if (rq.display_name) {
        query = query.ilike('display_name', `%${rq.display_name}%`);
    }

    // description: 部分マッチ
    if (rq.description) {
        query = query.ilike('description', `%${rq.description}%`);
    }

    // generation: 完全マッチ（"all"でない場合のみ適用）
    if (rq.generation !== undefined && rq.generation.toString() !== 'all') {
        query = query.eq('generation', rq.generation);
    }

    // gender: 完全マッチ（"all"でない場合のみ適用）
    if (rq.gender && rq.gender !== 'all') {
        query = query.eq('gender', rq.gender);
    }

    // training_since: 日付比較への変換
    if (rq.training_since) {
        // "3年2ヶ月" などの文字列から日付を計算
        const yearsMatch = rq.training_since.match(/(\d+)年/);
        const monthsMatch = rq.training_since.match(/(\d+)ヶ月/);

        let years = 0;
        let months = 0;

        if (yearsMatch) years = parseInt(yearsMatch[1]);
        if (monthsMatch) months = parseInt(monthsMatch[1]);

        if (years > 0 || months > 0) {
            // 現在日付から指定された年月数を引いた日付を計算
            const baseDate = new Date();
            baseDate.setFullYear(baseDate.getFullYear() - years);
            baseDate.setMonth(baseDate.getMonth() - months);
            const targetDate = baseDate.toISOString().split('T')[0]; // YYYY-MM-DD形式

            const condition = rq.training_since_condition || 'gte';
            if (condition === 'gte') {
                // 指定年月以上の経験 = その日付以前に開始
                query = query.lte('training_since', targetDate);
            } else if (condition === 'lte') {
                // 指定年月以下の経験 = その日付以降に開始
                query = query.gte('training_since', targetDate);
            }
        }
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
            return row.privacy_allowed_display_name !== false;
        })
        .map(async (row: UserRow) => {
            let profile_icon_url = undefined;

            // アイコンの署名付きURL生成
            if (row.icon_rel_id && row.icon_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('users_icons')
                        .createSignedUrl(row.icon_name, 60 * 60);

                    if (signedUrlError || !signedUrlData?.signedUrl) {
                        console.error('Failed to create signed URL for user icon:', signedUrlError?.message || 'unknown error');
                    } else {
                        profile_icon_url = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for user icon:', e);
                }
            }

            return {
                pub_id: row.pub_id,
                handle: row.handle,
                display_name: row.display_name,
                description: row.description,
                profile_icon_url,
                generation: row.generation,
                gender: row.gender,
                training_since: row.training_since,
                tags: row.tags || [],
                intents: row.intents || [],
                intent_bodyparts: row.intent_bodyparts || [],
                belonging_gyms: row.belonging_gyms || [],
                is_following: row.is_following || false,
                is_followed_by: row.is_followed_by || false
            };
        });

    // Promise.allで全ての非同期処理を解決
    const resolvedResult = await Promise.all(result);

    return c.json(resolvedResult);
}