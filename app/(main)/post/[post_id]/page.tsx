'use client'
import React, { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const post = {
  id: 1,
  title: 'Post 1',
  content: 'Content 1',
  photos: [
    {
      id: 1,
      url: 'https://via.placeholder.com/150',
    },
  ],
  createdAt: '2021-01-01',
  updatedAt: '2021-01-01',
}

const Post = () => {

  // 投稿データを取得
  const postId = useParams().post_id;
  useEffect(() => {
    const fetchPost = async () => {
      const response = await fetch(`/api/posts/${postId}`);
      const data = await response.json();
      console.log(data);
    }
    fetchPost();
  }, [postId]);

  return (
    <div>
      <h1>Post {postId}</h1>
      <p>{post.content}</p>
      <div>
        {post.photos.map((photo) => (
          <Link key={photo.id} href={`/post/${postId}/${photo.id}`}>
            <img src={photo.url} alt={photo.id.toString()} />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Post
