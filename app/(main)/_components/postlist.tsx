'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Post from './post'

interface ApiPost {
  pub_id: string;
  posted_user?: {
    handle?: string;
    display_name?: string;
    description?: string | null;
    tags: Array<{ pub_id: string; name: string }>;
    skill_level?: string | null;
    followings_count?: number;
    followers_count?: number;
    profile_icon_url?: string;
  };
  body: string;
  mentions: Array<{
    target_user: {
      handle: string;
      display_name?: string;
      description?: string | null;
      tags: Array<{ pub_id: string; name: string }>;
      icon_rel_id?: string;
      icon_name?: string;
      skill_level?: string | null;
      followings_count?: number;
      followers_count?: number;
    };
    offset: number;
  }>;
  tags: Array<{ pub_id: string; name: string }>;
  photos: Array<{ url: string; thumb_url?: string }>;
  posted_at: string;
  likes_count: number;
  comments_count: number;
  status?: { pub_id: string } | null;
}

interface ProcessedPost {
  post_id: string;
  user_display_name: string;
  user_handle: string;
  user_icon: string;
  body: string;
  mentions: Array<{
    target_user: {
      handle: string;
      display_name?: string;
    };
    offset: number;
  }>;
  tags: string[];
  photos: Array<{
    url: string;
    thumb_url?: string;
  }>;
  posted_at: string;
  like_count: number;
  comments_count: number;
  is_liked_by_current_user: boolean;
  status?: {
    pub_id: string;
  } | undefined;
}

const PostList = () => {
  const [posts, setPosts] = useState<ProcessedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const fetchPosts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const currentOffset = isLoadMore ? offsetRef.current : 0;
      const postsRes = await fetch(`/api/posts?following=true&limit=20&offset=${currentOffset}`);

      if (!postsRes.ok) {
        throw new Error('投稿取得に失敗しました');
      }

      const allPosts: ApiPost[] = await postsRes.json();

      if (!Array.isArray(allPosts)) {
        setHasMore(false);
        return;
      }

      const processedPosts = allPosts.map((p: ApiPost): ProcessedPost => ({
        post_id: p.pub_id,
        user_display_name: p.posted_user?.display_name ?? 'ユーザー',
        user_handle: (p.posted_user?.handle ?? '').replace(/^@+/, ''),
        user_icon: p.posted_user?.profile_icon_url ?? '/images/image.png',
        body: p.body ?? '',
        mentions: (p.mentions ?? []).map(m => ({
          target_user: {
            handle: m.target_user.handle,
            ...(m.target_user.display_name && { display_name: m.target_user.display_name })
          },
          offset: m.offset
        })),
        tags: (p.tags ?? []).map(tag => tag.name),
        photos: (p.photos ?? []).map((ph) => ({
          url: ph.url,
          ...(ph.thumb_url && { thumb_url: ph.thumb_url })
        })),
        posted_at: p.posted_at ?? '',
        like_count: p.likes_count ?? 0,
        comments_count: p.comments_count ?? 0,
        is_liked_by_current_user: false, // APIから削除されたため固定でfalse
        status: p.status || undefined
      }));

      if (isLoadMore) {
        setPosts(prev => [...prev, ...processedPosts]);
      } else {
        setPosts(processedPosts);
      }

      offsetRef.current = currentOffset + processedPosts.length;
      setHasMore(processedPosts.length === 20);

    } catch (error) {
      console.error('Error fetching following posts:', error);
      setError('投稿の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []); // 依存関係を空にして、初回のみの実行に制限

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchPosts(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-2 pt-2 pb-16">
      {posts.map((post) => (
        <Post
          key={post.post_id}
          post_id={post.post_id}
          user_display_name={post.user_display_name}
          user_handle={post.user_handle}
          user_icon={post.user_icon}
          body={post.body}
          mentions={post.mentions}
          tags={post.tags}
          photos={post.photos}
          posted_at={post.posted_at}
          like_count={post.like_count}
          comments_count={post.comments_count}
          is_liked_by_current_user={post.is_liked_by_current_user}
          status={post.status}
        />
      ))}

      {posts.length === 0 && (
        <div className="text-center text-sm text-gray-500">
          フォローしているユーザーの投稿がありません
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                読み込み中...
              </div>
            ) : (
              'さらに読み込む'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default PostList