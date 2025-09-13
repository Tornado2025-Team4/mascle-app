'use client'

import Link from "next/link";
import { IoAdd } from "react-icons/io5";
import PostList from "./_components/postlist";
import TrainingStatus from "./_components/training-status";
import { useEffect } from "react";
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // プロフィール初期化チェック
  useEffect(() => {
    const checkProfileInit = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const response = await fetch(`/api/users/me/profile`);
          if (response.ok) {
            const profile = await response.json();
            if (!profile?.inited) {
              router.replace('/setup');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Profile check error:', error);
      }
    };

    checkProfileInit();
  }, [router]);

  // 認証システム統合予定: 実際のユーザー認証を実装する際にログインユーザーのIDを取得
  // 現在は開発用の仮IDを使用（認証コンテキストまたはSupabaseから取得予定）
  const currentUserId = "dummy_user_id";

  return (
    <div className="min-h-screen pb-[8vh] relative">
      <main className="h-[calc(100vh-8vh)] overflow-y-auto">
        {/* トレーニング状態表示 - ユーザーの実際のトレーニング状況に基づく */}
        <div className="p-4 pb-0">
          <TrainingStatus currentUserId={currentUserId} />
        </div>

        {/* 投稿一覧 */}
        <div className="px-4 pb-[4vh]">
          <PostList />
        </div>
      </main>

      {/* 固定された投稿作成ボタン */}
      <Link
        href="/create_post"
        className="fixed bottom-[12vh] right-6 w-16 h-16 bg-[#2C2C2C] hover:bg-[#2C2C2C] active:bg-[#2C2C2C] text-white rounded-full shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200 flex items-center justify-center z-40 hover:scale-105 active:scale-95"
        aria-label="新規投稿"
      >
        <IoAdd className="text-3xl" />
      </Link>
    </div>
  );
}
