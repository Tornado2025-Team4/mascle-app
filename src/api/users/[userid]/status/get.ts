import { Context } from 'hono';
import { UserIdInfo } from '../_cmn/userid_resolve';
import { ApiErrorNotFound, ApiErrorFatal } from '@/src/api/_cmn/error';
import { mustGetCtx } from '@/src/api/_cmn/get_ctx';
import { mustGetSpClSessOrAnon } from '@/src/api/_cmn/get_supaclient';
import { convDateForFE, precision } from '@/src/api/_cmn/conv_date_for_fe';

// >! 保留

interface respBody {
    pub_id?: string
    user_pub_id?: string
    started_at?: string
    finished_at?: string | null
    is_auto_detected?: boolean
    gym?: {
        pub_id: string
        name: string
        photo_url?: string
        gymchain?: {
            pub_id: string
            name: string
            icon_url?: string
            internal_id?: string
        }
    } | null
}

export default async function get(c: Context) {
    const userIdInfo = mustGetCtx<UserIdInfo>(c, 'userIdInfo');

    let response: respBody | null;

    if (userIdInfo.anonPubId) {
        response = await getdata_anon(c, userIdInfo.anonPubId);
    } else {
        response = await getdata(c, userIdInfo.pubId);
    }

    return c.json(response);
}

const getdata = async (c: Context, userPubId: string): Promise<respBody | null> => {
    const { spCl: spClSA } = mustGetSpClSessOrAnon(c);

    const { data: status, error: statusErr } = await spClSA
        .from('views_user_status')
        .select('*')
        .eq('user_pub_id', userPubId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (statusErr) {
        throw new ApiErrorFatal(`DB access error: ${statusErr.message}`);
    }

    if (!status || !status.privacy_allowed_status) {
        return null;
    }

    return await formatStatusResponse(c, status);
};

const getdata_anon = async (c: Context, userAnonPubId: string): Promise<respBody | null> => {
    const { spCl: spClSA } = mustGetSpClSessOrAnon(c);

    // 匿名ユーザーの場合、まずユーザーのpub_idを取得
    const { data: user, error: userErr } = await spClSA
        .from('users_master')
        .select('pub_id')
        .eq('anon_pub_id', userAnonPubId)
        .single();

    if (userErr || !user) {
        throw new ApiErrorNotFound("User");
    }

    const { data: status, error: statusErr } = await spClSA
        .from('views_user_status')
        .select('*')
        .eq('user_pub_id', user.pub_id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (statusErr) {
        throw new ApiErrorFatal(`DB access error: ${statusErr.message}`);
    }

    if (!status || !status.privacy_allowed_status) {
        return null;
    }

    return await formatStatusResponse(c, status);
};

const formatStatusResponse = async (c: Context, status: {
    pub_id: string;
    user_pub_id: string;
    started_at?: string;
    finished_at?: string | null;
    is_auto_detected?: boolean;
    gym?: {
        pub_id: string;
        name: string;
        photo_name?: string;
        gymchain?: {
            pub_id: string;
            name: string;
            icon_name?: string;
            internal_id?: string;
        };
    } | null;
}): Promise<respBody> => {
    const { spCl: spClSrv } = mustGetSpClSessOrAnon(c);

    // gym情報の署名URL生成
    let gym = null;
    if (status.gym) {
        let photo_url: string | undefined = undefined;
        if (status.gym.photo_name) {
            try {
                const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                    .from('gyms_photos')
                    .createSignedUrl(status.gym.photo_name, 60 * 60);

                if (!signedUrlError && signedUrlData?.signedUrl) {
                    photo_url = signedUrlData.signedUrl;
                }
            } catch (e) {
                console.error('Failed to create signed URL for gym photo:', e);
            }
        }

        // gymchainのicon署名URL生成
        let gymchain_with_icon_url;
        if (status.gym.gymchain) {
            let gymchain_icon_url: string | undefined = undefined;
            if (status.gym.gymchain.icon_name) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await spClSrv.storage
                        .from('gymchains_icons')
                        .createSignedUrl(status.gym.gymchain.icon_name, 60 * 60);

                    if (!signedUrlError && signedUrlData?.signedUrl) {
                        gymchain_icon_url = signedUrlData.signedUrl;
                    }
                } catch (e) {
                    console.error('Failed to create signed URL for gymchain icon:', e);
                }
            }

            gymchain_with_icon_url = {
                pub_id: status.gym.gymchain.pub_id,
                name: status.gym.gymchain.name,
                icon_url: gymchain_icon_url,
                internal_id: status.gym.gymchain.internal_id
            };
        }

        gym = {
            pub_id: status.gym.pub_id,
            name: status.gym.name,
            photo_url,
            gymchain: gymchain_with_icon_url
        };
    }

    return {
        pub_id: status.pub_id,
        user_pub_id: status.user_pub_id,
        started_at: status.started_at ? convDateForFE(new Date(status.started_at), precision.MINUTE) : undefined,
        finished_at: status.finished_at ? convDateForFE(new Date(status.finished_at), precision.MINUTE) : null,
        is_auto_detected: status.is_auto_detected,
        gym
    };
};