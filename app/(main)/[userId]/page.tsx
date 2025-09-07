import React from 'react'
import Image from 'next/image'
import { headers } from 'next/headers'
import { createClient as createServerSupabase } from '@/utils/supabase/server'
import ProfileSetting from './_components/profile-setting'
import Header from './_components/header';
import Link from 'next/link';
import { FaDumbbell, FaMedal } from 'react-icons/fa';
import { ImTarget, ImClock, ImLocation, ImTrophy } from 'react-icons/im';
import Post from '../_components/post';

const Profile = async ({
  params,
}: {
  params: {
    userId?: string;
  };
}) => {
  const userId = params?.userId ?? 'me';

  // 絶対URLと認証ヘッダを準備
  const hdrs = headers();
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
    display_name?: string;
    description?: string;
    icon_url?: string;
    tags?: Array<{ name: string }>;
    gender?: string;
    age?: number;
    training_since?: string;
    belonging_gyms?: Array<{ name: string }>
    followers_count?: number;
    followings_count?: number;
  } = await profileRes.json();

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
    gym_name: profile.belonging_gyms?.[0]?.name ?? '未設定',
    photos: (p.photos ?? []).map((ph) => ({ url: ph.url })),
    posted_at: p.posted_at ?? '',
    like_count: p.likes_count ?? 0,
    comments_count: p.comments_count ?? 0,
  }));

  return (
    <div className="min-h-screen px-[5vw] pb-[13vh]">
      {/* ヘッダー */}
      <Header userId={userId} />

      {/* プロフィール情報セクション（薄緑背景） */}
      <div className="bg-green-50 px-6 py-4">
        <div className="flex items-start gap-6">
          {/* プロフィール画像とユーザー名 */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex-shrink-0 overflow-hidden relative">
              <Image
                src={profile.icon_url ?? '/images/image.png'}
                alt={`${profile.display_name ?? ''}のプロフィール画像`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold text-center">{profile.display_name ?? ''}</h3>
          </div>

          {/* ユーザー情報と統計 */}
          <div className="flex-1 flex flex-col ml-4">
            <Link href={userId + "/follows"} className="flex items-center justify-center gap-8 mt-2 mb-4">

              <div className="text-center">
                <div className="text-xl font-bold">{profile.followers_count ?? 0}</div>
                <div className="text-sm text-gray-600">フォロワー</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{profile.followings_count ?? 0}</div>
                <div className="text-sm text-gray-600">フォロー</div>
              </div>
            </Link>

            {/* 自己紹介 */}
            <p className="text-gray-700 text-sm leading-relaxed mb-3">{profile.description ?? ''}</p>

            {/* タグ */}
            <div className="flex flex-wrap gap-2">
              {(profile.tags ?? []).map((tag: { name: string }, index: number) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-[13px] rounded-full">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 詳細ユーザー情報セクション（白背景） */}
      <div className="bg-white px-6 py-6 mt-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
          基本情報
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImTarget className="text-blue-500" />
              <span className="text-gray-600">性別</span>
            </div>
            <span className="text-gray-800 font-medium">{profile.gender ?? '未設定'}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <FaMedal className="text-yellow-500" />
              <span className="text-gray-600">年齢</span>
            </div>
            <span className="text-gray-800 font-medium">{profile.age ?? '-'}{profile.age ? '歳' : ''}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImClock className="text-green-500" />
              <span className="text-gray-600">ジム暦</span>
            </div>
            <span className="text-gray-800 font-medium">{profile.training_since ?? '-'}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImLocation className="text-red-500" />
              <span className="text-gray-600">ジム</span>
            </div>
            <span className="text-gray-800 font-medium">{profile.belonging_gyms?.[0]?.name ?? '未設定'}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ImTrophy className="text-purple-500" />
              <span className="text-gray-600">目的</span>
            </div>
            <span className="text-gray-800 font-medium">{(profile.tags ?? [])[0]?.name ?? '未設定'}</span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <FaDumbbell className="text-orange-500" />
              <span className="text-gray-600">鍛える部位</span>
            </div>
            <span className="text-gray-800 font-medium">{(profile.tags ?? []).map(t => t.name).join(' ')}</span>
          </div>
        </div>

        {/* プロフィール編集ボタン */}
        <ProfileSetting userId={userId} />
      </div>

      {/* 筋トレ記録 */}
      <div className="bg-white px-6 py-6 mt-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
          <FaDumbbell className="text-orange-500" />
          筋トレ記録
        </h2>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 h-32 flex items-center justify-center border border-orange-200">
          <div className="text-center">
            <p className="text-gray-500 text-sm">記録表示エリア</p>
            <p className="text-gray-400 text-xs mt-1">最近のトレーニング履歴</p>
          </div>
        </div>
      </div>

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
      </div>
    </div >
  )
}

export default Profile