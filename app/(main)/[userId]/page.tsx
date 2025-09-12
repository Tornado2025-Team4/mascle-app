'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from './_components/header';
import ProfileBasicInfo from './_components/profile-basic-info';
import Post from '../_components/post';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IoTimeOutline, IoLocationOutline } from 'react-icons/io5';

interface Profile {
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
  is_followed_by_current_user?: boolean;
}

interface PostData {
  pub_id: string;
  posted_user: { display_name: string; icon_url?: string | null };
  body: string;
  mentions: Array<{
    target_user: {
      handle: string;
      display_name?: string;
    };
    offset: number;
  }>;
  tags: Array<string | { name?: string }>;
  photos: Array<{ url: string }>;
  posted_at: string;
  likes_count: number;
  comments_count: number;
}

interface TrainingHistory {
  pub_id: string;
  started_at: string;
  finished_at?: string | null;
  gym?: {
    pub_id: string;
    name: string;
    gymchain?: {
      name: string;
    };
  } | null;
  partners: Array<{
    pub_id: string;
    handle: string;
    display_name?: string;
  }>;
  menus: Array<{
    menu: {
      pub_id: string;
      name: string;
      bodypart?: {
        pub_id: string;
        name: string;
      };
    };
    sets?: Array<{
      weight?: number;
      reps?: number;
    }>;
  }>;
  menus_cardio: Array<{
    menu: {
      pub_id: string;
      name: string;
    };
    duration?: string;
    distance?: number;
  }>;
}

const Profile: React.FC = () => {
  const params = useParams();
  const rawUserId = (params.userId as string) ?? 'me';
  const userId = decodeURIComponent(rawUserId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'records'>('posts');
  const [currentUserHandle, setCurrentUserHandle] = useState<string | null>(null);

  // ユーザーIDが@か~で始まっているかチェック
  const isValidUserId = userId === 'me' || userId.startsWith('@') || userId.startsWith('~');

  // 匿名モード判定（~で始まるユーザーIDの場合）
  const isAnonymousMode = userId.startsWith('~');

  // 自分のプロフィールかどうかを判定
  const isOwnProfile = userId === 'me' || (currentUserHandle && userId === currentUserHandle) || false;

  useEffect(() => {
    // 現在のユーザー情報を取得
    const fetchCurrentUser = async () => {
      try {
        const currentUserRes = await fetch('/api/users/me/profile');
        if (currentUserRes.ok) {
          const currentUserData = await currentUserRes.json();
          setCurrentUserHandle(currentUserData.handle);
        }
      } catch (error) {
        console.error('現在のユーザー情報取得エラー:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // 無効なユーザーIDの場合は何もしない
    if (!isValidUserId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // プロフィール取得
        const profileRes = await fetch(`/api/users/${userId}/profile`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();

          // フォロー状態をチェック（自分以外のプロフィールの場合）
          let isFollowed = false;
          if (userId !== 'me' && !isAnonymousMode) {
            try {
              const followingsRes = await fetch(`/api/users/me/rel/followings`);
              if (followingsRes.ok) {
                const followingsData = await followingsRes.json();
                isFollowed = followingsData.some((user: { pub_id: string }) => user.pub_id === profileData.pub_id);
              }
            } catch (error) {
              console.error('フォロー状態取得エラー:', error);
            }
          }

          setProfile({
            ...profileData,
            is_followed_by_current_user: isFollowed
          });

          // 匿名モードの場合は投稿とトレーニング記録を取得しない
          if (!isAnonymousMode) {
            // 投稿取得
            const postsRes = await fetch(`/api/posts?posted_user_pub_id=${profileData.pub_id ?? userId}`);
            if (postsRes.ok) {
              const postsData = await postsRes.json();
              setPosts(postsData);
            }

            // トレーニング記録取得（ステータスIDリストを取得）
            const statusListRes = await fetch(`/api/users/${userId}/status?limit=20`);
            if (statusListRes.ok) {
              const statusList = await statusListRes.json();

              // 各ステータスの詳細を取得
              const trainingPromises = statusList.map(async (statusItem: { pub_id: string }) => {
                const detailRes = await fetch(`/api/users/${userId}/status/${statusItem.pub_id}`);
                if (detailRes.ok) {
                  return await detailRes.json();
                }
                return null;
              });

              const trainingDetails = await Promise.all(trainingPromises);
              const validTrainingData = trainingDetails.filter(Boolean) as TrainingHistory[];
              setTrainingHistory(validTrainingData);
            }
          }
        } else {
          if (profileRes.status === 404) {
            console.log('ユーザーが見つかりません');
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isValidUserId, isAnonymousMode]);

  // 無効なユーザーIDの場合は404を表示
  if (!isValidUserId) {
    return (
      <div className="min-h-screen px-[5vw] pb-[13vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">404 - ページが見つかりません</h1>
          <p className="text-gray-600">指定されたユーザーは存在しません。</p>
        </div>
      </div>
    );
  }  // 最新の未完了トレーニングがあるかチェック
  const hasActiveTraining = () => {
    return trainingHistory &&
      trainingHistory.length > 0 &&
      trainingHistory[0].finished_at === null;
  };

  // 時刻フォーマット
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ジム名フォーマット
  const formatGymName = (gym: TrainingHistory['gym']) => {
    if (!gym) return 'ジム未設定';
    return gym.gymchain ? `${gym.gymchain.name} - ${gym.name}` : gym.name;
  };

  // メニュー名の取得
  const getMenuNames = (history: TrainingHistory) => {
    const regularMenus = (history.menus || []).map(item => item.menu.name);
    const cardioMenus = (history.menus_cardio || []).map(item => item.menu.name);
    return [...regularMenus, ...cardioMenus];
  };

  // トレーニング時間の計算
  const calculateTrainingDuration = (startedAt: string, finishedAt?: string | null) => {
    if (!finishedAt) return null;
    const start = new Date(startedAt);
    const finish = new Date(finishedAt);
    const diffMinutes = Math.round((finish.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
  };

  const handleFollowToggle = async () => {
    if (!profile || userId === 'me') return;

    try {
      const action = profile.is_followed_by_current_user ? 'unfollow' : 'follow';

      const res = await fetch(`/api/users/me/rel/followings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          target_user_pub_id: profile.pub_id
        })
      });

      if (res.ok) {
        // フォロー状態を即座に更新
        setProfile(prev => prev ? {
          ...prev,
          is_followed_by_current_user: !prev.is_followed_by_current_user
        } : null);
      } else {
        console.error('フォロー/アンフォロー失敗:', res.status);
      }
    } catch (error) {
      console.error('フォロー/アンフォローエラー:', error);
    }
  }; if (loading) {
    return (
      <div className="min-h-screen px-[5vw] pb-[13vh] flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const userPosts = posts.map((p) => ({
    post_id: p.pub_id,
    user_display_name: p.posted_user?.display_name ?? (profile?.display_name ?? ''),
    user_icon: p.posted_user?.icon_url ?? (profile?.icon_url ?? '/images/image.png'),
    body: p.body ?? '',
    mentions: (p.mentions || []).map(mention => ({
      target_user: {
        handle: mention.target_user?.handle || '',
        display_name: mention.target_user?.display_name || ''
      },
      offset: mention.offset || 0
    })),
    tags: (p.tags ?? []).map((t) => (typeof t === 'string' ? t : (t?.name ? `#${t.name}` : ''))).filter(Boolean) as string[],
    photos: (p.photos ?? []).map((ph) => ({ url: ph.url })),
    posted_at: p.posted_at ?? '',
    like_count: p.likes_count ?? 0,
    comments_count: p.comments_count ?? 0,
  }));

  return (
    <div className="min-h-screen px-[5vw] pb-[13vh]">
      {/* ヘッダー */}
      <Header isOwnProfile={isOwnProfile} />

      {/* プロフィール情報セクション */}
      <ProfileBasicInfo
        isAnonymousMode={isAnonymousMode}
        isOwnProfile={isOwnProfile}
        profile={profile}
        userId={userId}
        onFollowToggle={handleFollowToggle}
        activeTraining={hasActiveTraining() ? trainingHistory[0] : null}
      />

      {/* タブコンテンツ */}
      {!isAnonymousMode && (
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'posts' | 'records')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">投稿</TabsTrigger>
              <TabsTrigger value="records">記録</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              <div className="flex flex-col gap-4">
                {userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <Post
                      key={post.post_id}
                      post_id={post.post_id}
                      user_display_name={post.user_display_name}
                      user_handle={profile?.handle || ''}
                      user_icon={post.user_icon}
                      body={post.body}
                      mentions={post.mentions}
                      tags={post.tags}
                      photos={post.photos}
                      posted_at={post.posted_at}
                      like_count={post.like_count}
                      comments_count={post.comments_count}
                      is_liked_by_current_user={false}
                      status={undefined}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    投稿がありません
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="records" className="mt-4">
              <div className="space-y-4">
                {trainingHistory.length > 0 ? (
                  trainingHistory.map((history) => (
                    <div
                      key={history.pub_id}
                      className="bg-white rounded-lg p-4 shadow-sm border"
                    >
                      <div className="space-y-3">
                        {/* 基本情報 */}
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <IoTimeOutline className="w-4 h-4" />
                            <span>開始: {formatTime(history.started_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IoTimeOutline className="w-4 h-4" />
                            <span>終了: {history.finished_at ? formatTime(history.finished_at) : '未終了'}</span>
                          </div>
                          {history.finished_at && (
                            <div className="text-sm text-blue-600 font-medium">
                              トレーニング時間: {calculateTrainingDuration(history.started_at, history.finished_at)}
                            </div>
                          )}
                        </div>

                        {/* ジム情報 */}
                        <div className="flex items-center gap-2 text-sm">
                          <IoLocationOutline className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {formatGymName(history.gym)}
                          </span>
                        </div>

                        {/* パートナー */}
                        {history.partners && history.partners.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">一緒にトレーニング: </span>
                            {history.partners.map((partner, index) => (
                              <span key={`${history.pub_id}-partner-${index}`}>
                                <a href={`/${partner.handle}`} className="text-blue-600 hover:underline">
                                  {partner.handle}
                                </a>
                                {index < history.partners.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* メニュー */}
                        {getMenuNames(history).length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">メニュー: </span>
                            <span className="text-gray-600">{getMenuNames(history).join(', ')}</span>
                          </div>
                        )}

                        {/* セット詳細 */}
                        {history.menus && history.menus.length > 0 && (
                          <div className="space-y-2">
                            {history.menus.map((menuItem, index) => (
                              <div key={`${history.pub_id}-menu-${index}`} className="text-sm">
                                <div className="font-medium text-gray-700">{menuItem.menu.name}</div>
                                {menuItem.sets && menuItem.sets.length > 0 && (
                                  <div className="text-xs text-gray-500 ml-2">
                                    {menuItem.sets.map((set, setIndex) => (
                                      <span key={setIndex}>
                                        {set.weight ? `${set.weight}kg` : ''}
                                        {set.weight && set.reps ? ' × ' : ''}
                                        {set.reps ? `${set.reps}回` : ''}
                                        {setIndex < menuItem.sets!.length - 1 ? ', ' : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 有酸素メニュー */}
                        {history.menus_cardio && history.menus_cardio.length > 0 && (
                          <div className="space-y-2">
                            {history.menus_cardio.map((cardioItem, index) => (
                              <div key={`${history.pub_id}-cardio-${index}`} className="text-sm">
                                <div className="font-medium text-gray-700">{cardioItem.menu.name}</div>
                                <div className="text-xs text-gray-500 ml-2">
                                  {cardioItem.duration && `時間: ${cardioItem.duration}`}
                                  {cardioItem.duration && cardioItem.distance && ', '}
                                  {cardioItem.distance && `距離: ${cardioItem.distance}km`}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    トレーニング記録がありません
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* 匿名モードの場合のメッセージ */}
      {isAnonymousMode && (
        <div className="mt-6 text-center py-8 text-gray-500">
          <p>匿名プロフィールでは、投稿やトレーニング記録は表示されません。</p>
        </div>
      )}
    </div>
  );
};

export default Profile;