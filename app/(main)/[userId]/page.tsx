import React from 'react'
import ProfileSetting from './_components/profile-setting'
import { UserData } from '@/types/userData.type';
import Header from './_components/header';
import Link from 'next/link';
import { FaDumbbell, FaMedal,FaChartLine } from 'react-icons/fa';
import { ImTarget, ImClock, ImLocation, ImTrophy } from 'react-icons/im';
import { calculateTrainingPeriod } from '@/lib/date';

const Profile = ({
  params,
}: {
  params: {
    userId: string;
  };
}) => {
  // 仮のユーザーデータ
  const userData: UserData = {
    uuid: "user-123",
    handle_id: "tait_muscle",
    display_name: "tait",
    description: "最近筋トレを始めた大学3年生です。仲良くしてください！よろしくお願いします",
    icon_url: "/images/image.png",
    tags: ["筋トレ初心者", "大学生", "ボディメイク"],
    birth_date: "2004-03-15",
    age: 20,
    generation: "Z世代",
    gender: "男性",
    training_since: "2023-09-01",
    skill_level: "初級",
    training_intents: ["ボディメイク", "健康維持", "筋力向上"],
    training_intent_body_parts: ["胸", "背中", "腕", "脚"],
    belonging_gyms: [
      {
        pub_id: "gym-001",
        name: "エニタイム新宿店",
        location: "東京都新宿区"
      }
    ],
    follows_count: 11,
    followers_count: 12,
    registered_at: "2023-08-15",
    last_state: {
      pub_id: "state-001",
      started_at: "2024-01-15T10:00:00Z",
      finished_at: "2024-01-15T11:30:00Z",
      is_auto_detected: false,
      gym_pub_id: "gym-001",
      gym_name: "エニタイム新宿店"
    }
  };

  const trainingPeriod = calculateTrainingPeriod(userData.training_since);
  return (
    <div className="min-h-screen px-[5vw] pb-[13vh]">
      {/* ヘッダー */}
      <Header />

      {/* プロフィール情報セクション（薄緑背景） */}
      <div className="bg-green-50 px-6 py-4">
        <div className="flex items-start gap-6">
          {/* プロフィール画像とユーザー名 */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex-shrink-0 overflow-hidden">
              <img
                src={userData.icon_url}
                alt={`${userData.display_name}のプロフィール画像`}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-center">{userData.display_name}</h3>
          </div>

          {/* ユーザー情報と統計 */}
          <div className="flex-1 flex flex-col ml-4">
            <Link href={params.userId + "/follows"} className="flex items-center justify-center gap-8 mt-2 mb-4">

              <div className="text-center">
                <div className="text-xl font-bold">{userData.followers_count}</div>
                <div className="text-sm text-gray-600">フォロワー</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{userData.follows_count}</div>
                <div className="text-sm text-gray-600">フォロー</div>
              </div>
            </Link>

            {/* 自己紹介 */}
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {userData.description}
            </p>

            {/* タグ */}
            <div className="flex flex-wrap gap-2">
              {userData.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-[13px] rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 詳細ユーザー情報セクション（白背景） */}
      <div className="bg-white px-6 py-6 mt-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
          基本情報
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImTarget className="text-blue-500" />
              <span className="text-gray-600">性別</span>
            </div>
            <span className="text-gray-800 font-medium">{userData.gender}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <FaMedal className="text-yellow-500" />
              <span className="text-gray-600">年齢</span>
            </div>
            <span className="text-gray-800 font-medium">{userData.age}歳</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImClock className="text-green-500" />
              <span className="text-gray-600">ジム暦</span>
            </div>
            <span className="text-gray-800 font-medium">{trainingPeriod}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImLocation className="text-red-500" />
              <span className="text-gray-600">ジム</span>
            </div>
            <span className="text-gray-800 font-medium">{userData.belonging_gyms[0]?.name || "未設定"}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImTrophy className="text-purple-500" />
              <span className="text-gray-600">目的</span>
            </div>
            <span className="text-gray-800 font-medium">{userData.training_intents[0] || "未設定"}</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <FaDumbbell className="text-orange-500" />
              <span className="text-gray-600">鍛える部位</span>
            </div>
            <span className="text-gray-800 font-medium">{userData.training_intent_body_parts.join(" ")}</span>
          </div>
        </div>

        {/* プロフィール編集ボタン */}
        <ProfileSetting userId={params.userId} />
      </div>

      {/* データ可視化グラフ */}
      <div className="bg-white px-6 py-6 mt-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
          <FaChartLine className="text-blue-500" />
          栄養バランス分析
        </h2>
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 h-48 flex items-center justify-center border border-gray-200">
          <div className="text-center">
            <p className="text-gray-500 text-sm">グラフ表示エリア</p>
            <p className="text-gray-400 text-xs mt-1">運動強度と時間の関係</p>
          </div>
        </div>
      </div>

      {/* 筋トレ記録 */}
      <div className="bg-white px-6 py-6 mt-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
          <FaDumbbell className="text-orange-500" />
          筋トレ記録
        </h2>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 h-32 flex items-center justify-center border border-orange-200">
          <div className="text-center">
            <p className="text-gray-500 text-sm">記録表示エリア</p>
            <p className="text-gray-400 text-xs mt-1">最近のトレーニング履歴</p>
          </div>
        </div>
      </div>
    </div >
  )
}

export default Profile