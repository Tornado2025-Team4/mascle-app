import React from 'react'
import Post from './post'

// 仮のデータ
const posts = [
  {
    id: 1,
    user_id: '101',
    user_display_name: 'zones_cor',
    user_icon: '/images/image.png',
    body: '明日は腕を頑張ります！',
    tags: ['#筋トレ'],
    gym_name: 'エニタイム帝京大学前店',
    like_count: 10,
    comments_count: 10,
    photos: [
      {
        url: "/images/photo1.jpg",
      },
      {
        url: "/images/photo2.jpg",
      }
    ],
    posted_at: '2021-01-01',
  },
  {
    id: 2,
    user_id: '102',
    user_display_name: 'zones_cor',
    user_icon: '/images/image.png',
    body: '明日は腕を頑張ります！',
    tags: ['#筋トレ #ディープスクワット'],
    gym_name: 'エニタイム帝京大学前店',
    like_count: 10,
    comments_count: 10,
    photos: [
      {
        url: "/images/photo1.jpg",
      },
      {
        url: "/images/photo2.jpg",
      },
      {
        url: "/images/photo1.jpg",
      },
      {
        url: "/images/photo2.jpg",
      },
    ],
    posted_at: '2022-01-01',
  },
]

const PostList = () => {
  return (
    <div className="flex flex-col gap-4 px-[5vw] pt-[3vh] pb-[13vh]">
      {posts.map((post) => (
        <Post
          key={post.id}
          post_id={post.id}
          user_display_name={post.user_display_name}
          user_icon={post.user_icon}
          body={post.body}
          tags={post.tags}
          gym_name={post.gym_name}
          photos={post.photos}
          posted_at={post.posted_at}
          like_count={post.like_count}
          comments_count={post.comments_count}
        />
      ))}
    </div>
  )
}

export default PostList
