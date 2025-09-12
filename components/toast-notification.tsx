'use client'
import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types/notification.type'
import { getNotificationDisplayText, handleNotificationClick, getNotificationIconText } from '@/lib/notification'

interface ToastNotificationProps {
    notification: Notification
    onClose: () => void
    autoCloseDelay?: number
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
    notification,
    onClose,
    autoCloseDelay = 5000
}) => {
    const router = useRouter()
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(onClose, 300) // アニメーション時間を考慮
        }, autoCloseDelay)

        return () => clearTimeout(timer)
    }, [autoCloseDelay, onClose])

    const handleClick = () => {
        handleNotificationClick(notification, router)
        onClose()
    }

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsVisible(false)
        setTimeout(onClose, 300)
    }

    return (
        <div
            className={`fixed top-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 cursor-pointer transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
            onClick={handleClick}
        >
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
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
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {getNotificationDisplayText(notification)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        タップして詳細を見る
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    aria-label="通知を閉じる"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}

export default ToastNotification
