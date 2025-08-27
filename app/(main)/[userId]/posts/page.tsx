import React from 'react'
import { useParams } from 'next/navigation'

// 仮のデータ
const posts = [
  { id: 1, title: '筋トレ1', content: '筋トレ1の内容' },
  { id: 2, title: '筋トレ2', content: '筋トレ2の内容' },
  { id: 3, title: '筋トレ3', content: '筋トレ3の内容' },
]

const Posts = () => {
  const userId = useParams().userId;
  return (
    <div>
      <h2>投稿一覧</h2>
      <div>
        {posts.map((post) => (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Posts
