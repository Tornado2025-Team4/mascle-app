'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SubHeader from '@/components/sub-header'

type ApiPhoto = { url: string; thumb_url?: string }
type ApiPostedUser = { display_name?: string; icon_url?: string | null }
type ApiPost = {
  pub_id: string
  posted_user: ApiPostedUser
  posted_at: string | null
  body: string
  tags: Array<string | { name?: string }>
  photos: ApiPhoto[]
  likes_count: number
  comments_count: number
}

const Post = () => {
  const postId = useParams().post_id as string

  const [post, setPost] = useState<ApiPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/posts/${postId}`)
        if (!response.ok) throw new Error('投稿の取得に失敗しました')
        const data: ApiPost = await response.json()
        setPost(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [postId])

  if (loading) return <div className="p-4 text-gray-500">読み込み中...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!post) return <div className="p-4">投稿が見つかりません</div>

  return (
    <div style={{ paddingTop: '1vh' }}>
      <SubHeader title="投稿詳細" />
      <div className="px-4 py-4 space-y-4">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative">
            <Image src={post.posted_user.icon_url ?? '/images/image.png'} alt="icon" fill sizes="40px" className="object-cover" />
          </div>
          <div className="font-semibold">{post.posted_user.display_name ?? 'ユーザー'}</div>
          <div className="ml-auto text-sm text-gray-500">{post.posted_at ?? ''}</div>
        </header>

        <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>

        <div className="grid grid-cols-2 gap-2">
          {post.photos.map((photo, idx) => (
            <Link key={idx} href={`/post/${postId}/${idx + 1}`} className="block w-full aspect-square relative">
              <Image src={photo.url} alt={`photo-${idx + 1}`} fill sizes="50vw" className="object-cover" />
            </Link>
          ))}
        </div>

        <div className="text-sm text-gray-600">いいね {post.likes_count} ・ コメント {post.comments_count}</div>
      </div>
    </div>
  )
}

export default Post
