'use client'

import { Card } from '@/components/ui/card';
import { MapPin, Clock } from 'lucide-react';
import { useUserCurrentGym } from '@/hooks/use-current-gym';

const CurrentGymSetting: React.FC = () => {
    const { currentGym, isTraining, trainingStatus, loading } = useUserCurrentGym();

    if (loading) {
        return (
            <Card className="p-3 mb-4">
                <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">読み込み中...</span>
                </div>
            </Card>
        );
    }

    if (isTraining && currentGym) {
        const formatTime = (dateString: string) => {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

            if (diffInMinutes < 60) {
                return `${diffInMinutes}分前から`;
            } else {
                const hours = Math.floor(diffInMinutes / 60);
                return `${hours}時間前から`;
            }
        };

        return (
            <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <div>
                        <span className="text-sm font-medium text-blue-900">トレーニング中</span>
                        <p className="text-xs text-blue-700">{currentGym.name}</p>
                        {trainingStatus && (
                            <div className="flex items-center space-x-1 mt-1">
                                <Clock className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-blue-600">
                                    {formatTime(trainingStatus.started_at)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-3 mb-4 border-dashed border-gray-300">
            <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">現在トレーニング中ではありません</span>
            </div>
        </Card>
    );
};

export default CurrentGymSetting;
