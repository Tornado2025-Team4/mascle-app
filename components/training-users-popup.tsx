import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';

type UserProfile = {
    pub_id?: string;
    anon_pub_id?: string;
    handle?: string;
    display_name?: string | null;
    description?: string | null;
    icon_url?: string;
    skill_level?: number | null;
    tags?: Array<{ pub_id: string; name: string }>;
    followers_count?: number | null;
    followings_count?: number | null;
};

type TrainingUser = {
    user_pub_id?: string;
    status_pub_id: string;
    started_at: string;
    anchor_type: 'handle' | 'anon_id';
    anchor_value?: string;
    profile: UserProfile | null;
};

type TrainingUsersData = {
    gym_pub_id: string;
    total_count: number;
    sections: {
        public: {
            count: number;
            users: TrainingUser[];
        };
        anonymous: {
            count: number;
            users: TrainingUser[];
        };
        hidden: {
            count: number;
        };
    };
};

type TrainingUsersPopupProps = {
    gymId: string | null;
    isOpen: boolean;
    onClose: () => void;
    trigger?: React.ReactNode;
};

const TrainingUsersPopup: React.FC<TrainingUsersPopupProps> = ({
    gymId,
    isOpen,
    onClose,
    trigger
}) => {
    const [data, setData] = useState<TrainingUsersData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // データ取得
    const fetchTrainingUsers = useCallback(async () => {
        if (!gymId) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/gyms/${gymId}/training_users`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Failed to fetch training users:', err);
            setError('トレーニング中のユーザー情報を取得できませんでした');
        } finally {
            setLoading(false);
        }
    }, [gymId]);

    useEffect(() => {
        if (isOpen && gymId) {
            fetchTrainingUsers();
        }
    }, [isOpen, gymId, fetchTrainingUsers]);

    // ユーザーカードコンポーネント
    const UserCard: React.FC<{ user: TrainingUser }> = ({ user }) => {
        const profile = user.profile;
        if (!profile) return null;

        const displayName = profile.display_name ||
            (user.anchor_type === 'handle' ? profile.handle : profile.anon_pub_id) ||
            '名前未設定';

        const isAnonymous = user.anchor_type === 'anon_id';
        const linkHref = user.anchor_value;//どちらも既に/~や@がついている

        // 経過時間計算
        const startTime = new Date(user.started_at);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        const timeDisplay = hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;

        return (
            <a href={linkHref} className="block">
                <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-2">
                        <div className="flex items-start space-x-3">
                            {/* アバター */}
                            <Avatar className="w-12 h-12 ring-2 ring-blue-200 flex-shrink-0">
                                <AvatarImage
                                    src={profile.icon_url ?? undefined}
                                    alt={displayName}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                                    {displayName.slice(0, 1).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                {/* 名前とハンドル */}
                                <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {displayName}
                                    </h3>
                                    {isAnonymous && (
                                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                            匿名
                                        </Badge>
                                    )}
                                </div>

                                {/* ハンドル名/匿名ID */}
                                {!isAnonymous && profile.handle && (
                                    <p className="text-sm text-gray-600 mb-2">
                                        {profile.handle}
                                    </p>
                                )}

                                {/* 自己紹介 */}
                                {profile.description && (
                                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                                        {profile.description}
                                    </p>
                                )}

                                {/* タグ */}
                                {profile.tags && profile.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {profile.tags.slice(0, 3).map((tag) => (
                                            <Badge key={tag.pub_id} variant="outline" className="text-xs bg-blue-50 border-blue-200">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                        {profile.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{profile.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* トレーニング時間と開始時期 */}
                                <div className="flex flex-col space-y-1 text-xs text-gray-500">
                                    {/* 今回のトレーニング時間 */}
                                    <div className="flex items-center space-x-1">
                                        <Dumbbell className="w-3 h-3" />
                                        <span>開始から {timeDisplay}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </a>
        );
    }; if (!isOpen) return trigger;

    return (
        <>
            {trigger}
            <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ヘッダー */}
                    <div className="bg-white border-b border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Dumbbell className="w-5 h-5 text-gray-700" />
                                <h2 className="text-lg font-bold text-gray-900">トレーニング中のユーザー</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                        {data && (
                            <p className="text-gray-600 text-sm mt-1">
                                全 {data.total_count} 人がトレーニング中
                            </p>
                        )}
                    </div>

                    {/* コンテンツ */}
                    <div className="p-6 max-h-[calc(80vh-140px)] overflow-y-auto">
                        {loading && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-600 mt-2">読み込み中...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-8 text-red-600">
                                <p>{error}</p>
                            </div>
                        )}

                        {data && !loading && (
                            <div className="space-y-6">
                                {/* 公開ユーザー */}
                                {data.sections.public.count > 0 && (
                                    <section>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                            <span>公開プロフィール</span>
                                            <Badge className="bg-green-100 text-green-800">
                                                {data.sections.public.count}人
                                            </Badge>
                                        </h3>
                                        <div className="grid gap-3">
                                            {data.sections.public.users.map((user) => (
                                                <UserCard key={user.status_pub_id} user={user} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* 匿名ユーザー */}
                                {data.sections.anonymous.count > 0 && (
                                    <section>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                            <span>匿名プロフィール</span>
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                {data.sections.anonymous.count}人
                                            </Badge>
                                        </h3>
                                        <div className="grid gap-3">
                                            {data.sections.anonymous.users.map((user) => (
                                                <UserCard key={user.status_pub_id} user={user} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* 非表示ユーザー */}
                                {data.sections.hidden.count > 0 && (
                                    <section>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                                            <span>非表示</span>
                                            <Badge className="bg-gray-100 text-gray-800">
                                                {data.sections.hidden.count}人
                                            </Badge>
                                        </h3>
                                        <Card className="bg-gray-50">
                                            <CardContent className="p-4 text-center">
                                                <p className="text-gray-600">
                                                    {data.sections.hidden.count}人が非表示設定でトレーニングしています
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </section>
                                )}

                                {/* ユーザーがいない場合 */}
                                {data.total_count === 0 && (
                                    <div className="text-center py-8">
                                        <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-600">現在トレーニング中のユーザーはいません</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default TrainingUsersPopup;
