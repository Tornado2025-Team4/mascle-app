import React from 'react'
import Post from './post'

// 仮のデータ
const posts = [
  {
    id: 1,
    user: 'John Doe',
    image: '/images/image.jpg',
    likes: 100,
    caption: 'This is a caption',
    commentsCount: 10
  }
]

const PostList = () => {
  return (
    <div>
      {posts.map((post) => (
        <Post
          key={post.id}
          user={post.user}
          image={post.image}
          likes={post.likes}
          caption={post.caption}
          commentsCount={post.commentsCount}
        />
      ))}
    </div>
  )
}

export default PostList
