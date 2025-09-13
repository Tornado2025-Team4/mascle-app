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

  const handleProfileSubmit = async (profileData: ProfileData & { iconFile?: File | null }) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // ファイルをBase64に変換する関数
      const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // 名前からIDへの変換ヘルパー関数
      const convertNamesToIds = async (endpoint: string, names: string[]): Promise<string[]> => {
        if (names.length === 0) return [];

        try {
          const response = await fetch(`${endpoint}?limit=1000`);
          if (response.ok) {
            const data = await response.json();
            // APIレスポンスの形式に応じて調整
            const nameToIdMap = Object.fromEntries(
              Object.entries(data).map(([id, name]) => [name, id])
            );
            return names.map(name => nameToIdMap[name]).filter(Boolean);
          }
        } catch (error) {
          console.error(`Failed to convert names to IDs for ${endpoint}:`, error);
        }
        return [];
      };

      // 日付の検証と変換を行うヘルパー関数
      const formatBirthDate = (birthday?: { year?: string; month?: string; day?: string }) => {
        // 空の値や不完全な日付の場合はnullを返す
        if (!birthday?.year || !birthday?.month || !birthday?.day) {
          return null;
        }

        // 空文字列の場合もnullを返す
        if (birthday.year.trim() === '' || birthday.month.trim() === '' || birthday.day.trim() === '') {
          return null;
        }

        const year = parseInt(birthday.year, 10);
        const month = parseInt(birthday.month, 10);
        const day = parseInt(birthday.day, 10);

        // 基本的な数値チェック
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
          return null;
        }

        // 範囲チェック
        if (year < 1900 || year > new Date().getFullYear()) {
          return null;
        }
        if (month < 1 || month > 12) {
          return null;
        }
        if (day < 1 || day > 31) {
          return null;
        }

        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        // 実際に有効な日付かチェック
        const testDate = new Date(dateStr);
        if (testDate.getFullYear() !== year ||
          testDate.getMonth() + 1 !== month ||
          testDate.getDate() !== day) {
          return null;
        }

        return dateStr;
      };

      const formatTrainingSince = (trainingSince?: { year?: string; month?: string }) => {
        // 空の値や不完全な日付の場合はnullを返す
        if (!trainingSince?.year || !trainingSince?.month) {
          return null;
        }

        // 空文字列の場合もnullを返す
        if (trainingSince.year.trim() === '' || trainingSince.month.trim() === '') {
          return null;
        }

        const year = parseInt(trainingSince.year, 10);
        const month = parseInt(trainingSince.month, 10);

        // 基本的な数値チェック
        if (isNaN(year) || isNaN(month)) {
          return null;
        }

        // 範囲チェック
        if (year < 1900 || year > new Date().getFullYear()) {
          return null;
        }
        if (month < 1 || month > 12) {
          return null;
        }

        return `${year}-${month.toString().padStart(2, '0')}-01`;
      };

      const formattedData: Record<string, unknown> = {
        display_name: profileData.displayName,
        description: profileData.bio,
        birth_date: formatBirthDate(profileData.birthday),
        gender: profileData.gender,
        training_since: formatTrainingSince(profileData.trainingSince),
        tags: await convertNamesToIds('/api/tags', profileData.tags || []),
        intents: await convertNamesToIds('/api/intents', profileData.intents || []),
        intent_bodyparts: await convertNamesToIds('/api/bodyparts', profileData.bodyParts || []),
        belonging_gyms: (profileData.gyms || []).map(gym => gym.pub_id)
      };

      // アイコンがある場合のみ追加
      if (profileData.iconFile) {
        formattedData.icon = await convertFileToBase64(profileData.iconFile);
      }

      // undefinedやnullや空文字列の値を除外
      Object.keys(formattedData).forEach(key => {
        const value = formattedData[key];
        if (value === undefined || value === null ||
          (typeof value === 'string' && value.trim() === '')) {
          delete formattedData[key];
        }
      });

      console.log('Sending profile data:', formattedData);

      // ハンドルを先に更新（@を付けて送信）
      if (profileData.handle && profileData.handle.trim() !== '') {
        const handleWithAt = profileData.handle.startsWith('@') ? profileData.handle : `@${profileData.handle}`;
        const handleResponse = await fetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ handle: handleWithAt })
        });

        if (!handleResponse.ok) {
          const errorData = await handleResponse.json();
          console.error('Handle update failed:', errorData);
          alert(`ハンドル更新に失敗しました: ${errorData.message || 'Unknown error'}`);
          return;
        }
      }

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
      // プロフィール更新後、少し待ってからリダイレクト（middlewareキャッシュ更新のため）
      setTimeout(() => {
        router.replace('/'); // pushではなくreplaceを使用してback履歴をクリア
      }, 500);
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
    <>
      <style jsx global>{`
        footer {
          display: none !important;
        }
      `}</style>
      <main className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-xl font-bold">セットアップ</h1>
        <SetProfile
          userId="me"
          onSubmit={handleProfileSubmit}
          onAfterSubmit={() => {
            console.log('Setup completed successfully');
          }}
        />
      </main>
    </>
  )
}

export default SetupPage