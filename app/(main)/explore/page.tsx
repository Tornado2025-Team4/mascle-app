'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'

interface Tag {
  name: string
}

interface Intent {
  intent: string
}

interface IntentBodypart {
  bodypart: string
}

interface BelongingGym {
  name: string
}

interface PostedUser {
  pub_id?: string
  display_name: string
  handle?: string
  profile_icon_url?: string
}

interface Mention {
  user_pub_id: string
  display_name?: string
}

interface Photo {
  url: string
  thumb_url: string
}

interface Status {
  pub_id: string
}

interface User {
  pub_id?: string
  anon_pub_id?: string
  handle?: string
  display_name: string
  description?: string
  profile_icon_url?: string
  generation?: number
  gender?: string
  training_since?: string
  tags: Tag[]
  intents: Intent[]
  intent_bodyparts: IntentBodypart[]
  belonging_gyms: BelongingGym[]
}

interface Post {
  pub_id: string
  posted_user: PostedUser
  posted_at: string
  body: string
  mentions: Mention[]
  tags: string[]
  photos: Photo[]
  likes_count: number
  is_liked_by_current_user: boolean
  comments_count: number
  is_commented_by_current_user: boolean
  status: Status | null
}

const Explore = () => {
  const [activeTab, setActiveTab] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  // ユーザー検索の詳細フィルター
  const [userFilters, setUserFilters] = useState({
    description: '',
    tags: '',
    generation: '',
    gender: '',
    training_since: '',
    intents: '',
    intent_bodyparts: ''
  })

  // 投稿検索の詳細フィルター
  const [postFilters, setPostFilters] = useState({
    mentioned_user: '',
    before: '',
    after: ''
  })

  const [userResults, setUserResults] = useState<User[]>([])
  const [postResults, setPostResults] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // フリーテキスト検索の解析関数
  const parseSearchQuery = (query: string) => {
    const terms = query.trim().split(/\s+/)
    const parsed = {
      handles: [] as string[],
      tags: [] as string[],
      text: [] as string[]
    }

    terms.forEach(term => {
      if (term.startsWith('@')) {
        parsed.handles.push(term.slice(1))
      } else if (term.startsWith('#')) {
        parsed.tags.push(term.slice(1))
      } else if (term.length > 0) {
        parsed.text.push(term)
      }
    })

    return parsed
  }

  // ユーザー検索実行
  const searchUsers = async () => {
    setIsLoading(true)
    try {
      const parsed = parseSearchQuery(searchQuery)
      const params = new URLSearchParams()

      // フリーテキストからのパラメータ
      if (parsed.handles.length > 0) {
        params.append('handle_id', parsed.handles[0]) // 最初のハンドルIDのみ使用
      }
      if (parsed.tags.length > 0) {
        params.append('tags', parsed.tags[0]) // 最初のタグのみ使用
      }
      if (parsed.text.length > 0) {
        params.append('display_name', parsed.text.join(' '))
      }

      // 詳細検索フィルター
      if (userFilters.description) params.append('description', userFilters.description)
      if (userFilters.tags) params.append('tags', userFilters.tags)
      if (userFilters.generation) params.append('generation', userFilters.generation)
      if (userFilters.gender) params.append('gender', userFilters.gender)
      if (userFilters.training_since) params.append('training_since', userFilters.training_since)
      if (userFilters.intents) params.append('intents', userFilters.intents)
      if (userFilters.intent_bodyparts) params.append('intent_bodyparts', userFilters.intent_bodyparts)

      params.append('limit', '20')

      const response = await fetch(`/api/users?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUserResults(data)
      }
    } catch (error) {
      console.error('ユーザー検索エラー:', error)
    }
    setIsLoading(false)
  }

  // 投稿検索実行
  const searchPosts = async () => {
    setIsLoading(true)
    try {
      const parsed = parseSearchQuery(searchQuery)
      const params = new URLSearchParams()

      // フリーテキストからのパラメータ
      if (parsed.handles.length > 0) {
        params.append('posted_user_pub_id', parsed.handles[0]) // 最初のハンドルIDのみ使用
      }
      if (parsed.tags.length > 0) {
        params.append('tag', parsed.tags[0]) // 最初のタグのみ使用
      }
      if (parsed.text.length > 0) {
        params.append('body', parsed.text.join(' '))
      }

      // 詳細検索フィルター
      if (postFilters.mentioned_user) params.append('mentioned_user_pub_id', postFilters.mentioned_user)
      if (postFilters.before) params.append('before', postFilters.before)
      if (postFilters.after) params.append('after', postFilters.after)

      params.append('limit', '20')

      const response = await fetch(`/api/posts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPostResults(data)
      }
    } catch (error) {
      console.error('投稿検索エラー:', error)
    }
    setIsLoading(false)
  }

  const handleSearch = () => {
    if (activeTab === 'users') {
      searchUsers()
    } else {
      searchPosts()
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">探索</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">ユーザー検索</TabsTrigger>
          <TabsTrigger value="posts">投稿検索</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー検索</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="@ハンドルID #タグ 表示名で検索 (例: @john #筋トレ 太郎)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  検索
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="w-full justify-between"
              >
                詳細検索
                {showAdvancedSearch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showAdvancedSearch && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="description">自己紹介文</Label>
                    <Input
                      id="description"
                      placeholder="自己紹介文で検索"
                      value={userFilters.description}
                      onChange={(e) => setUserFilters({ ...userFilters, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">タグ</Label>
                    <Input
                      id="tags"
                      placeholder="タグで検索"
                      value={userFilters.tags}
                      onChange={(e) => setUserFilters({ ...userFilters, tags: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="generation">年代</Label>
                    <Select value={userFilters.generation} onValueChange={(value) => setUserFilters({ ...userFilters, generation: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="年代を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10代</SelectItem>
                        <SelectItem value="20">20代</SelectItem>
                        <SelectItem value="30">30代</SelectItem>
                        <SelectItem value="40">40代</SelectItem>
                        <SelectItem value="50">50代</SelectItem>
                        <SelectItem value="60">60代</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">性別</Label>
                    <Select value={userFilters.gender} onValueChange={(value) => setUserFilters({ ...userFilters, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="性別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男性</SelectItem>
                        <SelectItem value="female">女性</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="training_since">トレーニング歴</Label>
                    <Input
                      id="training_since"
                      placeholder="トレーニング歴"
                      value={userFilters.training_since}
                      onChange={(e) => setUserFilters({ ...userFilters, training_since: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="intents">目的</Label>
                    <Input
                      id="intents"
                      placeholder="トレーニング目的"
                      value={userFilters.intents}
                      onChange={(e) => setUserFilters({ ...userFilters, intents: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="intent_bodyparts">鍛えたい部位</Label>
                    <Input
                      id="intent_bodyparts"
                      placeholder="鍛えたい部位"
                      value={userFilters.intent_bodyparts}
                      onChange={(e) => setUserFilters({ ...userFilters, intent_bodyparts: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* ユーザー検索結果 */}
              <div className="mt-6">
                {isLoading && <div className="text-center">検索中...</div>}
                {userResults.length > 0 && (
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">検索結果 ({userResults.length}件)</h3>
                    {userResults.map((user, index) => (
                      <Card key={user.pub_id || user.anon_pub_id || index}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {user.profile_icon_url ? (
                                <Image
                                  src={user.profile_icon_url}
                                  alt=""
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <span className="text-xl">👤</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium">{user.display_name}</p>
                                {user.handle && (
                                  <p className="text-sm text-gray-500">@{user.handle}</p>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                {user.generation && <span>{user.generation}代</span>}
                                {user.gender && <span>{user.gender === 'male' ? '男性' : user.gender === 'female' ? '女性' : 'その他'}</span>}
                                {user.training_since && <span>歴: {user.training_since}</span>}
                              </div>

                              {user.description && (
                                <p className="text-sm mb-2 line-clamp-2">{user.description}</p>
                              )}

                              {user.tags && user.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {user.tags.slice(0, 3).map((tag: Tag, tagIndex: number) => (
                                    <span key={tagIndex} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      #{typeof tag === 'string' ? tag : tag.name}
                                    </span>
                                  ))}
                                  {user.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">+{user.tags.length - 3}</span>
                                  )}
                                </div>
                              )}

                              {user.intents && user.intents.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {user.intents.slice(0, 2).map((intent: Intent, intentIndex: number) => (
                                    <span key={intentIndex} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      {typeof intent === 'string' ? intent : intent.intent}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>投稿検索</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="@投稿者ID #タグ 本文で検索 (例: @john #筋トレ ベンチプレス)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  検索
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="w-full justify-between"
              >
                詳細検索
                {showAdvancedSearch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showAdvancedSearch && (
                <div className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="mentioned_user">メンションユーザー</Label>
                    <Input
                      id="mentioned_user"
                      placeholder="メンションされたユーザーのハンドルID"
                      value={postFilters.mentioned_user}
                      onChange={(e) => setPostFilters({ ...postFilters, mentioned_user: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="after">投稿日時（以降）</Label>
                      <Input
                        id="after"
                        type="datetime-local"
                        value={postFilters.after}
                        onChange={(e) => setPostFilters({ ...postFilters, after: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="before">投稿日時（以前）</Label>
                      <Input
                        id="before"
                        type="datetime-local"
                        value={postFilters.before}
                        onChange={(e) => setPostFilters({ ...postFilters, before: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 投稿検索結果 */}
              <div className="mt-6">
                {isLoading && <div className="text-center">検索中...</div>}
                {postResults.length > 0 && (
                  <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">検索結果 ({postResults.length}件)</h3>
                    {postResults.map((post) => (
                      <Card key={post.pub_id}>
                        <CardContent className="p-4">
                          <div className="flex space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              👤
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium">{post.posted_user?.display_name || 'ユーザー'}</span>
                                <span className="text-sm text-gray-500">{post.posted_at}</span>
                              </div>
                              <p className="mb-2">{post.body}</p>
                              {post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {post.tags.map((tag, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {post.photos.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {post.photos.slice(0, 4).map((photo, index) => (
                                    <div key={index} className="relative h-32 bg-gray-200 rounded">
                                      <Image
                                        src={photo.thumb_url || photo.url}
                                        alt=""
                                        fill
                                        className="object-cover rounded"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                <span>👍 {post.likes_count}</span>
                                <span>💬 {post.comments_count}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Explore