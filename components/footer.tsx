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

  React.useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setProfileHref(user ? '/me' : '/signin');
    }).catch(() => setProfileHref('/signin'));
  }, []);
  return (
    <footer className="fixed bottom-0 left-0 w-full h-[10vh] bg-gray-200 flex items-center justify-center z-50">
      <nav aria-label="フッターナビゲーション" className="w-full">
        <ul className="flex items-center justify-center gap-12 text-4xl">
          {/* Home */}
          <li>
            <Link href="/" aria-label="ホーム">
              {pathname === "/" ? (
                <PiHouseFill />
              ) : (
                <PiHouseLight />
              )}
            </Link>
          </li>

          {/* Explore */}
          <li>
            <Link href="/explore" aria-label="検索">
              {pathname === "/explore" ? (
                <RiSearch2Fill />
              ) : (
                <RiSearch2Line />
              )}
            </Link>
          </li>

          {/* Post */}
          <li>
            <Link href="/create_post" aria-label="投稿">
              {pathname === "/create_post" ? (
                <FaSquarePlus />
              ) : (
                <FaRegSquarePlus />
              )}
            </Link>
          </li>

          {/* Profile */}
          <li>
            <Link href={profileHref} aria-label="プロフィール">
              {pathname === profileHref || pathname === `${profileHref}/follows` || pathname === `${profileHref}/edit` ? (
                <RiUser3Fill />
              ) : (
                <RiUser3Line />
              )}
            </Link>
          </li>
        </ul>
      </nav>
    </footer>
  )
}

export default Footer
