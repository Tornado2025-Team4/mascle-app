import React from 'react'
import Post from './post'

async function fetchPosts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/posts`, {
      // RSCのキャッシュ戦略（最新優先）
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('投稿一覧の取得に失敗しました');
    // APIスキーマに合わせた形へ変換
    const data: Array<{
      pub_id: string;
      posted_user: { display_name: string; icon_url?: string | null };
      body: string;
      tags: Array<string | { name?: string }>;
      photos: Array<{ url: string }>;
      posted_at: string;
      likes_count: number;
      comments_count: number;
    }> = await res.json();

    return data.map((p) => ({
      post_id: p.pub_id,
      user_display_name: p.posted_user?.display_name ?? 'ユーザー',
      user_icon: p.posted_user?.icon_url ?? '/images/image.png',
      body: p.body ?? '',
      // タグは表示用に文字列化
      tags: (p.tags ?? []).map((t) => (typeof t === 'string' ? t : (t?.name ? `#${t.name}` : ''))).filter(Boolean) as string[],
      gym_name: '',
      photos: (p.photos ?? []).map((ph) => ({ url: ph.url })),
      posted_at: p.posted_at ?? '',
      like_count: p.likes_count ?? 0,
      comments_count: p.comments_count ?? 0,
    }));
  } catch {
    return [] as Array<{
      post_id: string;
      user_display_name: string;
      user_icon: string;
      body: string;
      tags: string[];
      gym_name: string;
      photos: { url: string }[];
      posted_at: string;
      like_count: number;
      comments_count: number;
    }>;
  }
}

const PostList = async () => {
  const posts = await fetchPosts();
  return (
    <div className="flex flex-col gap-4 px-[5vw] pt-[3vh] pb-[13vh]">
      {posts.map((post) => (
        <Post
          key={post.post_id}
          post_id={post.post_id}
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
      {posts.length === 0 && (
        <div className="text-center text-sm text-gray-500">投稿がありません</div>
      )}
    </div>
  )
}

export default PostList

/* >! 取り込むか検討中2

import React from 'react'
import Post from './post'

type PostData = {
  post_id: string;
  user_display_name: string;
  user_icon: string;
  body: string;
  tags: string[];
  gym_name: string;
  photos: { url: string }[];
  posted_at: string;
  like_count: number;
  comments_count: number;
};

type ApiPost = {
  pub_id: string;
  posted_user: { display_name: string; icon_url?: string | null };
  body: string;
  tags: Array<string | { name?: string }>;
  photos: Array<{ url: string }>;
  posted_at: string;
  likes_count: number;
  comments_count: number;
};

async function fetchPosts(): Promise<PostData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is not defined');
      return [];
    }

    const res = await fetch(`${baseUrl}/api/posts`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch posts: ${res.status} ${res.statusText}`);
      throw new Error(`投稿一覧の取得に失敗しました: ${res.status}`);
    }

    const data: ApiPost[] = await res.json();

    if (!Array.isArray(data)) {
      console.error('API response is not an array:', data);
      return [];
    }

    return data.map((p) => ({
      post_id: p.pub_id || '',
      user_display_name: p.posted_user?.display_name || 'ユーザー',
      user_icon: p.posted_user?.icon_url || '/images/image.png',
      body: p.body || '',
      tags: (p.tags || [])
        .map((t) => (typeof t === 'string' ? t : (t?.name ? `#${t.name}` : '')))
        .filter(Boolean) as string[],
      gym_name: '',
      photos: (p.photos || []).map((ph) => ({ url: ph.url || '' })),
      posted_at: p.posted_at || '',
      like_count: p.likes_count || 0,
      comments_count: p.comments_count || 0,
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

const PostList = async () => {
  const posts = await fetchPosts();

  return (
    <section aria-label="投稿一覧" className="flex flex-col gap-4 px-[5vw] pt-[3vh] pb-[13vh]">
      {posts.length > 0 ? (
        posts.map((post) => (
          <Post
            key={post.post_id}
            post_id={post.post_id}
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
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">投稿がありません</p>
          <p className="text-gray-400 text-xs mt-2">最初の投稿をしてみませんか？</p>
        </div>
      )}
    </section>
  )
}

export default PostList

*/