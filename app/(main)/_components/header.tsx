import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { FiHeart } from "react-icons/fi";
import { FiNavigation } from "react-icons/fi";

const Header = () => {
  return (
    <header className="w-full h-[10vh] flex items-center justify-between px-8 pt-4">
      <Image src="/images/titlelogo.svg" alt="titlelogo" width={90} height={20}/>
      <div className="flex items-center gap-5 text-3xl">
        <Link href="/notification"><FiHeart /></Link>
        <Link href="/dm"><FiNavigation /></Link>
      </div>
    </header>
  )
}

export default Header