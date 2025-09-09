'use client'
import React, { useEffect, useState } from 'react'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * 新規ユーザー初回セットアップ
 */
const SetupPage = () => {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')

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
        const { data: sess } = await supabase.auth.getSession()
        const accessToken = sess.session?.access_token
        if (!accessToken) {
          throw new Error('アクセストークンが取得できませんでした')
        }
        setDisplayName(user.email?.split('@')[0] ?? '')
      } catch {
        setError('初期化に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('ユーザー情報が取得できませんでした')

      const { data: sess2 } = await supabase.auth.getSession()
      const accessToken2 = sess2.session?.access_token
      if (!accessToken2) throw new Error('アクセストークンが取得できませんでした')

      const res = await fetch(`/api/users/me/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken2}` },
        body: JSON.stringify({ display_name: displayName, inited: true })
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`プロフィールの保存に失敗しました (${res.status}) ${text}`)
      }

      router.replace('/')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">表示名</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例: taro" />
        </div>
        <Button type="submit" disabled={!displayName.trim() || loading} className="w-full">保存して開始</Button>
      </form>
    </main>
  )
}

export default SetupPage


