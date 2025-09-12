'use client'
import React from 'react'
import { IoChevronBack, IoSettingsOutline } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface HeaderProps {
  isOwnProfile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isOwnProfile = false }) => {
  const router = useRouter();

  return (
    <header className="w-full h-[10vh] flex items-center justify-between relative px-4 pt-2">
      <button className="p-2" onClick={() => router.back()}>
        <IoChevronBack className="text-3xl" />
      </button>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold">プロフィール</h1>
      <div className="flex items-center">
        {isOwnProfile && (
          <Link href="/settings" className="p-2">
            <IoSettingsOutline className="text-3xl text-gray-600 hover:text-gray-800" />
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header
