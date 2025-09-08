'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'

type ApiPhoto = { url: string; thumb_url?: string }
type ApiPost = {
  pub_id: string
  photos: ApiPhoto[]
}

const PhotoIndex = () => {
  const { post_id, photo_index } = useParams() as { post_id: string; photo_index: string }
  const [post, setPost] = useState<ApiPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/posts/${post_id}`)
        if (!res.ok) throw new Error('投稿の取得に失敗しました')
        const data = await res.json()
        setPost({ pub_id: data.pub_id, photos: data.photos ?? [] })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [post_id])

  const idx = Math.max(0, Number(photo_index) - 1 || 0)
  const photo = post?.photos?.[idx]

  if (loading) return <div className="p-4 text-gray-500">読み込み中...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!post || !photo) return <div className="p-4">画像が見つかりません</div>

  return (
    <div className="w-full h-[80vh] relative bg-black">
      <Image src={photo.url} alt={`photo-${idx + 1}`} fill sizes="100vw" className="object-contain" />
      <div className="absolute bottom-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
        {idx + 1} / {post.photos.length}
      </div>
    </div>
  )
}

export default PhotoIndex
