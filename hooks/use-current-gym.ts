'use client'

import { useEffect, useState } from 'react';

interface UserGym {
    pub_id: string;
    name: string;
}

interface TrainingStatus {
    pub_id: string;
    started_at: string;
}

interface CurrentGymResponse {
    gym: UserGym | null;
    is_training: boolean;
    status?: TrainingStatus;
}

export const useUserCurrentGym = () => {
    const [currentGym, setCurrentGym] = useState<UserGym | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentGym = async () => {
            try {
                // ユーザーの現在のトレーニング状況から現在のジム情報を取得
                const response = await fetch('/api/users/me/current-gym');
                if (response.ok) {
                    const data: CurrentGymResponse = await response.json();
                    setCurrentGym(data.gym);
                    setIsTraining(data.is_training);
                    setTrainingStatus(data.status || null);
                } else if (response.status === 401) {
                    // 認証エラーの場合
                    console.warn('Authentication required for gym data');
                    setCurrentGym(null);
                    setIsTraining(false);
                    setTrainingStatus(null);
                } else {
                    console.error('Failed to fetch current gym from training status');
                    setCurrentGym(null);
                    setIsTraining(false);
                    setTrainingStatus(null);
                }

            } catch (error) {
                console.error('Failed to fetch current gym:', error);
                setCurrentGym(null);
                setIsTraining(false);
                setTrainingStatus(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentGym();

        // 30秒ごとに更新（トレーニング状況は変動する可能性があるため）
        const interval = setInterval(fetchCurrentGym, 30000);

        return () => clearInterval(interval);
    }, []);

    return {
        currentGym,
        isTraining,
        trainingStatus,
        loading,
        refresh: () => {
            setLoading(true);
            // useEffect内のfetchを再実行するためのトリガー
            window.location.reload();
        }
    };
};
