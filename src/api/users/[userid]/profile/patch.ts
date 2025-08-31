import { Context } from 'hono';
import { ApiErrorFatal } from '../../../_cmn/error';
import { mustGetCtx } from '../../../_cmn/get_ctx';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserIdInfo } from './../_cmn/userid_resolve';
import { userIdPub2Rel } from '@/src/api/_cmn/userid_pub2rel';

interface reqBody {
    icon?: boolean;
    handle?: string;
    display_name?: string;
    description?: string;
    birth_date?: string;
    gender?: string;
    training_since?: string;
    tags?: string[];
    intents?: string[];
    intent_bodyparts?: string[];
    belonging_gyms?: string[];
}

interface respBody {
    success: boolean;
    icon_upload_url?: string;
}

export default async function patch(c: Context) {
    const spClSess = mustGetCtx<SupabaseClient>(c, 'supabaseClientSess');
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    const body: reqBody = await c.req.json();

    const relId = await userIdPub2Rel(spClSess, userIdInfo.pubId);

    let iconUploadUrl: string | undefined = undefined;

    if (body.icon === true) {
        try {
            const fileName = `${crypto.randomUUID()}.jpg`;
            const { data: uploadData, error: uploadError } = await spClSess.storage
                .from('users_icons')
                .createSignedUploadUrl(fileName);

            if (uploadError) {
                throw new ApiErrorFatal(`Failed to create upload URL: ${uploadError.message}`);
            }

            iconUploadUrl = uploadData?.signedUrl;
        } catch (e) {
            throw new ApiErrorFatal(`Failed to create icon upload URL: ${e}`);
        }
    }

    if (body.handle !== undefined || body.display_name !== undefined || body.description !== undefined ||
        body.birth_date !== undefined || body.gender !== undefined || body.training_since !== undefined) {

        const updateData: Record<string, string> = {};

        if (body.handle !== undefined) updateData.handle = body.handle;
        if (body.display_name !== undefined) updateData.display_name = body.display_name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.birth_date !== undefined) updateData.birth_date = body.birth_date;
        if (body.gender !== undefined) updateData.gender = body.gender;
        if (body.training_since !== undefined) updateData.training_since = body.training_since;

        // まずhandleの更新が必要かチェック
        if (updateData.handle) {
            const { error: handleUpdateError } = await spClSess
                .from('users_master')
                .update({ handle: updateData.handle })
                .eq('rel_id', relId);

            if (handleUpdateError) {
                throw new ApiErrorFatal(`Failed to update handle: ${handleUpdateError.message}`);
            }
            delete updateData.handle; // handleはusers_masterで処理済み
        }

        // users_line_profileの更新（存在しない場合は作成）
        if (Object.keys(updateData).length > 0) {
            // まず既存レコードの確認
            const { data: existingProfile } = await spClSess
                .from('users_line_profile')
                .select('rel_id')
                .eq('user_rel_id', relId)
                .single();

            if (existingProfile) {
                // 既存レコードを更新
                const { error: updateError } = await spClSess
                    .from('users_line_profile')
                    .update(updateData)
                    .eq('user_rel_id', relId);

                if (updateError) {
                    throw new ApiErrorFatal(`Failed to update user profile: ${updateError.message}`);
                }
            } else {
                const insertData = {
                    user_rel_id: relId,
                    ...updateData
                };

                const { error: insertError } = await spClSess
                    .from('users_line_profile')
                    .insert(insertData);

                if (insertError) {
                    throw new ApiErrorFatal(`Failed to create user profile: ${insertError.message}`);
                }
            }
        }
    }

    if (body.tags !== undefined) {
        const { error: deleteTagsError } = await spClSess
            .from('users_lines_tags')
            .delete()
            .eq('user_rel_id', relId);

        if (deleteTagsError) {
            throw new ApiErrorFatal(`Failed to delete existing tags: ${deleteTagsError.message}`);
        }

        if (body.tags.length > 0) {
            // pub_idをrel_idに変換
            const { data: tagRelIds, error: tagRelError } = await spClSess
                .from('tags_master')
                .select('rel_id')
                .in('pub_id', body.tags);

            if (tagRelError) {
                throw new ApiErrorFatal(`Failed to resolve tag rel_ids: ${tagRelError.message}`);
            }

            if (tagRelIds && tagRelIds.length > 0) {
                const tagInserts = tagRelIds.map(tag => ({
                    user_rel_id: relId,
                    tag_rel_id: tag.rel_id
                }));

                const { error: insertTagsError } = await spClSess
                    .from('users_lines_tags')
                    .insert(tagInserts);

                if (insertTagsError) {
                    throw new ApiErrorFatal(`Failed to insert new tags: ${insertTagsError.message}`);
                }
            }
        }
    }

    if (body.intents !== undefined) {
        const { error: deleteIntentsError } = await spClSess
            .from('users_lines_intents')
            .delete()
            .eq('user_rel_id', relId);

        if (deleteIntentsError) {
            throw new ApiErrorFatal(`Failed to delete existing intents: ${deleteIntentsError.message}`);
        }

        if (body.intents.length > 0) {
            // pub_idをrel_idに変換
            const { data: intentRelIds, error: intentRelError } = await spClSess
                .from('intents_master')
                .select('rel_id')
                .in('pub_id', body.intents);

            if (intentRelError) {
                throw new ApiErrorFatal(`Failed to resolve intent rel_ids: ${intentRelError.message}`);
            }

            if (intentRelIds && intentRelIds.length > 0) {
                const intentInserts = intentRelIds.map(intent => ({
                    user_rel_id: relId,
                    intent_rel_id: intent.rel_id
                }));

                const { error: insertIntentsError } = await spClSess
                    .from('users_lines_intents')
                    .insert(intentInserts);

                if (insertIntentsError) {
                    throw new ApiErrorFatal(`Failed to insert new intents: ${insertIntentsError.message}`);
                }
            }
        }
    }

    if (body.intent_bodyparts !== undefined) {
        const { error: deleteBodypartsError } = await spClSess
            .from('users_lines_intent_bodyparts')
            .delete()
            .eq('user_rel_id', relId);

        if (deleteBodypartsError) {
            throw new ApiErrorFatal(`Failed to delete existing intent bodyparts: ${deleteBodypartsError.message}`);
        }

        if (body.intent_bodyparts.length > 0) {
            // pub_idをrel_idに変換
            const { data: bodypartRelIds, error: bodypartRelError } = await spClSess
                .from('bodyparts_master')
                .select('rel_id')
                .in('pub_id', body.intent_bodyparts);

            if (bodypartRelError) {
                throw new ApiErrorFatal(`Failed to resolve bodypart rel_ids: ${bodypartRelError.message}`);
            }

            if (bodypartRelIds && bodypartRelIds.length > 0) {
                const bodypartInserts = bodypartRelIds.map(bodypart => ({
                    user_rel_id: relId,
                    bodypart_rel_id: bodypart.rel_id
                }));

                const { error: insertBodypartsError } = await spClSess
                    .from('users_lines_intent_bodyparts')
                    .insert(bodypartInserts);

                if (insertBodypartsError) {
                    throw new ApiErrorFatal(`Failed to insert new intent bodyparts: ${insertBodypartsError.message}`);
                }
            }
        }
    }

    if (body.belonging_gyms !== undefined) {
        const { error: deleteGymsError } = await spClSess
            .from('users_lines_belonging_gyms')
            .delete()
            .eq('user_rel_id', relId);

        if (deleteGymsError) {
            throw new ApiErrorFatal(`Failed to delete existing belonging gyms: ${deleteGymsError.message}`);
        }

        if (body.belonging_gyms.length > 0) {
            // pub_idをrel_idに変換
            const { data: gymRelIds, error: gymRelError } = await spClSess
                .from('gyms_master')
                .select('rel_id')
                .in('pub_id', body.belonging_gyms);

            if (gymRelError) {
                throw new ApiErrorFatal(`Failed to resolve gym rel_ids: ${gymRelError.message}`);
            }

            if (gymRelIds && gymRelIds.length > 0) {
                const gymInserts = gymRelIds.map(gym => ({
                    user_rel_id: relId,
                    gym_rel_id: gym.rel_id
                }));

                const { error: insertGymsError } = await spClSess
                    .from('users_lines_belonging_gyms')
                    .insert(gymInserts);

                if (insertGymsError) {
                    throw new ApiErrorFatal(`Failed to insert new belonging gyms: ${insertGymsError.message}`);
                }
            }
        }
    }

    const response: respBody = {
        success: true,
        ...(iconUploadUrl && { icon_upload_url: iconUploadUrl })
    };

    return c.json(response);
}
