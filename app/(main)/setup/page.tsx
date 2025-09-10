'use client'
import React, { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import SetProfile, { ProfileData } from '@/components/setprofile'
import type { User } from '@supabase/supabase-js'

/**
 * 新規ユーザー初回セットアップ
 */
const SetupPage = () => {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/signin')
          return
        }
        setUser(user)
        const { data: sess } = await supabase.auth.getSession()
        const accessToken = sess.session?.access_token
        if (!accessToken) {
          throw new Error('アクセストークンが取得できませんでした')
        }
      } catch {
        setError('初期化に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProfileSubmit = async (profileData: ProfileData) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const formattedData = {
        ...profileData,
        birth_date: profileData.birthday &&
          profileData.birthday.year &&
          profileData.birthday.month &&
          profileData.birthday.day
          ? `${profileData.birthday.year}-${profileData.birthday.month.padStart(2, '0')}-${profileData.birthday.day.padStart(2, '0')}`
          : null,
        training_since: profileData.trainingSince &&
          profileData.trainingSince.year &&
          profileData.trainingSince.month
          ? `${profileData.trainingSince.year}-${profileData.trainingSince.month.padStart(2, '0')}-01`
          : null,
        intent_names: profileData.intents || [],
        bodypart_names: profileData.bodyParts || [],
        tag_names: profileData.tags || []
      };

      // 日付の妥当性チェック
      if (formattedData.birth_date) {
        const birthDate = new Date(formattedData.birth_date);
        if (isNaN(birthDate.getTime())) {
          console.error('Invalid birth date format:', formattedData.birth_date);
          alert('生年月日の形式が正しくありません');
          return;
        }
      }

      if (formattedData.training_since) {
        const trainingDate = new Date(formattedData.training_since);
        if (isNaN(trainingDate.getTime())) {
          console.error('Invalid training since date format:', formattedData.training_since);
          alert('トレーニング開始日の形式が正しくありません');
          return;
        }
      }

      console.log('Sending profile data:', formattedData);

      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Profile update failed:', errorData);
        alert(`プロフィール更新に失敗しました: ${errorData.error || 'Unknown error'}`);
        return;
      }

      console.log('Profile updated successfully');
      router.push('/(main)');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('プロフィール更新中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">読み込み中...</div>
  if (error) return (
    <div className="p-6">
      <p className="text-red-500 text-sm mb-4">{error}</p>
      <Button onClick={() => router.refresh()}>再読み込み</Button>
    </div>
  )

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">初期セットアップ</h1>
      <SetProfile
        userId="me"
        onSubmit={handleProfileSubmit}
        onAfterSubmit={() => { router.replace('/'); router.refresh(); }}
      />
    </main>
  )
}

export default SetupPage