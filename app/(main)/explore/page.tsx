'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search, User, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'

interface Tag {
  pub_id?: string
  name: string
}

interface Intent {
  pub_id?: string
  intent: string
}

interface IntentBodypart {
  pub_id?: string
  bodypart: string
}

interface BelongingGym {
  pub_id?: string
  name: string
  gymchain?: {
    pub_id: string
    name: string
    icon_rel_id?: string
    icon_name?: string
    internal_id: string
  }
  photo_rel_id?: string
  photo_name?: string
  joined_since: string
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
  is_following?: boolean
  is_followed_by?: boolean
}

interface PostedUser {
  pub_id?: string
  anon_pub_id?: string
  handle?: string
  display_name: string
  profile_icon_url?: string
}

interface Mention {
  user: PostedUser
}

interface Photo {
  rel_id: string
  name: string
}

interface Status {
  pub_id: string
  status: string
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserPubId, setCurrentUserPubId] = useState<string | null>(null)

  const supabase = createClient()

  // ユーザー検索の詳細フィルター
  const [userFilters, setUserFilters] = useState({
    description: '',
    generation: 'all',
    gender: 'all',
    training_since_years: '',
    training_since_months: '',
    training_since_condition: 'gte',
    intents: 'all',
    intent_bodyparts: 'all'
  })

  // 投稿検索の詳細フィルター
  const [postFilters, setPostFilters] = useState({
    mentioned_user: '',
    before: '',
    after: ''
  })

  // APIデータ
  const [intentOptions, setIntentOptions] = useState<Record<string, string>>({})
  const [bodypartOptions, setBodypartOptions] = useState<Record<string, string>>({})

  const [userResults, setUserResults] = useState<User[]>([])
  const [postResults, setPostResults] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // 現在のユーザーIDを取得
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id) // auth_user_idをそのまま使用
        setCurrentUserPubId(user.id) // pub_idはauth_user_idと同じ
      }
    }
    getCurrentUser()
  }, [supabase.auth])

  // APIから目的と部位の選択肢を取得
  useEffect(() => {
    const fetchIntents = async () => {
      try {
        const response = await fetch('/api/intents?limit=100')
        if (response.ok) {
          const data = await response.json()
          setIntentOptions(data)
        }
      } catch (error) {
        console.error('Failed to fetch intents:', error)
      }
    }

    const fetchBodyparts = async () => {
      try {
        const response = await fetch('/api/bodyparts?limit=100')
        if (response.ok) {
          const data = await response.json()
          setBodypartOptions(data)
        }
      } catch (error) {
        console.error('Failed to fetch bodyparts:', error)
      }
    }

    fetchIntents()
    fetchBodyparts()
  }, [])

  // 検索クエリのパース
  const parseSearchQuery = (query: string) => {
    const terms = query.trim().split(/\s+/)
    const parsed = {
      handles: [] as string[],
      tags: [] as string[],
      text: [] as string[]
    }

    if (!query.trim()) {
      return parsed
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
    setErrorMessage('')
    try {
      const parsed = parseSearchQuery(searchQuery)
      const params = new URLSearchParams()

      // フリーテキストからのパラメータ
      if (parsed.handles.length > 0) {
        const handle = parsed.handles[0].startsWith('@') ? parsed.handles[0] : `@${parsed.handles[0]}`
        params.append('handle_id', handle)
      }
      if (parsed.tags.length > 0) {
        const tag = parsed.tags[0].startsWith('#') ? parsed.tags[0] : `#${parsed.tags[0]}`
        params.append('tags', tag)
      }
      if (parsed.text.length > 0) {
        params.append('display_name', parsed.text.join(' '))
      }

      // 詳細検索フィルター（"all"でない場合のみ適用）
      if (userFilters.description) params.append('description', userFilters.description)
      if (userFilters.generation && userFilters.generation !== 'all') params.append('generation', userFilters.generation)
      if (userFilters.gender && userFilters.gender !== 'all') params.append('gender', userFilters.gender)

      if (userFilters.intents && userFilters.intents !== 'all') params.append('intents', userFilters.intents)
      if (userFilters.intent_bodyparts && userFilters.intent_bodyparts !== 'all') params.append('intent_bodyparts', userFilters.intent_bodyparts)

      // 訓練歴フィルター
      if (userFilters.training_since_years || userFilters.training_since_months) {
        let trainingValue = ''
        if (userFilters.training_since_years) {
          trainingValue += userFilters.training_since_years + '年'
        }
        if (userFilters.training_since_months) {
          trainingValue += userFilters.training_since_months + 'ヶ月'
        }
        params.append('training_since', trainingValue)
        params.append('training_since_condition', userFilters.training_since_condition)
      }

      // 検索条件が何もない場合は、最新のユーザーを取得
      if (params.toString() === '' || params.toString() === 'limit=20') {
        params.set('display_name', '')
      }

      params.append('limit', '20')

      const response = await fetch(`/api/users?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // 検索結果から自分自身を除外
        const filteredData = currentUserPubId
          ? data.filter((user: User) => user.pub_id !== currentUserPubId)
          : data
        setUserResults(filteredData)
        if (filteredData.length === 0) {
          setErrorMessage('検索条件に一致するユーザーが見つかりませんでした')
        }
      } else if (response.status === 404) {
        setUserResults([])
        setErrorMessage('検索条件に一致するユーザーが見つかりませんでした')
      } else {
        setUserResults([])
        setErrorMessage(`検索エラーが発生しました (${response.status})`)
      }
    } catch (error) {
      console.error('ユーザー検索エラー:', error)
      setUserResults([])
      setErrorMessage('検索中にエラーが発生しました。もう一度お試しください。')
    }
    setIsLoading(false)
  }

  // 投稿検索実行
  const searchPosts = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const parsed = parseSearchQuery(searchQuery)
      const params = new URLSearchParams()

      // フリーテキストからのパラメータ
      if (parsed.handles.length > 0) {
        const handle = parsed.handles[0].startsWith('@') ? parsed.handles[0] : `@${parsed.handles[0]}`
        params.append('posted_user_pub_id', handle)
      }
      if (parsed.tags.length > 0) {
        const tag = parsed.tags[0].startsWith('#') ? parsed.tags[0] : `#${parsed.tags[0]}`
        params.append('tag', tag)
      }
      if (parsed.text.length > 0) {
        params.append('body', parsed.text.join(' '))
      }

      // 詳細検索フィルター
      if (postFilters.mentioned_user) params.append('mentioned_user_pub_id', postFilters.mentioned_user)
      if (postFilters.before) params.append('before', postFilters.before)
      if (postFilters.after) params.append('after', postFilters.after)

      // 検索条件が何もない場合は、最新の投稿を取得
      if (params.toString() === '' || params.toString() === 'limit=20') {
        params.set('body', '')
      }

      params.append('limit', '20')

      const response = await fetch(`/api/posts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPostResults(data)
        if (data.length === 0) {
          setErrorMessage('検索条件に一致する投稿が見つかりませんでした')
        }
      } else if (response.status === 404) {
        setPostResults([])
        setErrorMessage('検索条件に一致する投稿が見つかりませんでした')
      } else {
        setPostResults([])
        setErrorMessage(`検索エラーが発生しました (${response.status})`)
      }
    } catch (error) {
      console.error('投稿検索エラー:', error)
      setPostResults([])
      setErrorMessage('検索中にエラーが発生しました。もう一度お試しください。')
    }
    setIsLoading(false)
  }

  // 検索実行
  const handleSearch = () => {
    if (activeTab === 'users') {
      searchUsers()
    } else {
      searchPosts()
    }
  }

  // フォローボタンクリック処理
  const handleFollowClick = async (user: User, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUserId) {
      console.error('ユーザーがログインしていません')
      return
    }

    try {
      const action = user.is_following ? 'unfollow' : 'follow'
      const response = await fetch(`/api/users/${currentUserId}/rel/followings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_user_pub_id: user.pub_id,
          action: action
        })
      })

      if (response.ok) {
        // フォロー状態を更新
        setUserResults(prevUsers =>
          prevUsers.map(u =>
            u.pub_id === user.pub_id
              ? { ...u, is_following: !u.is_following }
              : u
          )
        )
      } else {
        const errorData = await response.json()
        console.error('フォロー操作に失敗しました:', errorData)
      }
    } catch (error) {
      console.error('フォロー操作エラー:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">仲間を見つける</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            ユーザー
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            投稿
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="ユーザー名、@ハンドル、#タグで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="w-4 h-4" />
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
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="generation">年代</Label>
                      <Select value={userFilters.generation} onValueChange={(value) => setUserFilters({ ...userFilters, generation: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="年代を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          <SelectItem value="10">10代</SelectItem>
                          <SelectItem value="20">20代</SelectItem>
                          <SelectItem value="30">30代</SelectItem>
                          <SelectItem value="40">40代</SelectItem>
                          <SelectItem value="50">50代</SelectItem>
                          <SelectItem value="60">60代</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gender">性別</Label>
                    <Select value={userFilters.gender} onValueChange={(value) => setUserFilters({ ...userFilters, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="性別を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="male">男性</SelectItem>
                        <SelectItem value="female">女性</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>トレーニング歴</Label>
                    <div className="flex gap-1 items-center mt-2">
                      <Input
                        placeholder="年"
                        type="number"
                        min="0"
                        max="50"
                        value={userFilters.training_since_years}
                        onChange={(e) => setUserFilters({ ...userFilters, training_since_years: e.target.value })}
                        className="w-16 px-2 py-1 text-sm"
                      />
                      <span className="text-sm">年</span>
                      <Input
                        placeholder="月"
                        type="number"
                        min="0"
                        max="11"
                        value={userFilters.training_since_months}
                        onChange={(e) => setUserFilters({ ...userFilters, training_since_months: e.target.value })}
                        className="w-16 px-2 py-1 text-sm"
                      />
                      <span className="text-sm">ヶ月</span>
                      <Select value={userFilters.training_since_condition} onValueChange={(value) => setUserFilters({ ...userFilters, training_since_condition: value })}>
                        <SelectTrigger className="w-18 px-2 py-1 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gte">以上</SelectItem>
                          <SelectItem value="lte">以下</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="intents">トレーニング目的</Label>
                      <Select value={userFilters.intents} onValueChange={(value) => setUserFilters({ ...userFilters, intents: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="目的を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          {Object.entries(intentOptions).map(([id, name]) => (
                            <SelectItem key={id} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="intent_bodyparts">鍛えたい部位</Label>
                      <Select value={userFilters.intent_bodyparts} onValueChange={(value) => setUserFilters({ ...userFilters, intent_bodyparts: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="部位を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">すべて</SelectItem>
                          {Object.entries(bodypartOptions).map(([id, name]) => (
                            <SelectItem key={id} value={name}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ユーザー検索結果 - カードの外に移動 */}
          {isLoading && <div className="text-center py-4">検索中...</div>}
          {errorMessage && !isLoading && (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
              {errorMessage}
            </div>
          )}
          {userResults.length > 0 && !isLoading && (
            <div className="space-y-1">
              {userResults.map((user, index) => (
                <a
                  key={user.pub_id || user.anon_pub_id || index}
                  href={`/${user.handle || user.pub_id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.profile_icon_url ? (
                              <Image
                                src={user.profile_icon_url}
                                alt=""
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1">
                              <h3 className="font-medium truncate hover:underline">
                                {user.display_name}
                              </h3>
                              {user.handle && (
                                <p className="text-sm text-gray-500 truncate">{user.handle}</p>
                              )}
                            </div>

                            <div className="text-sm text-gray-500 mb-1">
                              <div>
                                {user.generation && <span>{user.generation}代</span>}
                                {user.generation && user.gender && <span className="mx-2">•</span>}
                                {user.gender && <span>{user.gender === 'male' ? '男性' : user.gender === 'female' ? '女性' : 'その他'}</span>}
                              </div>
                              {user.training_since && (
                                <div className="mt-1">
                                  <span>トレーニング歴: {user.training_since}</span>
                                </div>
                              )}
                            </div>

                            {user.description && (
                              <p className="text-sm mb-2 line-clamp-2">{user.description}</p>
                            )}

                            <div className="flex flex-wrap gap-1">
                              {user.tags && user.tags.slice(0, 2).map((tag: Tag, tagIndex: number) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  #{typeof tag === 'string' ? tag : tag.name}
                                </Badge>
                              ))}
                              {user.intents && user.intents.slice(0, 1).map((intent: Intent, intentIndex: number) => (
                                <Badge key={intentIndex} variant="outline" className="text-xs">
                                  {typeof intent === 'string' ? intent : intent.intent}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          {user.is_followed_by && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              フォローされています
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant={user.is_following ? "secondary" : "default"}
                            className="text-xs h-7 px-3"
                            onClick={(e) => handleFollowClick(user, e)}
                          >
                            {user.is_following ? 'フォロー中' : 'フォロー'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="投稿内容、@ユーザー名、#タグで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  <Search className="w-4 h-4" />
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
                    <Label htmlFor="mentioned_user">メンションユーザー</Label>
                    <Input
                      id="mentioned_user"
                      placeholder="@ユーザー名"
                      value={postFilters.mentioned_user}
                      onChange={(e) => setPostFilters({ ...postFilters, mentioned_user: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="before">投稿日（以前）</Label>
                    <Input
                      id="before"
                      type="date"
                      value={postFilters.before}
                      onChange={(e) => setPostFilters({ ...postFilters, before: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="after">投稿日（以降）</Label>
                    <Input
                      id="after"
                      type="date"
                      value={postFilters.after}
                      onChange={(e) => setPostFilters({ ...postFilters, after: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 投稿検索結果 - カードの外に移動 */}
          {isLoading && <div className="text-center py-4">検索中...</div>}
          {errorMessage && !isLoading && (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
              {errorMessage}
            </div>
          )}
          {postResults.length > 0 && !isLoading && (
            <div className="space-y-3">
              {postResults.map((post) => (
                <Card key={post.pub_id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {post.posted_user.profile_icon_url ? (
                          <Image
                            src={post.posted_user.profile_icon_url}
                            alt=""
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium">{post.posted_user.display_name}</p>
                          {post.posted_user.handle && (
                            <p className="text-sm text-gray-500">{post.posted_user.handle}</p>
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(post.posted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{post.body}</p>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {post.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{post.likes_count} いいね</span>
                          <span>{post.comments_count} コメント</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Explore