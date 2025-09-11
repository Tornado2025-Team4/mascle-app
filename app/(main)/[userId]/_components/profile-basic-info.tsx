'use client';

import React from 'react';
import Image from 'next/image';

interface ProfileBasicInfoProps {
    isAnonymousMode: boolean;
    profile?: {
        pub_id?: string;
        anon_pub_id?: string;
        handle?: string;
        display_name?: string;
        description?: string;
        icon_url?: string;
        birth_date?: string;
        age?: number;
        generation?: number;
        gender?: string;
        registered_since?: string;
        training_since?: string;
        skill_level?: string;
        inited?: boolean;
        tags?: Array<{
            pub_id: string;
            name: string;
        }>;
        intents?: Array<{
            pub_id: string;
            intent: string;
        }>;
        intent_bodyparts?: Array<{
            pub_id: string;
            bodypart: string;
        }>;
        belonging_gyms?: Array<{
            pub_id: string;
            name: string;
            gymchain?: {
                pub_id: string;
                name: string;
                icon_url?: string;
                internal_id?: string;
            };
            photo_url?: string;
            joined_since?: string;
        }>;
        followings_count?: number;
        followers_count?: number;
        posts_count?: number;
    };
}

const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({
    isAnonymousMode,
    profile
}) => {
    // 匿名モードの場合は空要素を返す
    if (isAnonymousMode) {
        return <div className="bg-green-50 px-6 py-4 min-h-[200px]"></div>;
    }

    // プロフィールデータがない場合
    if (!profile) {
        return (
            <div className="bg-green-50 px-6 py-4 min-h-[200px] flex items-center justify-center">
                <p className="text-gray-500">プロフィール情報を読み込み中...</p>
            </div>
        );
    }

    // 基本情報の項目定義は削除し、直接表示する

    return (
        <div className="bg-green-50 px-6 py-4">
            <div className="flex items-start gap-6">
                {/* プロフィール画像（左上） */}
                <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="w-20 h-20 bg-gray-300 rounded-full flex-shrink-0 overflow-hidden relative">
                        <Image
                            src={profile.icon_url || '/images/image.png'}
                            alt={`${profile.display_name || 'ユーザー'}のプロフィール画像`}
                            fill
                            sizes="80px"
                            className="object-cover"
                        />
                    </div>
                </div>

                {/* メイン情報エリア（アイコンの右） */}
                <div className="flex-1 flex flex-col">
                    {/* ディスプレイネームとハンドルネーム */}
                    <div className="mb-3">
                        <h3 className="text-xl font-semibold">{profile.display_name || 'ユーザー'}</h3>
                        <p className="text-sm text-gray-600">{profile.handle || ''}</p>
                    </div>

                    {/* 統計情報（投稿数、フォロワー数、フォロー数） */}
                    <div className="flex items-center gap-6 mb-4">
                        <div className="text-center">
                            <div className="text-lg font-bold">{profile.posts_count || 0}</div>
                            <div className="text-xs text-gray-600">投稿</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold">{profile.followers_count || 0}</div>
                            <div className="text-xs text-gray-600">フォロワー</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold">{profile.followings_count || 0}</div>
                            <div className="text-xs text-gray-600">フォロー</div>
                        </div>
                    </div>

                    {/* 自己紹介 */}
                    <div className="mb-3">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {profile.description || '自己紹介はありません'}
                        </p>
                    </div>

                    {/* タグ */}
                    <div className="flex flex-wrap gap-2">
                        {profile.tags && profile.tags.length > 0 ? (
                            profile.tags.map((tag) => (
                                <span
                                    key={tag.pub_id}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                    #{tag.name}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-gray-500">タグはありません</span>
                        )}
                    </div>
                </div>
            </div>

            {/* 基本情報セクション */}
            <div className="mt-6 border-t border-green-200 pt-4">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">基本情報</h4>
                <div className="grid grid-cols-1 gap-3">

                    {/* 年代、年齢、誕生日 */}
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                        <span className="text-sm text-gray-600">年代・年齢・誕生日</span>
                        <span className="text-sm font-medium text-gray-800">
                            {profile.generation ? `${profile.generation}代` : ''}
                            {profile.age ? ` ${profile.age}歳` : ''}
                            {profile.birth_date ? ` (${new Date(profile.birth_date).toLocaleDateString('ja-JP')})` : ''}
                            {!profile.generation && !profile.age && !profile.birth_date ? '未設定' : ''}
                        </span>
                    </div>

                    {/* 性別 */}
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                        <span className="text-sm text-gray-600">性別</span>
                        <span className="text-sm font-medium text-gray-800">
                            {profile.gender === 'male' ? '男性' :
                                profile.gender === 'female' ? '女性' :
                                    profile.gender === 'other' ? 'その他' :
                                        profile.gender === 'prefer_not_to_say' ? '回答しない' : '未設定'}
                        </span>
                    </div>

                    {/* いつからトレーニングしてるか */}
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                        <span className="text-sm text-gray-600">トレーニング開始日</span>
                        <span className="text-sm font-medium text-gray-800">
                            {profile.training_since ?
                                new Date(profile.training_since).toLocaleDateString('ja-JP') : '未設定'}
                        </span>
                    </div>

                    {/* いつ登録したか */}
                    <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                        <span className="text-sm text-gray-600">登録日</span>
                        <span className="text-sm font-medium text-gray-800">
                            {profile.registered_since ?
                                new Date(profile.registered_since).toLocaleDateString('ja-JP') : '未設定'}
                        </span>
                    </div>

                    {/* トレーニング目的 */}
                    <div className="py-2 px-3 bg-white rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-600">トレーニング目的</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.intents && profile.intents.length > 0 ? (
                                profile.intents.map((intent) => (
                                    <span
                                        key={intent.pub_id}
                                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                                    >
                                        {intent.intent}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">未設定</span>
                            )}
                        </div>
                    </div>

                    {/* 鍛えたい部位 */}
                    <div className="py-2 px-3 bg-white rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-600">鍛えたい部位</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.intent_bodyparts && profile.intent_bodyparts.length > 0 ? (
                                profile.intent_bodyparts.map((bodypart) => (
                                    <span
                                        key={bodypart.pub_id}
                                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                                    >
                                        {bodypart.bodypart}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">未設定</span>
                            )}
                        </div>
                    </div>

                    {/* よく行くジム */}
                    <div className="py-2 px-3 bg-white rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-600">よく行くジム</span>
                        </div>
                        <div className="space-y-2">
                            {profile.belonging_gyms && profile.belonging_gyms.length > 0 ? (
                                profile.belonging_gyms.map((gym) => (
                                    <div key={gym.pub_id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                        {gym.photo_url && (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={gym.photo_url}
                                                    alt={gym.name}
                                                    width={40}
                                                    height={40}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-sm">{gym.name}</p>
                                            {gym.gymchain && (
                                                <p className="text-xs text-gray-500">{gym.gymchain.name}</p>
                                            )}
                                            {gym.joined_since && (
                                                <p className="text-xs text-gray-400">
                                                    {new Date(gym.joined_since).toLocaleDateString('ja-JP')}から
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">未設定</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProfileBasicInfo;
