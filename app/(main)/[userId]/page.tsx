import React from 'react'
import ProfileSetting from './_components/profile-setting'

const Profile = () => {
  return (
    <div>
      <header>
        <h1>Profile</h1>
      </header>

      {/* 自己紹介 */}
      <div>
        <h2>自己紹介</h2>
        <p>こんにちは。</p>
      </div>

      {/* プロフィール詳細 */}
      <div>

      </div>

      {/* プロフィール編集 */}
      <div>
        <ProfileSetting />
      </div>

      {/* 筋トレ記録 */}
      <div>
        <h2>筋トレ記録</h2>
      </div>
    </div>
  )
}

export default Profile
