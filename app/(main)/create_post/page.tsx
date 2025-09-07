"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
// import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IoChevronBack, IoTrashOutline, IoCameraOutline } from 'react-icons/io5'
import TodayMenu from './_components/today-menu'

const GYMS = ['エニタイム新宿店', 'エニタイム渋谷店', 'ゴールドジム表参道', '未設定']

const CreatePost = () => {
  const router = useRouter()

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [gym, setGym] = useState<string>('未設定')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'public' | 'followers'>('public')
  const [submitting, setSubmitting] = useState(false)

  // 画像プレビュー生成
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [images])

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
        visibility,
        gym,
        menu: selectedExercises,
        photos,
      }
      const res = await fetch('/api/userPosts', {
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
              {GYMS.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? '送信中…' : '投稿する'}</Button>
        </div>
      </form>
    </div>
  )
}

export default CreatePost
