'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { IoArrowBack, IoPencil } from "react-icons/io5";
import { UserData } from '@/types/userData.type';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { calculateTrainingPeriod } from '@/lib/date';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input';

const ProfileEdit = () => {
  const router = useRouter();
  const params = useParams() as { userId?: string };

  // ローディング/エラー
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // プロフィール初期値（APIから取得）
  const [userData, setUserData] = useState<UserData>({
    uuid: params.userId,
    handle_id: '',
    display_name: '',
    description: '',
    icon_url: '/images/image.png',
    tags: [],
    birth_date: '',
    age: 0,
    generation: '',
    gender: '未設定',
    training_since: '',
    skill_level: '',
    training_intents: [],
    training_intent_body_parts: [],
    belonging_gyms: [],
    follows_count: 0,
    followers_count: 0,
    registered_at: '',
    last_state: {
      pub_id: '',
      started_at: '',
      finished_at: undefined,
      is_auto_detected: false,
      gym_pub_id: '',
      gym_name: ''
    }
  });

  // プライバシー設定の状態
  const [privacySettings, setPrivacySettings] = useState({
    gender: 'public',
    age: 'public',
    trainingSince: 'public'
  });

  // 編集モードの状態
  const [editMode, setEditMode] = useState({
    gender: false,
    age: false,
    trainingSince: false,
    gym: false,
    intent: false,
    bodyParts: false
  });

  // 編集用の一時データ
  const [editData, setEditData] = useState({
    gender: userData.gender,
    age: userData.age,
    trainingSince: userData.training_since,
    gym: userData.belonging_gyms[0]?.name || "",
    intent: userData.training_intents[0] || "",
    bodyParts: userData.training_intent_body_parts.join(" "),
    display_name: userData.display_name,
  });

  // 初期データ取得
  useEffect(() => {
    const load = async () => {
      if (!params.userId) return;
      try {
        setLoading(true)
        const res = await fetch(`/api/users/${params.userId ?? 'me'}/profile`)
        if (!res.ok) throw new Error('プロフィール取得に失敗しました')
        const p: {
          display_name?: string;
          description?: string;
          icon_url?: string;
          gender?: string;
          age?: number;
          training_since?: string;
          tags?: Array<{ name: string }>;
          belonging_gyms?: Array<{ pub_id: string; name: string; location?: string }>
        } = await res.json()

        const tags = (p.tags ?? []).map(t => t.name)
        const belonging_gyms = (p.belonging_gyms ?? [])

        const next: UserData = {
          ...userData,
          display_name: p.display_name ?? '',
          description: p.description ?? '',
          icon_url: p.icon_url ?? '/images/image.png',
          gender: p.gender ?? '未設定',
          age: p.age ?? 0,
          training_since: p.training_since ?? '',
          tags,
          belonging_gyms,
        }
        setUserData(next)
        setEditData({
          gender: next.gender,
          age: next.age,
          trainingSince: next.training_since,
          gym: next.belonging_gyms[0]?.name || "",
          intent: next.training_intents[0] || "",
          bodyParts: next.training_intent_body_parts.join(" "),
          display_name: next.display_name,
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userId])

  // アイコン一時ファイル（プレビュー用）
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null)

  const trainingPeriod = calculateTrainingPeriod(userData.training_since);

  const handlePrivacyChange = (field: string, value: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditToggle = (field: string) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleCancel = (field: string) => {
    // 編集前の値に戻す
    const originalValue = {
      gender: userData.gender,
      age: userData.age,
      trainingSince: userData.training_since,
      gym: userData.belonging_gyms[0]?.name || "",
      intent: userData.training_intents[0] || "",
      bodyParts: userData.training_intent_body_parts.join(" "),
      display_name: userData.display_name,
    };

    setEditData(prev => ({
      ...prev,
      [field]: originalValue[field as keyof typeof originalValue]
    }));

    setEditMode(prev => ({
      ...prev,
      [field]: false
    }));
  };

  const handleSaveAll = () => {
    // ここでAPIを呼び出してデータを一括保存
    console.log('Saving all data:', { editData, privacySettings, pendingIconFile });

    // 保存成功後、編集モードを全て閉じる
    setEditMode({
      gender: false,
      age: false,
      trainingSince: false,
      gym: false,
      intent: false,
      bodyParts: false
    });

    alert('プロフィールを保存しました');
  };

  const hasChanges = () => {
    return (
      editData.gender !== userData.gender ||
      editData.age !== userData.age ||
      editData.trainingSince !== userData.training_since ||
      editData.gym !== (userData.belonging_gyms[0]?.name || "") ||
      editData.intent !== (userData.training_intents[0] || "") ||
      editData.bodyParts !== userData.training_intent_body_parts.join(" ") ||
      editData.display_name !== userData.display_name ||
      pendingIconFile !== null
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-red-500">{error}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-[13vh]">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-4 border-b">
        <button
          onClick={() => router.back()}
          className="text-2xl text-gray-600"
        >
          <IoArrowBack />
        </button>
        <h1 className="text-lg font-semibold">プロフィールを編集</h1>
        <div></div>
      </header>

      {/* プロフィール画像 / 表示名 編集 */}
      <div className="px-4 py-6 border-b">
        <div className="flex items-center gap-5">
          {/* アイコン（アップロードして即時プレビュー） */}
          <div className="relative">
            <label htmlFor="icon-upload" className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-500/60 cursor-pointer block">
              <Image
                src={userData.icon_url}
                alt="プロフィール画像"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </label>
            <Input
              id="icon-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const preview = URL.createObjectURL(file)
                setUserData(prev => ({ ...prev, icon_url: preview }))
                setPendingIconFile(file)
              }}
            />
          </div>

          {/* 表示名編集 */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm text-gray-600 mb-1">表示名</label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={editData.display_name}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 30)
                  setEditData(prev => ({ ...prev, display_name: value }))
                }}
                placeholder="例）tait"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">{editData.display_name.length}/30</span>
            </div>
          </div>
        </div>
      </div>

      {/* プロフィール情報編集 */}
      <div className="bg-gray-50 px-4 py-6">
        <div className="space-y-6">
          {/* 性別 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-800 font-bold">性別</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePrivacyChange('gender', 'public')}
                  variant={privacySettings.gender === 'public' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  公開
                </Button>
                <Button
                  onClick={() => handlePrivacyChange('gender', 'private')}
                  variant={privacySettings.gender === 'private' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  非公開
                </Button>
              </div>
            </div>

            {editMode.gender ? (
              <div className="flex items-center gap-2">
                <Select value={editData.gender} onValueChange={(value) => setEditData(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="性別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="男性">男性</SelectItem>
                      <SelectItem value="女性">女性</SelectItem>
                      <SelectItem value="その他">その他</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button onClick={() => handleCancel('gender')} variant="outline" size="sm" className="h-8 px-3">
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{editData.gender}</span>
                <Button
                  onClick={() => handleEditToggle('gender')}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <IoPencil className="text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          {/* 年齢 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-800 font-medium">年齢</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePrivacyChange('age', 'public')}
                  variant={privacySettings.age === 'public' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  公開
                </Button>
                <Button
                  onClick={() => handlePrivacyChange('age', 'private')}
                  variant={privacySettings.age === 'private' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  非公開
                </Button>
              </div>
            </div>

            {editMode.age ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={editData.age}
                  onChange={(e) => setEditData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  min="1"
                  max="120"
                />
                <span className="text-gray-500">歳</span>
                <Button onClick={() => handleCancel('age')} variant="outline" size="sm" className="h-8 px-3">
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{editData.age}歳</span>
                <Button
                  onClick={() => handleEditToggle('age')}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <IoPencil className="text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          {/* ジム暦 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-800 font-bold">ジム暦</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePrivacyChange('trainingSince', 'public')}
                  variant={privacySettings.trainingSince === 'public' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  公開
                </Button>
                <Button
                  onClick={() => handlePrivacyChange('trainingSince', 'private')}
                  variant={privacySettings.trainingSince === 'private' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  非公開
                </Button>
              </div>
            </div>

            {editMode.trainingSince ? (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={editData.trainingSince}
                  onChange={(e) => setEditData(prev => ({ ...prev, trainingSince: e.target.value }))}
                  min="1"
                  max="100"
                />
                <Button onClick={() => handleCancel('trainingSince')} variant="outline" size="sm" className="h-8 px-3">
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{trainingPeriod}</span>
                <Button
                  onClick={() => handleEditToggle('trainingSince')}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <IoPencil className="text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          {/* ジム */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-800 font-bold">ジム</span>
            </div>

            {editMode.gym ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={editData.gym}
                  onChange={(e) => setEditData(prev => ({ ...prev, gym: e.target.value }))}
                  placeholder="ジム名を入力"
                />
                <Button onClick={() => handleCancel('gym')} variant="outline" size="sm" className="h-8 px-3">
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{editData.gym || "未設定"}</span>
                <Button
                  onClick={() => handleEditToggle('gym')}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <IoPencil className="text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          {/* 目的 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-800 font-bold">目的</span>
            </div>

            {editMode.intent ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={editData.intent}
                  onChange={(e) => setEditData(prev => ({ ...prev, intent: e.target.value }))}
                  placeholder="目的を入力"
                />
                <Button onClick={() => handleCancel('intent')} variant="outline" size="sm" className="h-8 px-3">
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{editData.intent || "未設定"}</span>
                <Button
                  onClick={() => handleEditToggle('intent')}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <IoPencil className="text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          {/* 鍛える部位 */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-800 font-bold">鍛える部位</span>
            </div>

            {editMode.bodyParts ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={editData.bodyParts}
                  onChange={(e) => setEditData(prev => ({ ...prev, bodyParts: e.target.value }))}
                  placeholder="例: 胸 背中 腕 脚"
                />
                <Button onClick={() => handleCancel('bodyParts')} variant="outline" size="sm" className="h-8 px-3">
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{editData.bodyParts || "未設定"}</span>
                <Button
                  onClick={() => handleEditToggle('bodyParts')}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <IoPencil className="text-gray-500" />
                </Button>
              </div>
            )}
          </div>

          {/* トレーニンググラフ */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-800 font-bold">トレーニンググラフ</span>
              <Button className="font-medium">
                編集
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 一括保存ボタン */}
      <div className="px-4 py-4">
        <Button
          onClick={handleSaveAll}
          disabled={!hasChanges()}
          className="w-full h-12 text-lg font-medium"
        >
          変更を保存
        </Button>
      </div>
    </div>
  )
}

export default ProfileEdit