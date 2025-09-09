'use client'

import React from 'react'
import { PiHouseLight } from "react-icons/pi";
import { PiHouseFill } from "react-icons/pi";
import { RiSearch2Line, RiSearch2Fill } from "react-icons/ri";
import { FaRegSquarePlus, FaSquarePlus } from "react-icons/fa6";
import { RiUser3Line } from "react-icons/ri";
import { RiUser3Fill } from "react-icons/ri";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient as createBrowserClient } from '@/utils/supabase/client';

const Footer = () => {
  const pathname = usePathname();
  const [profileHref, setProfileHref] = React.useState<string>('/signin');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser()
      .then(({ data: { user } }) => {
        setProfileHref(user ? '/me' : '/signin');
      })
      .catch(() => setProfileHref('/signin'))
      .finally(() => setIsLoading(false));
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === profileHref) {
      return pathname === profileHref ||
        pathname === `${profileHref}/follows` ||
        pathname === `${profileHref}/edit`;
    }
    return pathname === path;
  };

  return (
    <footer className="fixed bottom-0 left-0 w-full h-[10vh] bg-white border-t border-gray-200 flex items-center justify-center z-50 safe-area-inset-bottom">
      <nav role="navigation" aria-label="メインナビゲーション" className="w-full max-w-md">
        <ul className="flex items-center justify-center gap-12 text-4xl">
          {/* Home */}
          <li>
            <Link
              href="/"
              aria-label="ホーム"
              className={`p-3 rounded-lg transition-colors duration-200 focus:outline-none ${isActive('/') ? 'text-[#2C2C2C]' : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              {isActive('/') ? (
                <PiHouseFill aria-hidden="true" />
              ) : (
                <PiHouseLight aria-hidden="true" />
              )}
            </Link>
          </li>

          {/* Explore */}
          <li>
            <Link
              href="/explore"
              aria-label="検索・探索"
              className={`p-3 rounded-lg transition-colors duration-200 focus:outline-none ${isActive('/explore') ? 'text-[#2C2C2C]' : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              {isActive('/explore') ? (
                <RiSearch2Fill aria-hidden="true" />
              ) : (
                <RiSearch2Line aria-hidden="true" />
              )}
            </Link>
          </li>

          {/* Post */}
          <li>
            <Link
              href="/create_post"
              aria-label="新規投稿"
              className={`p-3 rounded-lg transition-colors duration-200 focus:outline-none ${isActive('/create_post') ? 'text-[#2C2C2C]' : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              {isActive('/create_post') ? (
                <FaSquarePlus aria-hidden="true" />
              ) : (
                <FaRegSquarePlus aria-hidden="true" />
              )}
            </Link>
          </li>

          {/* Profile */}
          <li>
            <Link
              href={profileHref}
              aria-label={`プロフィール${isLoading ? '（読み込み中）' : ''}`}
              className={`p-3 rounded-lg transition-colors duration-200 focus:outline-none ${isActive(profileHref) ? 'text-[#2C2C2C]' : 'text-gray-600 hover:text-gray-800'
                } ${isLoading ? 'opacity-50' : ''}`}
            >
              {isActive(profileHref) ? (
                <RiUser3Fill aria-hidden="true" />
              ) : (
                <RiUser3Line aria-hidden="true" />
              )}
            </Link>
          </li>
        </ul >
      </nav >
    </footer >
  )
}

export default Footer