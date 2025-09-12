'use client'
import React from 'react'
import { IoChevronBack } from "react-icons/io5";
import { useRouter } from 'next/navigation';

const Header = () => {
  const router = useRouter();

  return (
    <header className="w-full h-[10vh] flex items-center justify-between relative px-4 pt-2">
      <button className="p-2" onClick={() => router.back()}>
        <IoChevronBack className="text-3xl" />
      </button>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold">プロフィール</h1>
      <div className="w-12"></div> {/* スペーサー */}
    </header>
  )
}

export default Header
