"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IoChevronBack, IoTrashOutline, IoCameraOutline } from 'react-icons/io5'
import TodayMenu from './_components/today-menu'
import { Input } from '@/components/ui/input'

const CreatePost = () => {
  const router = useRouter()

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [gym, setGym] = useState<string>('未設定')
  const [gyms, setGyms] = useState<string[]>([])
  const [gymsLoading, setGymsLoading] = useState(false)
  const [gymsError, setGymsError] = useState<string | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'public' | 'followers'>('public')
  const [submitting, setSubmitting] = useState(false)
  // タグ
  const [tagQuery, setTagQuery] = useState('')
  const [tags, setTags] = useState<Array<{ pub_id: string; name: string }>>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)

  // 画像プレビュー生成
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [images])

  // ジム一覧取得
  useEffect(() => {
    const ctrl = new AbortController()
    const loadGyms = async () => {
      try {
        setGymsLoading(true)
        setGymsError(null)
        const res = await fetch('/api/gyms', { signal: ctrl.signal })
        if (!res.ok) throw new Error('ジム一覧の取得に失敗しました')
        const data: unknown = await res.json()
        const names: string[] = Array.isArray(data)
          ? (data as Array<{name?: string; gym_name?: string} | string>).map((g) => (typeof g === 'string' ? g : (g?.name ?? g?.gym_name ?? ''))).filter(Boolean)
          : []
        setGyms(names.length ? names : ['未設定'])
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setGyms(['未設定'])
        setGymsError('ジム一覧の取得に失敗しました')
      } finally {
        setGymsLoading(false)
      }
    }
    loadGyms()
    return () => ctrl.abort()
  }, [])

  // タグ取得（クエリ付き）
  useEffect(() => {
    const ctrl = new AbortController()
    const loadTags = async () => {
      try {
        setTagsLoading(true)
        const qp = new URLSearchParams()
        if (tagQuery) qp.set('name', tagQuery)
        qp.set('limit', '30')
        const res = await fetch(`/api/tags?${qp.toString()}`, { signal: ctrl.signal })
        if (!res.ok) throw new Error('タグ取得に失敗しました')
        const map: Record<string,string> = await res.json()
        const arr = Object.entries(map).map(([pub_id,name])=>({pub_id,name}))
        setTags(arr)
      } catch {
        setTags([])
      } finally {
        setTagsLoading(false)
      }
    }
    loadTags()
    return () => ctrl.abort()
  }, [tagQuery])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const picked = Array.from(e.target.files)
    const next = [...images, ...picked].slice(0, 4)
    setImages(next)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const openFilePicker = () => fileInputRef.current?.click()


  const filesToBase64 = async (files: File[]): Promise<string[]> => {
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )
    return Promise.all(readers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const photos = await filesToBase64(images)
      const payload = {
        body: content,
        // mentions: 未対応
        tags: selectedTagIds,
        photos,
      }
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('投稿に失敗しました')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-gray-200">
        <button className="text-2xl" onClick={() => router.back()}>
          <IoChevronBack />
        </button>
        <h1 className="text-lg font-semibold">投稿</h1>
        <div className="w-6" />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* テキスト入力 */}
        <section>
          <label className="block text-sm font-medium mb-2">本文</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今の気持ちやトレーニング内容を書こう…"
            className="min-h-28"
          />
        </section>

        {/* 公開範囲 */}
        <section>
          <label className="block text-sm font-medium mb-2">公開範囲</label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'followers')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="公開範囲を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">公開</SelectItem>
              <SelectItem value="followers">フォロワーのみ</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* ジム選択 */}
        <section>
          <label className="block text-sm font-medium mb-2">ジムを選択</label>
          <Select value={gym} onValueChange={setGym}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="ジムを選択" />
            </SelectTrigger>
            <SelectContent>
              {gymsLoading ? (
                <SelectItem value={gym}>読み込み中…</SelectItem>
              ) : (
                gyms.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {gymsError && (<p className="mt-1 text-xs text-red-500">{gymsError}</p>)}
        </section>

        {/* タグ選択 */}
        <section>
          <label className="block text-sm font-medium mb-2">タグ</label>
          <div className="flex gap-2 mb-2">
            <Input value={tagQuery} onChange={(e)=>setTagQuery(e.target.value)} placeholder="タグ検索" className="max-w-xs" />
            {tagsLoading && <span className="text-sm text-gray-500">検索中…</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t)=>{
              const active = selectedTagIds.includes(t.pub_id)
              return (
                <button
                  key={t.pub_id}
                  type="button"
                  onClick={()=> setSelectedTagIds((prev)=> active ? prev.filter(id=>id!==t.pub_id) : [...prev, t.pub_id])}
                  className={`px-3 py-1 rounded-full border text-sm ${active? 'bg-black text-white border-black':'bg-white text-black'}`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
          {selectedTagIds.length>0 && (
            <div className="mt-2 text-xs text-gray-500">選択済み: {selectedTagIds.length}件</div>
          )}
        </section>

        {/* 今日のメニュー/種目追加 */}
        <section>
          <TodayMenu
            selectedExercises={selectedExercises}
            onChangeSelected={setSelectedExercises}
          />

          {/* 選択済みの種目 */}
          {selectedExercises.length > 0 && (
            <ul className="mt-3 space-y-2">
              {selectedExercises.map((ex) => (
                <li key={ex} className="flex items-center justify-between px-3 py-2 rounded-lg border">
                  <span className="text-sm">{ex}</span>
                  <button type="button" className="text-gray-500 hover:text-red-500" onClick={() => setSelectedExercises((prev) => prev.filter((n) => n !== ex))}>
                    <IoTrashOutline />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 写真追加 */}
        <section>
          <label className="block text-sm font-medium mb-2">写真の追加（最大4枚）</label>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          <div className="mt-3 grid grid-cols-4 gap-2">
            {/* 追加ボタン */}
            {images.length < 4 && (
              <button
                type="button"
                onClick={openFilePicker}
                className="w-full aspect-square rounded-lg border border-dashed grid place-items-center text-gray-600 hover:bg-gray-50"
                aria-label="写真を追加"
              >
                <IoCameraOutline className="w-7 h-7" />
              </button>
            )}

            {/* プレビュー */}
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="relative w-full aspect-square overflow-hidden rounded-lg border">
                <Image src={src} alt={`preview-${idx}`} fill sizes="25vw" className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 z-10 p-1 rounded-full bg-black/80 text-white hover:bg-black"
                  aria-label="画像を削除"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 送信 */}
        <div className="pt-2 pb-24">
          <Button type="submit" className="w-full" disabled={submitting || (!content.trim() && images.length===0)}>{submitting ? '送信中…' : '投稿する'}</Button>
        </div>
      </form>
    </div>
  )
}

export default CreatePost
