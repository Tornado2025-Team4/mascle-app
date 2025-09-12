'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import ToastNotification from '@/components/toast-notification'
import type { Notification } from '@/types/notification.type'

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    markAsRead: (notificationIds: string[]) => Promise<void>
    refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}

interface NotificationProviderProps {
    children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [toastNotifications, setToastNotifications] = useState<Notification[]>([])
    const isInitialLoad = useRef<boolean>(true)
    const pollingInterval = useRef<NodeJS.Timeout | null>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/users/me/notices')
            if (!res.ok) return

            const newNotifications: Notification[] = await res.json()

            setNotifications(prevNotifications => {
                // 初回読み込み以外で新しい通知があった場合、トーストに表示
                if (!isInitialLoad.current) {
                    const now = new Date()
                    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000)

                    const newUnreadNotifications = newNotifications.filter(n => {
                        const notificationTime = new Date(n.notified_at)
                        return (
                            !n.is_read &&
                            !prevNotifications.some(existing => existing.pub_id === n.pub_id) &&
                            notificationTime >= thirtySecondsAgo // 30秒以内の通知のみ
                        )
                    })

                    if (newUnreadNotifications.length > 0) {
                        // 新しい通知をトーストに追加（重複チェック）
                        const newToasts = newUnreadNotifications.filter(newNotif =>
                            !toastNotifications.some(existingToast => existingToast.pub_id === newNotif.pub_id)
                        )

                        if (newToasts.length > 0) {
                            // 最新の通知1つだけをトーストで表示
                            const latestNotification = newToasts.sort(
                                (a, b) => new Date(b.notified_at).getTime() - new Date(a.notified_at).getTime()
                            )[0]

                            setToastNotifications(prev => [...prev, latestNotification])
                        }
                    }
                }

                isInitialLoad.current = false
                return newNotifications
            })
        } catch (error) {
            console.error('通知の取得エラー:', error)
        }
    }, [toastNotifications])

    const markAsRead = useCallback(async (notificationIds: string[]) => {
        try {
            const res = await fetch('/api/users/me/notices', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notice_ids: notificationIds }),
            })

            if (!res.ok) {
                throw new Error('通知の既読処理に失敗しました')
            }

            // ローカル状態を更新
            setNotifications(prev =>
                prev.map(n =>
                    notificationIds.includes(n.pub_id)
                        ? { ...n, is_read: true }
                        : n
                )
            )
        } catch (error) {
            console.error('通知の既読処理エラー:', error)
        }
    }, [])

    const refreshNotifications = useCallback(async () => {
        await fetchNotifications()
    }, [fetchNotifications])

    const unreadCount = notifications.filter(n => !n.is_read).length

    const removeToastNotification = useCallback((notificationId: string) => {
        setToastNotifications(prev => prev.filter(n => n.pub_id !== notificationId))
    }, [])

    // 古いトーストを定期的にクリーンアップ
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = new Date()
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5分前

            setToastNotifications(prev =>
                prev.filter(toast => new Date(toast.notified_at) >= fiveMinutesAgo)
            )
        }, 60000) // 1分ごとにクリーンアップ

        return () => clearInterval(cleanupInterval)
    }, [])

    // 初回読み込み
    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    // ポーリング開始
    useEffect(() => {
        pollingInterval.current = setInterval(() => {
            fetchNotifications()
        }, 30000) // 30秒ごと

        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current)
            }
        }
    }, [fetchNotifications])

    const contextValue: NotificationContextType = {
        notifications,
        unreadCount,
        markAsRead,
        refreshNotifications,
    }

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}

            {/* トースト通知の表示 */}
            {toastNotifications.map((notification, index) => (
                <div
                    key={`toast-${notification.pub_id}-${index}`}
                    style={{
                        top: `${16 + index * 80}px`, // 複数の通知がある場合は縦に並べる
                    }}
                    className="absolute"
                >
                    <ToastNotification
                        notification={notification}
                        onClose={() => removeToastNotification(notification.pub_id)}
                    />
                </div>
            ))}
        </NotificationContext.Provider>
    )
}
