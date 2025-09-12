'use client'
import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import SubHeader from '@/components/sub-header'
import { getNotificationDisplayText, handleNotificationClick, getNotificationIconText } from '@/lib/notification'
import { formatRelativeTime } from '@/lib/date'
import Image from 'next/image'
import { useNotifications } from '@/contexts/notification-context'

const NotificationPage = () => {
  const router = useRouter()
  const { notifications, markAsRead, clearUnreadCount } = useNotifications()

  // 通知ページを開いた時に未読通知数をクリア
  useEffect(() => {
    clearUnreadCount()
  }, [clearUnreadCount])

  // 通知をページに表示した際に既読にマーク
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      if (unreadNotifications.length > 0) {
        const unreadIds = unreadNotifications.map(n => n.pub_id)
        markAsRead(unreadIds)
      }
    }
  }, [notifications, markAsRead])

  const sortedNotifications = useMemo(() => {
    return notifications.sort((a, b) => new Date(b.notified_at).getTime() - new Date(a.notified_at).getTime())
  }, [notifications])

  return (
    <div className="h-svh bg-white flex flex-col">
      <SubHeader title="通知" />
      {/* 通知一覧 */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24" style={{ maxHeight: 'calc(100vh - 8vh - 6vh - 10vh)' }}>
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
                    <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                      {notification.igniter_user?.icon_url ? (
                        <Image
                          src={notification.igniter_user.icon_url}
                          alt="通知アイコン"
                          className="w-8 h-8 rounded-full object-cover"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <span className="text-lg">
                          {getNotificationIconText(notification)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${notification.is_read ? 'text-gray-600' : 'text-gray-900'} whitespace-pre-wrap break-words`}>
                        {getNotificationDisplayText(notification)}
                      </p>
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
      </main>
    </div>
  )
}

export default NotificationPage