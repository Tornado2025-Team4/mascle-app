'use client'

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Dumbbell } from 'lucide-react';
import TrainingUsersPopup from '@/components/training-users-popup';

interface TrainingUsersData {
    gym_pub_id: string;
    total_count: number;
    sections: {
        public: {
            count: number;
            users: unknown[];
        };
        anonymous: {
            count: number;
            users: unknown[];
        };
        hidden: {
            count: number;
        };
    };
}

interface CurrentTrainingStatus {
    is_training: boolean;
    gym_pub_id: string | null;
    gym_name: string | null;
    status_pub_id: string | null;
    started_at: string | null;
}

interface TrainingStatusProps {
    currentUserId: string | null;  // ユーザーIDを受け取る
}

const TrainingStatus: React.FC<TrainingStatusProps> = ({ currentUserId }) => {
    const [currentStatus, setCurrentStatus] = useState<CurrentTrainingStatus | null>(null);
    const [trainingData, setTrainingData] = useState<TrainingUsersData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    useEffect(() => {
        if (!currentUserId) return;

        const fetchTrainingUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. ユーザーの現在のトレーニング状況とジム情報を取得
                const currentGymResponse = await fetch('/api/users/me/current-gym');

                if (!currentGymResponse.ok) {
                    if (currentGymResponse.status === 401) {
                        throw new Error('認証が必要です');
                    }
                    throw new Error('現在のトレーニング状況の取得に失敗しました');
                }

                const currentGymData = await currentGymResponse.json();

                // トレーニング中でない、またはジムが設定されていない場合
                if (!currentGymData.is_training || !currentGymData.gym) {
                    setCurrentStatus({
                        is_training: false,
                        gym_pub_id: null,
                        gym_name: null,
                        status_pub_id: null,
                        started_at: null
                    });
                    setTrainingData(null);
                    return;
                }

                // 2. 現在のジムで同じようにトレーニング中のユーザーを取得
                const trainingUsersResponse = await fetch(`/api/gyms/${currentGymData.gym.pub_id}/training_users`);

                if (!trainingUsersResponse.ok) {
                    throw new Error('トレーニング中のユーザー情報の取得に失敗しました');
                }

                const trainingUsersData = await trainingUsersResponse.json();

                setCurrentStatus({
                    is_training: true,
                    gym_pub_id: currentGymData.gym.pub_id,
                    gym_name: currentGymData.gym.name,
                    status_pub_id: currentGymData.status?.pub_id || null,
                    started_at: currentGymData.status?.started_at || null
                });
                setTrainingData(trainingUsersData);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setCurrentStatus({
                    is_training: false,
                    gym_pub_id: null,
                    gym_name: null,
                    status_pub_id: null,
                    started_at: null
                });
                setTrainingData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchTrainingUsers();

        // 30秒ごとに更新
        const interval = setInterval(fetchTrainingUsers, 30000);

        return () => clearInterval(interval);
    }, [currentUserId]);

    if (!currentUserId) return null;

    if (loading && !trainingData) {
        return (
            <Card className="p-4 mb-4">
                <div className="flex items-center space-x-2">
                    <Dumbbell className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">読み込み中...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-4 mb-4">
                <div className="flex items-center space-x-2 text-red-600">
                    <Dumbbell className="h-4 w-4" />
                    <span className="text-sm">エラー: {error}</span>
                </div>
            </Card>
        );
    }

    // ユーザーがトレーニング中でない場合はコンポーネントを非表示
    if (!currentStatus?.is_training) {
        return null;
    }

    // トレーニング中だが他に誰もいない場合もコンポーネントを非表示
    if (!trainingData || trainingData.total_count === 0) {
        return null;
    }

    return (
        <TrainingUsersPopup
            gymId={currentStatus.gym_pub_id}
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            trigger={
                <Card
                    className="p-4 mb-4 cursor-pointer hover:shadow-xl transition-all duration-200 border-2 border-orange-200 hover:border-orange-400 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100"
                    onClick={() => setIsPopupOpen(true)}
                >
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-full shadow-lg">
                            <Dumbbell className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-900">
                                    {trainingData.total_count}人が{currentStatus.gym_name}でトレーニング中
                                </span>
                                <MapPin className="h-4 w-4 text-orange-600" />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                クリックして詳細を表示
                            </p>
                        </div>
                        {loading && (
                            <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                        )}
                    </div>
                </Card>
            }
        />
    );
};

export default TrainingStatus;
