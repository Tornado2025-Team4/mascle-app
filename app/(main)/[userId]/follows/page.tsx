'use client'
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { Follow } from '@/types/userData.type'
import { IoArrowBack } from "react-icons/io5";
import { IoSearch } from "react-icons/io5";
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 仮のフォロワーデータ
const followers: Follow[] = [
  {
    user_id: "user-001",
    display_name: "taito",
    description: "最近筋トレを始めた大学3年生です。仲良くしてください！よろしくお願いします！",
    icon_url: "/images/image.png"
  },
  {
    user_id: "user-003",
    display_name: "田中",
    description: "ボディビルダー",
    icon_url: "/images/image.png"
  },
  {
    user_id: "user-002",
    display_name: "佐藤",
    description: "フィットネスインストラクター",
    icon_url: "/images/image.png"
  }
];

// 仮のフォローデータ
const follows: Follow[] = [
  {
    user_id: "user-004",
    display_name: "山田",
    description: "ジムオーナー",
    icon_url: "/images/image.png"
  },
  {
    user_id: "user-005",
    display_name: "鈴木",
    description: "パワーリフター",
    icon_url: "/images/image.png"
  },
  {
    user_id: "user-006",
    display_name: "高橋",
    description: "ヨガインストラクター",
    icon_url: "/images/image.png"
  }
];

const Follows = () => {
  const userId = useParams().userId;
  const [activeTab, setActiveTab] = useState<'followers' | 'follows'>('followers');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const currentData = activeTab === 'followers' ? followers : follows;
  const filteredData = currentData.filter(user =>
    user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="flex items-center justify-start px-4 pt-5">
        <button className="text-2xl" onClick={() => router.back()}>
          <IoArrowBack />
        </button>
      </header>

      <div className="flex items-center justify-center gap-8 px-4 pt-1">
        <button
          className={`pb-2 ${activeTab === 'followers' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          {followers.length} フォロワー
        </button>
        <button
          className={`pb-2 ${activeTab === 'follows' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('follows')}
        >
          {follows.length} フォロー
        </button>
      </div>

      {/* 検索バー */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ユーザーリスト */}
      <div className="px-4 py-2">
        {filteredData.map((user) => (
            <div key={user.user_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <Link href={`/${user.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={user.icon_url}
                  alt={`${user.display_name}のプロフィール画像`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{user.display_name}</div>
                <div className="text-sm text-gray-500 truncate">{user.description}</div>
              </div>
            </Link>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors flex-shrink-0">
              フォロー
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Follows