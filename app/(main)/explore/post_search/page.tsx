'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface Post {
  id: string
  user_id: string
  user_name: string
  user_icon: string
  body: string
  location: string
  posted_at: string
  photo_url: string
}

const PostSearchContent = () => {
  const searchParams = useSearchParams()
  const search = searchParams.get('search')
  const [data, setData] = useState<Post[]>([])

  // 投稿検索処理(API実装によって変更する部分)
  useEffect(() => {
    const handleSearch = async () => {
      const result = await fetch(`/api/post/search?search=${search}`)
      const data = await result.json()
      setData(data.data)
    }
    if (search) {
      handleSearch()
    }
  }, [search])

  return (
    <div>
      <h2>投稿検索結果</h2>
      <div>
        {data.map((post: Post) => (
          <div key={post.id}>
            <Image src={post.photo_url} alt={post.body} width={100} height={100} />
            {post.body}
            {post.location}
            {post.posted_at}
          </div>
        ))}
      </div>
    </div>
  )
}

const PostSearch = () => {
  return (
    <Suspense fallback={<div>検索中...</div>}>
      <PostSearchContent />
    </Suspense>
  )
}

export default PostSearch
