'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { IoChevronBack } from "react-icons/io5";
import { IoSearch } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import { DMPair } from '@/types/dm.type';

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
        const res = await fetch('/api/dm/pairs')
        if (!res.ok) throw new Error('DM取得に失敗しました')
        const body: { pairs: Array<{ dm_id: string; partner_pub_id: string; partner_display_name?: string; partner_icon_url?: string | null; partner_allowed: boolean; latest_message?: { body: string; sent_at: string } }> } = await res.json()
        // APIの構造をUIの型にマッピング（未提供項目は仮値を補完）
        const mapped: DMPair[] = (body.pairs ?? []).map((p) => ({
          dm_id: p.dm_id,
          user_b_id: p.partner_pub_id,
          user_b_display_name: p.partner_display_name ?? 'ユーザー',
          user_b_icon_url: p.partner_icon_url ?? '/images/image.png',
          last_message: p.latest_message?.body ?? '',
          last_message_at: p.latest_message?.sent_at ?? new Date().toISOString(),
          unread_count: 0,
          user_b_allowed: p.partner_allowed,
        }))
        setDms(mapped)
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
            <a
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
            </a>
          ))
        )}
      </div>
    </div>
  )
}

export default DMs