'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { IoEllipse } from 'react-icons/io5'
import { useRouter } from 'next/navigation'
import RecommendFollow from './_components/recommend-follow'
import SubHeader from '@/components/sub-header'
import type { Notification } from '@/types/notification.type'
import { getNotificationDisplayText, handleNotificationClick } from '@/lib/notification'
import { formatRelativeTime } from '@/lib/date'
import Image from 'next/image'

const Notification = () => {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[] | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch('/api/users/me/notices')
        if (!res.ok) throw new Error('通知の取得に失敗しました')
        const body: { notices: Array<Notification> } = await res.json()
        setNotifications(body.notices ?? [])
      } catch (err) {
        console.error(err)
        setError('通知の取得に失敗しました')
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchNotification()
  }, [])

  const sortedNotifications = useMemo(() => {
    const src = notifications ?? []
    return src
  }, [notifications])

  return (
    <div className="h-svh bg-white flex flex-col">
      <SubHeader title="通知" />
      {/* 通知一覧 */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24" style={{ maxHeight: 'calc(100vh - 8vh - 6vh - 10vh)' }}>
        {isLoading && (
          <p className="py-6 text-sm text-gray-500">読み込み中...</p>
        )}
        {!isLoading && error && (
          <p className="py-6 text-sm text-red-600">エラーが発生しました</p>
        )}

        {!isLoading && (
          <section className="mt-2">
            <ul className="space-y-3">
              {sortedNotifications.map((notification) => (
                <li
                  key={notification.pub_id}
                  className={`rounded-lg p-4 text-sm border-l-4 cursor-pointer transition-colors ${notification.is_read
                      ? 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                      : 'bg-rose-50 border-rose-300 shadow-sm hover:bg-rose-100'
                    }`}
                  onClick={() => handleNotificationClick(notification, router)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="flex items-center justify-center h-full mt-1.5 w-4">
                        {!notification.is_read && (
                          <IoEllipse className="text-rose-500 mx-auto w-2 h-2" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-1 ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notification.mentions[0]?.profile.icon_url && (
                            <Image src={notification.mentions[0].profile.icon_url} alt="通知アイコン" className="w-4 h-4" width={16} height={16} />
                          )}
                          <p className="truncate max-w-full">{getNotificationDisplayText(notification).length > 40 ? getNotificationDisplayText(notification).slice(0, 40) + '...' : getNotificationDisplayText(notification)}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`tabular-nums text-xs ml-3 flex-shrink-0 ${notification.is_read ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                      {formatRelativeTime(notification.notified_at)}
                    </span>
                  </div>
                </li>
              ))}
              {sortedNotifications.length === 0 && (
                <li className="text-center py-8 text-sm text-gray-500">
                  通知はありません
                </li>
              )}
            </ul>
          </section>
        )}

        {/* フォローのおすすめ */}
        <RecommendFollow />
      </main>
    </div>
  )
}

export default Notification