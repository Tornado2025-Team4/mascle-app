'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { FiBell } from "react-icons/fi";
import { FiMail } from "react-icons/fi";

const Header = () => {
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await fetch('/api/users/me/notices/count');
        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.unread_count);
        }
      } catch (error) {
        console.error('通知数の取得に失敗しました:', error);
      }
    };

    fetchNotificationCount();

    // 30秒ごとに通知数を更新
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => clearInterval(interval);
  }, []);

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
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {notificationCount > 99 ? '99+' : notificationCount}
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

export default Header