/**
 * GET /users/:userId/profile
 *
 * Path Parameters:
 * - userId: string - ユーザーID（'me', '@handle', または UUID）
 *
 * Query Parameters:
 * - is_offline?: boolean - オフラインかどうか（デフォルト: false）
 *
 * Response:
 * {
 *   uuid: string;
 *   handle_id: string;
 *   display_name: string;
 *   description: string;
 *   birth_date: string;
 *   age: number;
 *   generation: string;
 *   gender: string;
 *   training_since: string;
 *   skill_level: string;
 *   tags: any[];
 *   training_intents: any[];
 *   training_intent_body_parts: any[];
 *   belonging_gyms: any[];
 *   follows_count: number;
 *   followers_count: number;
 *   registered_at: string;
 *   icon: string | null;
 *   icon_path: string[] | null;
 *   icon_url: string | null;
 *   last_state: {
 *     pub_id: string;
 *     started_at: string;
 *     finished_at: string;
 *     is_auto_detected: boolean;
 *     gym_pub_id: string;
 *     gym_name: string;
 *   } | null;
 * }
 */

import { Context } from 'hono';
import { ApiErrorNotFound, ApiErrorInternalServerError, FatalErrorHandler } from '@/src/api/_cmn/error';
import { UserSpecificId } from '../_mw/userid_resolve';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function get(c: Context) {
    const userSpecificId = c.get('userSpecificId') as UserSpecificId | undefined;
    if (!userSpecificId) {
        await FatalErrorHandler(c, "userSpecificId not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }
    const uuid = userSpecificId.uuid.v;

    const spClSess = c.get('supabaseClientSess') as SupabaseClient;
    if (!spClSess) {
        await FatalErrorHandler(c, "supabaseClientSess not found in context");
        return new ApiErrorInternalServerError().into_resp(c);
    }

    const isOfflineParam = c.req.query('is_offline');
    const isOffline = isOfflineParam === 'true';

    const { data: userCheck, error: userCheckError } = await spClSess
        .from('users_master')
        .select('rel_id')
        .eq('in_spbs_id', uuid)
        .single();

    if (userCheckError || !userCheck) {
        return new ApiErrorNotFound('User').into_resp(c);
    }

    const targetUserRelId = userCheck.rel_id;

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

    const viewName = isOffline ? 'view_user_profile_offline' : 'view_user_profile_online';

    const { data, error } = await spClSess
        .from(viewName)
        .select('*')
        .eq('rel_id', targetUserRelId)
        .single();

    if (error) {
        console.error('Profile fetch error:', error);
        return new ApiErrorInternalServerError().into_resp(c);
    }

    if (!data) {
        return new ApiErrorNotFound('Profile').into_resp(c);
    }

    let icon_url: string | null = null;
    if (data.icon_path) {
        const bucket = 'users_icons';
        const iconPath = data.icon_path.join('/');
        try {
            const { data: signedUrlData, error: signedUrlError } = await spClSess.storage
                .from(bucket)
                .createSignedUrl(iconPath, 60 * 60);
            if (signedUrlError) {
                console.error('icon signed url error:', signedUrlError);
                return new ApiErrorInternalServerError().into_resp(c);
            } else {
                icon_url = signedUrlData?.signedUrl || null;
            }
        } catch (e) {
            console.error('icon signed url exception:', e);
            return new ApiErrorInternalServerError().into_resp(c);
        }
    }

    let last_state = null;
    if (data.last_state_pub_id || data.last_state_started_at || data.last_state_finished_at || data.last_state_is_auto_detected !== null) {
        last_state = {
            pub_id: data.last_state_pub_id,
            started_at: data.last_state_started_at,
            finished_at: data.last_state_finished_at,
            is_auto_detected: data.last_state_is_auto_detected,
            gym_pub_id: data.last_state_gym_pub_id,
            gym_name: data.last_state_gym_name
        };
    }

    const response = {
        uuid,
        handle_id: data.handle_id,
        display_name: data.display_name,
        description: data.description,
        birth_date: data.birth_date,
        age: data.age,
        generation: data.generation,
        gender: data.gender,
        training_since: data.training_since,
        skill_level: data.skill_level,
        tags: data.tags,
        training_intents: data.training_intents,
        training_intent_body_parts: data.training_intent_body_parts,
        belonging_gyms: data.belonging_gyms,
        follows_count: data.follows_count,
        followers_count: data.followers_count,
        registered_at: data.registered_at,
        icon: data.icon,
        icon_path: data.icon_path,
        icon_url,
        last_state,
    };

    return c.json(response);
}
