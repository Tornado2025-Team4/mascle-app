'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { FaEdit } from "react-icons/fa";
import Link from 'next/link';

const ProfileSetting = ({
  userId,
}: {
  userId: string;
}) => {
  return (
    <div>
      {/* 自分のプロフィールのみ表示 */}
      {userId === 'me' && (
        <div className="mt-5">
          <Link href={`/me/edit`}>
            <Button className="w-full text-base py-5">
              <FaEdit />
              プロフィールを編集
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default ProfileSetting
