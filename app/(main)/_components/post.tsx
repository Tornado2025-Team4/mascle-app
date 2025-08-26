import React from 'react'
import Image from 'next/image'

interface PostProps {
  user: string;
  image: string;
  likes: number;
  caption: string;
  commentsCount: number;
}

const Post = ({ user, image, likes, caption, commentsCount }: PostProps) => {
  return (
    <div>
      <div> {user} </div>
      <div> <Image src={image} alt="post image" width={100} height={100} /> </div>
      <div> {likes} </div>
      <div> {caption} </div>
      <div> {commentsCount} </div> 
    </div>
  )
}

export default Post
