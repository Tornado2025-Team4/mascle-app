'use client'
import React from 'react'
import { useParams } from 'next/navigation'

const ProfileSetting = () => {
  const userId = useParams().userId;
  return (
    <div>
      {/* 自分のプロフィールのみ表示 */}
      {userId === userId && (
        <div>
          <h2>プロフィール編集</h2>
          <form>
            <div>
              <label htmlFor="name">名前</label>
              <input type="text" id="name" name="name" />
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ProfileSetting
