'use client'

import React from 'react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel"

import { BsThreeDots, BsHeart, BsChat } from "react-icons/bs";
import { ImFire } from "react-icons/im";
import { FaRegHandshake } from "react-icons/fa";
import Link from 'next/link';

interface PostProps {
  post_id: number;
  user_display_name: string;
  user_icon: string;
  body: string;
  tags: string[];
  gym_name: string;
  photos: {
    url: string;
  }[];
  posted_at: string;
  like_count: number;
  comments_count: number;
}

const Post = ({ post_id, user_display_name, user_icon, body, tags, gym_name, photos, posted_at, like_count, comments_count }: PostProps) => {
  return (
    <div>
      <header className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"> <Image src={user_icon} alt="post image" width={40} height={40} className="rounded-full" /> </div>
          <div className="flex flex-col">
            <h2> {user_display_name} </h2>
            <span> {gym_name} </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-2xl cursor-pointer px-3"> <BsThreeDots />
        </div>
      </header>
      <Carousel>
        <CarouselContent>
          {photos.map((photo, index) => (
            <CarouselItem key={index}>
              <Link href={`/post/${post_id}/${index + 1}`} className="p-1">
                <Image
                  src={photo.url}
                  alt="post image"
                  width={400}
                  height={400}
                  className="w-full h-auto object-contain"
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots />
      </Carousel>

      <Link
        href={`/post/${post_id}`}
        aria-label={`${user_display_name}の投稿詳細`}
      >
        <div
          className="flex items-center gap-4 text-2xl px-5 pt-3"
          onClick={e => e.preventDefault()}
        >
          <button
            className="flex items-center gap-1 cursor-pointer hover:scale-110 transition-all duration-300"
            tabIndex={0}
            type="button"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              // ここにlikeの処理を追加
            }}
            aria-label="いいね"
          >
            <ImFire />
            {like_count}
          </button>

          <button
            className="flex items-center gap-1 cursor-pointer hover:scale-110 transition-all duration-300"
            tabIndex={0}
            type="button"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              // ここにコメントの処理を追加
            }}
            aria-label="コメント"
          >
            <BsChat />
            {comments_count}
          </button>

          <button
            className="flex items-center gap-2 text-4xl cursor-pointer hover:scale-110 transition-all duration-300"
            tabIndex={0}
            type="button"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              // ここにハンドシェイクの処理を追加
            }}
            aria-label="ハンドシェイク"
          >
            <FaRegHandshake />
          </button>
        </div>

        <div className="px-5 pt-1">
          <div>{body}</div>
          <div>
            {tags.map((tag) => (
              <span key={tag}>{tag} </span>
            ))}
          </div>
          <div>{posted_at}</div>
        </div>
      </Link>
    </div>
  )
}

export default Post
