'use client'

import Link from "next/link";
import { IoAdd } from "react-icons/io5";
import PostList from "./_components/postlist";

export default function Home() {
  return (
    <div className="min-h-screen pb-[10vh] relative">
      <main className="h-[72vh] space-y-4 p-4 overflow-y-auto">
        <PostList />
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
