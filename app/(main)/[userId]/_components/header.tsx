'use client'
import React from 'react'
import { IoChevronBack } from "react-icons/io5";
import { FaRegAddressCard } from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Header = ({ userId }: { userId: string }) => {
  const router = useRouter();

  return (
    <header className="w-full h-[10vh] flex items-center justify-between relative px-4 pt-2">
      <button className="p-2" onClick={() => router.back()}>
        <IoChevronBack className="text-3xl" />
      </button>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-semibold">プロフィール</h1>
      <div className="text-3xl">
        <Link href={`/${userId}/card`} className="p-2 ">
          <FaRegAddressCard />
        </Link>
      </div>
    </header> 
  )
}

export default Header
