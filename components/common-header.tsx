'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FiBell, FiMail } from "react-icons/fi"
import { useNotifications } from '@/contexts/notification-context'

interface CommonHeaderProps {
    showBackButton?: boolean
    title?: string
    onBackClick?: () => void
}

const CommonHeader: React.FC<CommonHeaderProps> = ({
    showBackButton = false,
    title,
    onBackClick
}) => {
    const { unreadCount } = useNotifications()

    if (showBackButton && title) {
        // バックボタン付きヘッダー（通知ページ、DMページなど用）
        return (
            <header className="w-full h-[8vh] flex items-center justify-between px-4 pt-4 bg-white border-b border-gray-100">
                <button
                    className="text-2xl text-gray-600 hover:text-gray-800"
                    onClick={onBackClick}
                    aria-label="戻る"
                >
                    ←
                </button>
                <h1 className="text-xl font-semibold">{title}</h1>
                <div className="w-8" /> {/* スペーサー */}
            </header>
        )
    }

    // 通常のホームヘッダー（ロゴ + 通知/DMアイコン）
    return (
        <header className="w-full h-[8vh] flex items-center justify-between px-8 pt-4 bg-white border-b border-gray-100">
            <Link href="/" aria-label="ホームに戻る" className="ml-2">
                <Image
                    src="/images/titlelogo.svg"
                    alt="Mascle ロゴ"
                    width={110}
                    height={1}
                    style={{ aspectRatio: "auto" }}
                    priority
                    className="h-auto"
                />
            </Link>
            <nav role="navigation" aria-label="ヘッダーナビゲーション">
                <div className="flex items-center gap-5 text-3xl">
                    <Link
                        href="/notification"
                        aria-label="通知"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-800 relative"
                    >
                        <FiBell aria-hidden="true" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/dm"
                        aria-label="ダイレクトメッセージ"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-800"
                    >
                        <FiMail aria-hidden="true" />
                    </Link>
                </div>
            </nav>
        </header>
    )
}

export default CommonHeader
