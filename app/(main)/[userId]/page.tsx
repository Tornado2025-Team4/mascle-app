import React from 'react'
import { headers } from 'next/headers'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import Header from './_components/header';
import ProfileBasicInfo from './_components/profile-basic-info';
import { FaDumbbell } from 'react-icons/fa';
import Post from '../_components/post';

const Profile = async ({
  params,
}: {
  params: Promise<{
    userId?: string;
  }>;
}) => {
  const resolvedParams = await params;
  const userId = resolvedParams?.userId ?? 'me';

  // 絶対URLと認証ヘッダを準備
  const hdrs = await headers();
  const host = hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const base = `${proto}://${host}`;
  const supabase = await createServerSupabase();
  const { data: sess } = await supabase.auth.getSession();
  const accessToken = sess.session?.access_token;
  const reqHeaders: Record<string, string> = {
    cookie: hdrs.get('cookie') ?? ''
  };
  if (accessToken) reqHeaders.Authorization = `Bearer ${accessToken}`;

  // プロフィール取得
  const profileRes = await fetch(`${base}/api/users/${userId}/profile`, { cache: 'no-store', headers: reqHeaders });
  if (!profileRes.ok) {
    throw new Error('プロフィール取得に失敗しました');
  }
  const profile: {
    pub_id?: string;
    anon_pub_id?: string;
    handle?: string;
    display_name?: string;
    description?: string;
    icon_url?: string;
    birth_date?: string;
    age?: number;
    generation?: number;
    gender?: string;
    registered_since?: string;
    training_since?: string;
    skill_level?: string;
    inited?: boolean;
    tags?: Array<{
      pub_id: string;
      name: string;
    }>;
    intents?: Array<{
      pub_id: string;
      intent: string;
    }>;
    intent_bodyparts?: Array<{
      pub_id: string;
      bodypart: string;
    }>;
    belonging_gyms?: Array<{
      pub_id: string;
      name: string;
      gymchain?: {
        pub_id: string;
        name: string;
        icon_url?: string;
        internal_id?: string;
      };
      photo_url?: string;
      joined_since?: string;
    }>;
    followings_count?: number;
    followers_count?: number;
    posts_count?: number;
  } = await profileRes.json();

  // 匿名モード判定（~で始まるユーザーIDの場合）
  const isAnonymousMode = userId.startsWith('~');

  // ユーザー投稿取得
  const postsRes = await fetch(`${base}/api/posts?user_pub_id=${profile.pub_id ?? userId}`, { cache: 'no-store', headers: reqHeaders });
  const postsJson: Array<{
    pub_id: string;
    posted_user: { display_name: string; icon_url?: string | null };
    body: string;
    tags: Array<string | { name?: string }>;
    photos: Array<{ url: string }>;
    posted_at: string;
    likes_count: number;
    comments_count: number;
  }> = postsRes.ok ? await postsRes.json() : [];

  const userPosts = postsJson.map((p) => ({
    post_id: p.pub_id,
    user_display_name: p.posted_user?.display_name ?? (profile.display_name ?? ''),
    user_icon: p.posted_user?.icon_url ?? (profile.icon_url ?? '/images/image.png'),
    body: p.body ?? '',
    tags: (p.tags ?? []).map((t) => (typeof t === 'string' ? t : (t?.name ? `#${t.name}` : ''))).filter(Boolean) as string[],
    photos: (p.photos ?? []).map((ph) => ({ url: ph.url })),
    posted_at: p.posted_at ?? '',
    like_count: p.likes_count ?? 0,
    comments_count: p.comments_count ?? 0,
  }));

  return (
    <div className="min-h-screen px-[5vw] pb-[13vh]">
      {/* ヘッダー */}
      <Header userId={userId} />

      {/* プロフィール情報セクション */}
      <ProfileBasicInfo isAnonymousMode={isAnonymousMode} profile={profile} />

      {/* ユーザーの投稿一覧 */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-4 px-[5vw] flex items-center gap-2 text-gray-800">
          <FaDumbbell className="text-orange-500" />
          {(profile.display_name ?? '')}の投稿
        </h2>
        <div className="flex flex-col gap-4">
          {userPosts.map((post) => (
            <Post
              key={post.post_id}
              post_id={post.post_id}
              user_display_name={post.user_display_name}
              user_handle={profile.handle || ''}
              user_icon={post.user_icon}
              body={post.body}
              mentions={[]}
              tags={post.tags}
              photos={post.photos}
              posted_at={post.posted_at}
              like_count={post.like_count}
              comments_count={post.comments_count}
              is_liked_by_current_user={false}
              status={undefined}
            />
          ))}
        </div>
      </div>
    </div >
  )
}

export default Profile