"use client"
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import SubHeader from '@/components/sub-header'
import { IoTrashOutline, IoCameraOutline, IoTimeOutline, IoLocationOutline } from 'react-icons/io5'

// 型定義
type TrainingHistory = {
  pub_id: string
  start_time: string
  end_time?: string | null
  gym_name?: string | null
  gym_location?: string | null
}

type Mention = {
  handle: string
  pub_id: string
}

const CreatePost = () => {
  const router = useRouter()

  // 本文とメンション
  const [content, setContent] = useState('')
  const [mentions, setMentions] = useState<Mention[]>([])
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionSuggestions, setMentionSuggestions] = useState<Mention[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionPosition, setMentionPosition] = useState(0)

  // タグ
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<Record<string, string>>({})

  // 写真
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // トレーニング記録
  const [selectedStatus, setSelectedStatus] = useState<TrainingHistory | null>(null)
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false)
  const [trainingHistories, setTrainingHistories] = useState<TrainingHistory[]>([])

  const [submitting, setSubmitting] = useState(false)

  // 画像プレビュー生成
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setImagePreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [images])

  // メンション候補取得
  useEffect(() => {
    const fetchMentions = async () => {
      if (mentionQuery.length > 0) {
        try {
          const response = await fetch(`/api/users?handle_id=${encodeURIComponent('@' + mentionQuery)}&limit=10`)
          if (response.ok) {
            const users = await response.json()
            setMentionSuggestions(users.map((user: { handle: string, pub_id: string }) => ({
              handle: user.handle,
              pub_id: user.pub_id
            })))
          }
        } catch (error) {
          console.error('Failed to fetch mention suggestions:', error)
          setMentionSuggestions([])
        }
      } else {
        setMentionSuggestions([])
      }
    }
    const timeoutId = setTimeout(fetchMentions, 300)
    return () => clearTimeout(timeoutId)
  }, [mentionQuery])

  // タグ候補取得
  useEffect(() => {
    const fetchTagSuggestions = async () => {
      if (tagInput.length > 0) {
        try {
          const response = await fetch(`/api/tags?name=${encodeURIComponent(tagInput)}&limit=10`)
          if (response.ok) {
            const data = await response.json()
            setTagSuggestions(data)
          }
        } catch (error) {
          console.error('Failed to fetch tag suggestions:', error)
        }
      } else {
        setTagSuggestions({})
      }
    }
    const timeoutId = setTimeout(fetchTagSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [tagInput])

  // トレーニング履歴取得
  useEffect(() => {
    const fetchTrainingHistories = async () => {
      try {
        const response = await fetch(`/api/users/me/status`)
        if (!response.ok) {
          // APIエラーの場合は空配列を設定
          console.warn('Status API not available:', response.status)
          setTrainingHistories([])
          return
        }

        const statusList = await response.json()

        // 各ステータスの詳細を取得
        const detailedStatuses = await Promise.all(
          statusList.map(async (status: { pub_id: string }) => {
            try {
              const detailResponse = await fetch(`/api/users/me/status/${status.pub_id}`)
              if (detailResponse.ok) {
                return await detailResponse.json()
              }
              return null
            } catch (error) {
              console.error('Failed to fetch status detail:', error)
              return null
            }
          })
        )

        // 有効なステータスのみをフィルター
        const validStatuses = detailedStatuses.filter(Boolean).map((status: {
          pub_id: string;
          started_at: string;
          finished_at?: string | null;
          gym?: { name?: string; address?: string } | null;
        }) => ({
          pub_id: status.pub_id,
          start_time: status.started_at,
          end_time: status.finished_at || null,
          gym_name: status.gym?.name || null,
          gym_location: status.gym?.address || null
        }))

        setTrainingHistories(validStatuses)
      } catch (error) {
        console.error('Failed to fetch training histories:', error)
        // エラー時は空配列を設定して機能を無効化しない
        setTrainingHistories([])
      }
    }

    fetchTrainingHistories()
  }, [])  // メンション処理
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setContent(value)

    // @を検出してメンション候補を表示
    const beforeCursor = value.slice(0, cursorPos)
    const mentionMatch = beforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionPosition(cursorPos)
      setShowMentions(true)
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }

  const handleMentionSelect = (mention: Mention) => {
    const beforeAt = content.slice(0, mentionPosition - mentionQuery.length - 1)
    const afterCursor = content.slice(mentionPosition)
    const handleWithAt = mention.handle.startsWith('@') ? mention.handle : `@${mention.handle}`
    const newContent = beforeAt + `${handleWithAt} ` + afterCursor

    setContent(newContent)
    setMentions([...mentions, mention])
    setShowMentions(false)
    setMentionQuery('')
  }

  // タグ処理
  const handleAddTag = async (tagNameOrId: string) => {
    if (!selectedTags.includes(tagNameOrId)) {
      // 既存のタグかどうかチェック
      const isExistingTag = Object.values(tagSuggestions).includes(tagNameOrId)

      if (!isExistingTag) {
        // 新規タグの場合、作成APIを呼び出し
        try {
          const response = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: tagNameOrId })
          })

          if (!response.ok) {
            console.error('Failed to create new tag:', tagNameOrId)
            return
          }
        } catch (error) {
          console.error('Error creating new tag:', error)
          return
        }
      }

      setSelectedTags([...selectedTags, tagNameOrId])
    }
    setTagInput('')
    setTagSuggestions({})
  }

  const handleRemoveTag = (tagNameOrId: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagNameOrId))
  }


  // 画像処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const picked = Array.from(e.target.files).filter(file => {
      if (!supportedTypes.includes(file.type)) {
        alert(`${file.name} はサポートされていない形式です。JPEG、PNG、WebPのみサポートしています。`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB制限
        alert(`${file.name} は大きすぎます（最大10MB）。`)
        return false
      }
      return true
    })

    const next = [...images, ...picked].slice(0, 4)
    setImages(next)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const openFilePicker = () => fileInputRef.current?.click()

  // トレーニング履歴選択
  const handleSelectStatus = (status: TrainingHistory) => {
    setSelectedStatus(status)
    setIsStatusSelectorOpen(false)
  }

  // フォーマット関数
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  // ファイルをBase64に変換
  const filesToBase64 = async (files: File[]): Promise<string[]> => {
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )
    return Promise.all(readers)
  }

  // 投稿処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // メンションを正確に解析してオフセットとpub_idを計算
    const mentionRegex = /@(\w+)/g
    const mentionMatches = [...content.matchAll(mentionRegex)]
    const updatedMentions: { offset: number; pub_id: string }[] = []

    console.log('Content:', content)
    console.log('Mention matches found:', mentionMatches)

    // 重複排除のためのマップ（同じ位置に同じユーザーは1回だけ）
    const processedMentions = new Set<string>()

    for (const match of mentionMatches) {
      const handle = match[1]
      const offset = match.index!
      const mentionKey = `${handle}-${offset}`

      console.log(`Processing mention: @${handle} at offset ${offset}`)

      // 既に処理済みの場合はスキップ
      if (processedMentions.has(mentionKey)) {
        console.log(`Skipping duplicate mention: ${mentionKey}`)
        continue
      }

      try {
        // 各ハンドルについてAPIで確認
        console.log(`Fetching user data for handle: @${handle}`)
        const response = await fetch(`/api/users?handle_id=${encodeURIComponent('@' + handle)}&limit=1`)
        if (response.ok) {
          const users = await response.json()
          console.log(`API response for @${handle}:`, users)
          if (users.length > 0) {
            const user = users[0]
            console.log(`Found user: ${user.pub_id} for @${handle}`)
            updatedMentions.push({
              offset: offset,
              pub_id: user.pub_id
            })
            processedMentions.add(mentionKey)
          } else {
            alert(`@${handle} というユーザーは存在しません`)
            return
          }
        } else {
          console.error(`API request failed for @${handle}:`, response.status)
          alert(`@${handle} というユーザーの確認に失敗しました`)
          return
        }
      } catch (error) {
        console.error('Failed to verify mention:', error)
        alert(`@${handle} というユーザーの確認に失敗しました`)
        return
      }
    }

    // メンション部分を削除したプレーンテキストとオフセットを再計算
    // 前から順番に処理しながら、元の文字列からの正確なオフセットを計算
    let workingText = content;
    const finalMentions: { offset: number; pub_id: string }[] = [];

    // オフセットの小さい順（前から）処理
    const sortedMentions = [...updatedMentions].sort((a, b) => a.offset - b.offset);

    for (const mention of sortedMentions) {
      // 元の文字列での位置を使って@handle_nameを特定
      const originalText = content.substring(mention.offset);
      const mentionMatch = originalText.match(/^@(\w+)/);

      if (mentionMatch) {
        const fullMentionText = mentionMatch[0]; // "@handle_name"

        // workingTextでの現在の位置を計算
        // （既に削除されたメンション分だけ前にずれている）
        let currentPosInWorkingText = mention.offset;
        for (const prevMention of finalMentions) {
          if (prevMention.offset < mention.offset) {
            // 以前に削除されたメンションの長さ分だけ位置が前にずれる
            const prevOriginalText = content.substring(prevMention.offset);
            const prevMentionMatch = prevOriginalText.match(/^@(\w+)/);
            if (prevMentionMatch) {
              currentPosInWorkingText -= prevMentionMatch[0].length;
            }
          }
        }

        // workingTextから@handle_nameを削除
        workingText = workingText.substring(0, currentPosInWorkingText) +
          workingText.substring(currentPosInWorkingText + fullMentionText.length);

        // 削除後の位置でメンション情報を保存
        finalMentions.push({
          offset: currentPosInWorkingText,
          pub_id: mention.pub_id
        });
      }
    }

    console.log('Original content:', content);
    console.log('Plain text body (mentions removed):', workingText);
    console.log('Final mentions with adjusted offsets:', finalMentions);

    try {
      setSubmitting(true)
      const photos = await filesToBase64(images)
      const payload = {
        body: workingText, // トリムしない
        mentions: finalMentions,
        tags: selectedTags,
        photos,
        status_pub_id: selectedStatus?.pub_id || undefined,
        // 注意: exercisesフィールドは削除。既存のトレーニング記録を参照してください。
      }      // デバッグ用ログ
      console.log('Sending payload:', payload)
      console.log('Mentions being sent:', updatedMentions)

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || '投稿に失敗しました')
      }

      await res.json();

      router.push('/')
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : '投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col" style={{ paddingTop: '1vh' }}>
      <SubHeader title="投稿" />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* 1. 本文（メンション機能付き） */}
        <section>
          <label className="block text-sm font-medium mb-2">本文</label>
          <div className="relative">
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder="今の気持ちやトレーニング内容を書こう… @でユーザーをメンションできます"
              className="min-h-28"
            />

            {/* メンション候補 */}
            {showMentions && mentionSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {mentionSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.pub_id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleMentionSelect(suggestion)}
                  >
                    {suggestion.handle.startsWith('@') ? suggestion.handle : `@${suggestion.handle}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 2. タグ */}
        <section>
          <label className="block text-sm font-medium mb-2">タグ</label>

          {/* 選択済みタグ */}
          {selectedTags.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-red-500 text-base leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* タグ入力 */}
          <div className="relative">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="タグを追加"
                className="border border-gray-300 rounded-lg px-3 py-2 flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (tagInput.trim()) {
                    handleAddTag(tagInput.trim())
                  }
                }}
                disabled={!tagInput.trim()}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                追加
              </button>
            </div>

            {/* タグ候補 */}
            {tagInput.trim() && Object.keys(tagSuggestions).length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                {Object.entries(tagSuggestions).map(([pub_id, name]) => (
                  <button
                    key={pub_id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm"
                    onClick={() => handleAddTag(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. 写真（0~4枚） */}
        <section>
          <label className="block text-sm font-medium mb-2">写真の追加（最大4枚）</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-4 gap-2">
            {/* 追加ボタン */}
            {images.length < 4 && (
              <button
                type="button"
                onClick={openFilePicker}
                className="w-full aspect-square rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
              >
                <IoCameraOutline className="w-7 h-7" />
              </button>
            )}

            {/* プレビュー */}
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="relative w-full aspect-square overflow-hidden rounded-lg border">
                <Image src={src} alt={`preview-${idx}`} fill sizes="25vw" className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 z-10 p-1 rounded-full bg-black/80 text-white hover:bg-black"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 5. 紐づけるトレーニング履歴 */}
        <section>
          <label className="block text-sm font-medium mb-2">トレーニング履歴を紐づけ</label>

          {/* 選択済み履歴 */}
          {selectedStatus && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <IoTimeOutline />
                    <span>
                      {formatDateTime(selectedStatus.start_time)}
                      {selectedStatus.end_time && ` - ${formatDateTime(selectedStatus.end_time)}`}
                    </span>
                  </div>
                  {selectedStatus.gym_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <IoLocationOutline />
                      <span>{selectedStatus.gym_name}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStatus(null)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 履歴選択ボタン */}
          <button
            type="button"
            onClick={() => setIsStatusSelectorOpen(true)}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
          >
            {selectedStatus ? '履歴を変更' : '履歴を紐づけ'}
          </button>
        </section>

        {/* 投稿ボタン */}
        <div className="pt-2 pb-24">
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !content.trim()}
          >
            {submitting ? '投稿中...' : '投稿する'}
          </Button>
        </div>
      </form>

      {/* トレーニング履歴選択ポップアップ */}
      {isStatusSelectorOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">トレーニング履歴を選択</h3>
                <button
                  type="button"
                  onClick={() => setIsStatusSelectorOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {trainingHistories.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  トレーニング履歴がありません
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {trainingHistories.map((history) => (
                    <button
                      key={history.pub_id}
                      type="button"
                      onClick={() => handleSelectStatus(history)}
                      className="w-full p-4 text-left hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IoTimeOutline />
                        <span>
                          {formatDateTime(history.start_time)}
                          {history.end_time && ` - ${formatDateTime(history.end_time)}`}
                        </span>
                      </div>
                      {history.gym_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <IoLocationOutline />
                          <span>{history.gym_name}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreatePost