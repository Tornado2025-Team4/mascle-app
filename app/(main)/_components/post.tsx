'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { BsChat } from "react-icons/bs"
import { ImFire } from "react-icons/im"
import { FaRegHandshake } from "react-icons/fa"

interface Comment {
  pub_id: string;
  body: string;
  posted_at: string;
  posted_user: {
    pub_id: string;
    display_name: string;
    handle: string;
    profile_icon_url?: string;
  };
}

interface StatusDetails {
  pub_id: string;
  user_pub_id: string;
  started_at: string;
  finished_at?: string | null;
  is_auto_detected: boolean;
  gym?: {
    pub_id: string;
    name: string;
    photo_url?: string;
    gymchain?: {
      pub_id: string;
      name: string;
      icon_url?: string;
      internal_id?: string;
    };
  } | null;
  partners: Array<{
    pub_id: string;
    handle: string;
    display_name?: string;
    description?: string;
    tags: Array<{
      pub_id: string;
      name: string;
    }>;
    icon_url?: string;
    skill_level?: string;
    followings_count?: number;
    followers_count?: number;
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
    sets: Array<{
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

interface PostProps {
  post_id: string | number;
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

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// メンション処理：bodyからメンション文字列が削除されているため、offset位置に挿入
const processBodyWithMentions = (body: string, mentions: Array<{ target_user: { handle: string; display_name?: string }; offset: number }>) => {
  if (!mentions || mentions.length === 0 || !body) {
    return <span>{body}</span>;
  }

  // メンションを逆順でソート（後ろから処理して位置がずれないようにする）
  const sortedMentions = [...mentions].sort((a, b) => b.offset - a.offset);

  let processedBody = body;
  const linkMap: { [key: string]: React.ReactElement } = {};

  // 各メンションを後ろから処理
  sortedMentions.forEach((mention, index) => {
    // データ構造の安全性チェック
    const targetUser = mention.target_user;
    if (!targetUser || !targetUser.handle) {
      return;
    }

    const handle = targetUser.handle.replace(/^@+/, ''); // @記号を除去
    const placeholder = `__MENTION_${index}__`;

    // offset位置にプレースホルダーを挿入
    const beforeMention = processedBody.slice(0, mention.offset);
    const afterMention = processedBody.slice(mention.offset);
    processedBody = beforeMention + placeholder + afterMention;

    // リンク要素を保存（@の後にはハンドルネームを表示）
    linkMap[placeholder] = (
      <Link
        key={`mention-${handle}-${index}`}
        href={`/${handle}`}
        className="text-blue-500 hover:underline"
      >
        @{handle}
      </Link>
    );
  });

  // プレースホルダーを分割して最終結果を作成
  const parts = processedBody.split(/(__MENTION_\d+__)/);
  const result: (string | React.ReactElement)[] = parts.map((part) => {
    if (linkMap[part]) {
      return linkMap[part];
    }
    return part;
  });

  return <span>{result}</span>;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function Post({
  post_id,
  user_display_name,
  user_handle,
  user_icon,
  body,
  mentions,
  tags,
  photos,
  posted_at,
  like_count,
  comments_count,
  is_liked_by_current_user,
  status
}: PostProps) {
  const [isLiked, setIsLiked] = useState(is_liked_by_current_user);
  const [likeCount, setLikeCount] = useState(like_count);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [statusDetails, setStatusDetails] = useState<StatusDetails | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/posts/${post_id}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [post_id]);

  const fetchStatusDetails = useCallback(async () => {
    if (!status?.pub_id) return;

    try {
      // 適切なAPIエンドポイントを使用（ユーザーハンドルとステータスIDが必要）
      const response = await fetch(`/api/users/${'@' + user_handle}/status/${status.pub_id}`);
      if (response.ok) {
        const statusData = await response.json();
        setStatusDetails(statusData);
      }
    } catch (error) {
      console.error('Error fetching status details:', error);
    }
  }, [status?.pub_id, user_handle]); useEffect(() => {
    if (showCommentPopup) {
      fetchComments();
    }
  }, [showCommentPopup, fetchComments]);

  useEffect(() => {
    if (showStatusPopup && status?.pub_id) {
      fetchStatusDetails();
    }
  }, [showStatusPopup, fetchStatusDetails, status?.pub_id]);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post_id}/likes`, {
        method: isLiked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`/api/posts/${post_id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: commentText }),
      });

      if (response.ok) {
        setCommentText('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handlePartnerRequest = async () => {
    try {
      const userHandle = user_handle.startsWith('@') ? user_handle : `@${user_handle}`;
      const response = await fetch(`/api/users/${userHandle}/rel/partner_request`, {
        method: 'POST',
      });

      if (response.ok) {
        // 合トレ希望を送信しました
        console.log('合トレ希望を送信しました');
      } else {
        const errorData = await response.json();
        console.error(`送信に失敗しました: ${errorData.message || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('Error sending partner request:', error);
    }
  };

  const renderPhotos = (photos: Array<{ url: string; thumb_url?: string }>) => {
    if (!photos || photos.length === 0) return null;

    if (photos.length === 1) {
      return (
        <div className="mt-3">
          <Image
            src={photos[0].url}
            alt="投稿画像"
            width={500}
            height={300}
            className="rounded-lg object-cover w-full max-h-80"
          />
        </div>
      );
    }

    if (photos.length === 2) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-1">
          {photos.map((photo, index) => (
            <Image
              key={index}
              src={photo.url}
              alt={`投稿画像 ${index + 1}`}
              width={250}
              height={200}
              className="rounded-lg object-cover w-full h-48"
            />
          ))}
        </div>
      );
    }

    if (photos.length === 3) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-1">
          <Image
            src={photos[0].url}
            alt="投稿画像 1"
            width={250}
            height={400}
            className="rounded-lg object-cover w-full h-96 row-span-2"
          />
          <div className="grid grid-rows-2 gap-1">
            <Image
              src={photos[1].url}
              alt="投稿画像 2"
              width={250}
              height={192}
              className="rounded-lg object-cover w-full h-48"
            />
            <Image
              src={photos[2].url}
              alt="投稿画像 3"
              width={250}
              height={192}
              className="rounded-lg object-cover w-full h-48"
            />
          </div>
        </div>
      );
    }

    if (photos.length === 4) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-1">
          {photos.map((photo, index) => (
            <Image
              key={index}
              src={photo.url}
              alt={`投稿画像 ${index + 1}`}
              width={250}
              height={200}
              className="rounded-lg object-cover w-full h-48"
            />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      {/* 投稿者情報 */}
      <header className="flex items-center gap-3 mb-2">
        <Link href={`/${user_handle.replace(/^@+/, '')}`} className="flex items-center gap-3 hover:opacity-80">
          <Image
            src={isValidUrl(user_icon) ? user_icon : '/images/image.png'}
            alt={`${user_display_name}のアイコン`}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div className="flex flex-col">
            <h2 className="font-semibold text-gray-900">{user_display_name}</h2>
            <span className="text-sm text-gray-500">@{user_handle.replace(/^@+/, '')}</span>
          </div>
        </Link>
      </header>

      {/* 写真 */}
      {renderPhotos(photos)}

      {/* 本文 */}
      <div className="mt-3">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {processBodyWithMentions(body, mentions)}
        </p>
      </div>

      {/* タグ */}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <span key={index} className="text-blue-500 text-sm hover:underline cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ステータス */}
      {status && (
        <div className="mt-3">
          <button
            onClick={() => setShowStatusPopup(true)}
            className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            筋トレ状態を確認
          </button>
        </div>
      )}

      {/* 投稿日時 */}
      <time className="text-xs text-gray-500 mt-3 block">
        {formatDate(posted_at)}
      </time>

      {/* アクションボタン */}
      <footer className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-6">
          {/* いいねボタン */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors duration-200 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
          >
            <ImFire size={18} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          {/* コメントボタン */}
          <button
            onClick={() => setShowCommentPopup(true)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors duration-200"
          >
            <BsChat size={16} />
            <span className="text-sm font-medium">{comments_count}</span>
          </button>

          {/* 合トレ希望ボタン */}
          <button
            onClick={handlePartnerRequest}
            className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors duration-200"
          >
            <FaRegHandshake size={16} />
            <span className="text-sm font-medium">合トレ希望</span>
          </button>
        </div>
      </footer>

      {/* ステータスポップアップ */}
      {showStatusPopup && status && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">トレーニング記録</h3>

            {statusDetails ? (
              <div className="space-y-4">
                {/* 開始・終了時間 */}
                {(statusDetails.started_at || statusDetails.finished_at) && (
                  <div className="flex gap-4">
                    {statusDetails.started_at && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">開始:</span>
                        <p className="text-sm">{new Date(statusDetails.started_at).toLocaleString('ja-JP')}</p>
                      </div>
                    )}
                    {statusDetails.finished_at && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">終了:</span>
                        <p className="text-sm">{new Date(statusDetails.finished_at).toLocaleString('ja-JP')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 場所 */}
                {statusDetails.gym && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">場所:</span>
                    <p className="text-sm">
                      {statusDetails.gym.gymchain ? `${statusDetails.gym.gymchain.name} - ` : ''}
                      {statusDetails.gym.name}
                    </p>
                  </div>
                )}

                {/* 一緒にトレーニング */}
                {statusDetails.partners && statusDetails.partners.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">一緒にトレーニング:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {statusDetails.partners.map((partner, index) => (
                        <Link
                          key={`partner-${index}`}
                          href={`/${partner.handle.replace(/^@+/, '')}`}
                          className="text-blue-500 hover:underline text-sm"
                        >
                          @{partner.handle.replace(/^@+/, '')}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ウェイトトレーニングメニュー */}
                {statusDetails.menus && statusDetails.menus.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">ウェイトトレーニング:</span>
                    <div className="mt-2 space-y-2">
                      {statusDetails.menus.map((menu, index) => (
                        <div key={`menu-${index}`} className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-sm">
                            {menu.menu.bodypart?.name ? `${menu.menu.bodypart.name} - ` : ''}
                            {menu.menu.name}
                          </div>
                          {menu.sets && menu.sets.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {menu.sets.map((set, setIndex) => (
                                <div key={`set-${setIndex}`} className="text-xs text-gray-500">
                                  {setIndex + 1}セット目:
                                  {set.weight && ` ${set.weight}kg`}
                                  {set.reps && ` ${set.reps}回`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 有酸素メニュー */}
                {statusDetails.menus_cardio && statusDetails.menus_cardio.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">有酸素トレーニング:</span>
                    <div className="mt-2 space-y-2">
                      {statusDetails.menus_cardio.map((cardio, index) => (
                        <div key={`cardio-${index}`} className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-sm">{cardio.menu.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {cardio.duration && `時間: ${cardio.duration}`}
                            {cardio.distance && ` 距離: ${cardio.distance}km`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">読み込み中...</p>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowStatusPopup(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* コメントポップアップ */}
      {showCommentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">コメント</h3>

            {/* コメント一覧 */}
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">まだコメントがありません</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.pub_id} className="flex gap-3 p-3 bg-gray-50 rounded">
                    <Image
                      src={isValidUrl(comment.posted_user.profile_icon_url || '') ? comment.posted_user.profile_icon_url! : '/images/image.png'}
                      alt={`${comment.posted_user.display_name}のアイコン`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.posted_user.display_name}</span>
                        <span className="text-xs text-gray-500">@{comment.posted_user.handle}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.posted_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* コメント投稿フォーム */}
            <div className="border-t pt-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="コメントを入力..."
                className="w-full p-3 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowCommentPopup(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  閉じる
                </button>
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  投稿
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
