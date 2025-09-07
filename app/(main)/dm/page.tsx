'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IoChevronBack } from "react-icons/io5";
import { IoSearch } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import { DMPair } from '@/types/dm.type';
// import { fetchDMPairs } from '@/lib/dm';

// テストデータ
const testDMs: DMPair[] = [
  {
    dm_id: "dm-001",
    user_b_id: "user-001",
    user_b_display_name: "田中太郎",
    user_b_icon_url: "/images/image.png",
    last_message: "お疲れ様です！今日のトレーニングどうでしたか？",
    last_message_at: "2024-01-15T14:30:00Z",
    unread_count: 2,
    user_b_allowed: true,
  },
  {
    dm_id: "dm-002",
    user_b_id: "user-002",
    user_b_display_name: "佐藤花子",
    user_b_icon_url: "/images/image.png",
    last_message: "明日のジム一緒に行きませんか？",
    last_message_at: "2024-01-15T12:15:00Z",
    unread_count: 0,
    user_b_allowed: true,
  },
  {
    dm_id: "dm-003",
    user_b_id: "user-003",
    user_b_display_name: "山田次郎",
    user_b_icon_url: "/images/image.png",
    last_message: "新しいプロテイン試してみました！",
    last_message_at: "2024-01-14T18:45:00Z",
    unread_count: 1,
    user_b_allowed: true,
  },
  {
    dm_id: "dm-004",
    user_b_id: "user-004",
    user_b_display_name: "鈴木美咲",
    user_b_icon_url: "/images/image.png",
    last_message: "フォームの確認お願いします",
    last_message_at: "2024-01-14T16:20:00Z",
    unread_count: 0,
    user_b_allowed: true,
  },
];

const DMs = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [dms, setDms] = useState<DMPair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadDMs = async () => {
      try {
        setLoading(true)
        // テストデータを使用
        await new Promise(resolve => setTimeout(resolve, 1000)) // ローディングをシミュレート
        setDms(testDMs)
        
        // 実際のAPI呼び出し（コメントアウト）
        // const data = await fetchDMPairs()
        // setDms(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました')
        console.error('DM取得エラー:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDMs()
  }, [])

  // 検索フィルタリング
  const filteredDms = dms.filter(dm => 
    dm.user_b_display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dm.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="flex items-center justify-start px-4 pt-5">
        <button className="text-2xl" onClick={() => router.back()}>
          <IoChevronBack />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold">DM</h1>
      </header>

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
      
      {/* DM一覧 */}
      <div className="px-4 py-2">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-red-500">{error}</div>
          </div>
        ) : filteredDms.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">
              {searchQuery ? '検索結果が見つかりません' : 'DMがありません'}
            </div>
          </div>
        ) : (
          filteredDms.map((dm) => (
            <Link 
              key={dm.dm_id} 
              href={`/dm/${dm.dm_id}`}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* プロフィール画像 */}
                <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={dm.user_b_icon_url}
                    alt={`${dm.user_b_display_name}のプロフィール画像`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* ユーザー情報とメッセージ */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-bold truncate">{dm.user_b_display_name}</div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {new Date(dm.last_message_at).toLocaleDateString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate">{dm.last_message}</div>
                </div>
              </div>
              
              {/* 未読バッジ */}
              {dm.unread_count > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {dm.unread_count}
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default DMs