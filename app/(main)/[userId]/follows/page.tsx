'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { IoArrowBack, IoSearch } from "react-icons/io5";
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface User {
  pub_id: string;
  handle: string;
  display_name?: string;
  description?: string;
  tags?: Array<{
    pub_id: string;
    name: string;
  }>;
  icon_url?: string;
  skill_level?: string;
  followings_count?: number;
  followers_count?: number;
}

const FollowsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const userId = (params.userId as string) ?? 'me';

  const [activeTab, setActiveTab] = useState<'followers' | 'followings'>('followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [followings, setFollowings] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // フォロワー取得
        const followersRes = await fetch(`/api/users/${userId}/rel/followers`);
        if (followersRes.ok) {
          const followersData = await followersRes.json();
          setFollowers(followersData);
        }

        // フォロー中取得
        const followingsRes = await fetch(`/api/users/${userId}/rel/followings`);
        if (followingsRes.ok) {
          const followingsData = await followingsRes.json();
          setFollowings(followingsData);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // フォロワーのフィルタリング
  const filteredFollowers = followers.filter(user =>
    (user.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.handle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // フォロー中のフィルタリング
  const filteredFollowings = followings.filter(user =>
    (user.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.handle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="flex items-center justify-start px-4 pt-5">
        <button className="text-2xl" onClick={() => router.back()}>
          <IoArrowBack />
        </button>
      </header>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'followers' | 'followings')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              {followers.length} フォロワー
            </TabsTrigger>
            <TabsTrigger value="followings">
              {followings.length} フォロー中
            </TabsTrigger>
          </TabsList>

          {/* 検索バー */}
          <div className="my-4">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <TabsContent value="followers" className="mt-4">
            <div>
              {filteredFollowers.length > 0 ? (
                filteredFollowers.map((user) => (
                  <div key={user.pub_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <Link href={`/${user.handle || user.pub_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={user.icon_url || '/images/image.png'}
                          alt={`${user.display_name || 'ユーザー'}のプロフィール画像`}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.display_name || 'ユーザー'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.handle || ''}
                        </div>
                        {user.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {user.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  フォロワーがいません
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="followings" className="mt-4">
            <div>
              {filteredFollowings.length > 0 ? (
                filteredFollowings.map((user) => (
                  <div key={user.pub_id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <Link href={`/${user.handle || user.pub_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={user.icon_url || '/images/image.png'}
                          alt={`${user.display_name || 'ユーザー'}のプロフィール画像`}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.display_name || 'ユーザー'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.handle || ''}
                        </div>
                        {user.description && (
                          <div className="text-xs text-gray-400 truncate">
                            {user.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  フォロー中のユーザーがいません
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FollowsPage;