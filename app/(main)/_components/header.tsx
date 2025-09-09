import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { FiHeart } from "react-icons/fi";
import { FiNavigation } from "react-icons/fi";

const Header = () => {
  return (/*
    <header className="w-full h-[10vh] flex items-center justify-between px-8 pt-4">
      <Image src="/images/titlelogo.svg" alt="titlelogo" width={90} height={20} />
      <div className="flex items-center gap-5 text-3xl">
        <Link href="/notification"><FiHeart /></Link>
        <Link href="/dm"><FiNavigation /></Link>
      </div>
    </header> */
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
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-800"
          >
            <FiHeart aria-hidden="true" />
          </Link>
          <Link
            href="/dm"
            aria-label="ダイレクトメッセージ"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-800"
          >
            <FiNavigation aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  )
}

export default Header