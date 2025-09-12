'use client'
import React, { useState, useEffect } from 'react'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import SetProfile, { ProfileData } from '@/components/setprofile'
import type { User } from '@supabase/supabase-js'

// 型定義
type RelshipType = 'anyone' | 'followers' | 'following' | 'follow-followers' | 'no-one'

interface PrivacySettings {
    [key: string]: RelshipType | undefined;
    display_name?: RelshipType;
    description?: RelshipType;
    tags?: RelshipType;
    icon?: RelshipType;
    birth_date?: RelshipType;
    age?: RelshipType;
    generation?: RelshipType;
    gender?: RelshipType;
    registered_since?: RelshipType;
    training_since?: RelshipType;
    skill_level?: RelshipType;
    intents?: RelshipType;
    intent_bodyparts?: RelshipType;
    belonging_gyms?: RelshipType;
    followings?: RelshipType;
    followings_count?: RelshipType;
    followers?: RelshipType;
    followers_count?: RelshipType;
    status?: RelshipType;
    status_location?: RelshipType;
    status_menus?: RelshipType;
    status_histories?: RelshipType;
    posts?: RelshipType;
    posts_location?: RelshipType;
    posts_count?: RelshipType;
}

interface PrivacyAnonSettings {
    [key: string]: RelshipType | boolean | undefined;
    completely_hidden?: boolean;
    view_real_profile?: RelshipType;
    display_name?: RelshipType;
    description?: RelshipType;
    tags?: RelshipType;
    icon?: RelshipType;
    birth_date?: RelshipType;
    age?: RelshipType;
    generation?: RelshipType;
    gender?: RelshipType;
    registered_since?: RelshipType;
    training_since?: RelshipType;
    skill_level?: RelshipType;
    intents?: RelshipType;
    intent_bodyparts?: RelshipType;
    followings?: RelshipType;
    followings_count?: RelshipType;
    followers?: RelshipType;
    followers_count?: RelshipType;
}

interface ConfigSettings {
    [key: string]: boolean | RelshipType | string[] | undefined;
    enable_matching_offline?: boolean;
    dm_pair_request_allow?: RelshipType;
    dm_pair_auto_allow?: RelshipType;
    mute_notice_kinds?: string[];
}

interface PrivacySettingsProps {
    settings: PrivacySettings | null;
    anonSettings: PrivacyAnonSettings | null;
    userId: string | undefined;
    onUpdate: (settings: PrivacySettings, anonSettings: PrivacyAnonSettings) => void;
}

interface MiscSettingsProps {
    settings: ConfigSettings | null;
    userId: string | undefined;
    onUpdate: (settings: ConfigSettings) => void;
}

/**
 * ユーザー設定ページ
 */
const SettingsPage = () => {
    const supabase = createBrowserClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [activeTab, setActiveTab] = useState(0)

    // プライバシー設定とconfig設定の状態
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
    const [privacyAnonSettings, setPrivacyAnonSettings] = useState<PrivacyAnonSettings | null>(null)
    const [configSettings, setConfigSettings] = useState<ConfigSettings | null>(null)

    const tabs = [
        { id: 0, label: 'プロフィール編集' },
        { id: 1, label: 'プライバシー設定' },
        { id: 2, label: 'その他設定' }
    ]

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true)
                setError(null)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.replace('/signin')
                    return
                }
                setUser(user)

                // プライバシー設定とconfig設定を読み込み
                await loadSettings(user.id)
            } catch {
                setError('初期化に失敗しました')
            } finally {
                setLoading(false)
            }
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadSettings = async (userId: string) => {
        try {
            // プライバシー設定を取得
            const privacyResponse = await fetch(`/api/users/${userId}/config/privacy`)
            if (privacyResponse.ok) {
                const privacyData = await privacyResponse.json()
                setPrivacySettings(privacyData)
            }

            // プライバシー匿名設定を取得
            const privacyAnonResponse = await fetch(`/api/users/${userId}/config/privacy/anon`)
            if (privacyAnonResponse.ok) {
                const privacyAnonData = await privacyAnonResponse.json()
                setPrivacyAnonSettings(privacyAnonData)
            }

            // config設定を取得
            const configResponse = await fetch(`/api/users/${userId}/config/misc`)
            if (configResponse.ok) {
                const configData = await configResponse.json()
                setConfigSettings(configData)
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        }
    }

    const handleProfileSubmit = async (profileData: ProfileData & { iconFile?: File | null }) => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // ファイルをBase64に変換する関数
            const convertFileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            };

            // 名前からIDへの変換ヘルパー関数
            const convertNamesToIds = async (endpoint: string, names: string[]): Promise<string[]> => {
                if (names.length === 0) return [];

                try {
                    const response = await fetch(`${endpoint}?limit=1000`);
                    if (response.ok) {
                        const data = await response.json();
                        const nameToIdMap = Object.fromEntries(
                            Object.entries(data).map(([id, name]) => [name, id])
                        );
                        return names.map(name => nameToIdMap[name]).filter(Boolean);
                    }
                } catch (error) {
                    console.error(`Failed to convert names to IDs for ${endpoint}:`, error);
                }
                return [];
            };

            // 日付の検証と変換を行うヘルパー関数
            const formatBirthDate = (birthday?: { year?: string; month?: string; day?: string }) => {
                if (!birthday?.year || !birthday?.month || !birthday?.day) {
                    return null;
                }

                if (birthday.year.trim() === '' || birthday.month.trim() === '' || birthday.day.trim() === '') {
                    return null;
                }

                const year = parseInt(birthday.year, 10);
                const month = parseInt(birthday.month, 10);
                const day = parseInt(birthday.day, 10);

                if (isNaN(year) || isNaN(month) || isNaN(day)) {
                    return null;
                }

                if (year < 1900 || year > new Date().getFullYear()) {
                    return null;
                }
                if (month < 1 || month > 12) {
                    return null;
                }
                if (day < 1 || day > 31) {
                    return null;
                }

                const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

                const testDate = new Date(dateStr);
                if (testDate.getFullYear() !== year ||
                    testDate.getMonth() + 1 !== month ||
                    testDate.getDate() !== day) {
                    return null;
                }

                return dateStr;
            };

            const formatTrainingSince = (trainingSince?: { year?: string; month?: string }) => {
                if (!trainingSince?.year || !trainingSince?.month) {
                    return null;
                }

                if (trainingSince.year.trim() === '' || trainingSince.month.trim() === '') {
                    return null;
                }

                const year = parseInt(trainingSince.year, 10);
                const month = parseInt(trainingSince.month, 10);

                if (isNaN(year) || isNaN(month)) {
                    return null;
                }

                if (year < 1900 || year > new Date().getFullYear()) {
                    return null;
                }
                if (month < 1 || month > 12) {
                    return null;
                }

                return `${year}-${month.toString().padStart(2, '0')}-01`;
            };

            const formattedData: Record<string, unknown> = {
                display_name: profileData.displayName,
                description: profileData.bio,
                birth_date: formatBirthDate(profileData.birthday),
                gender: profileData.gender,
                training_since: formatTrainingSince(profileData.trainingSince),
                tags: await convertNamesToIds('/api/tags', profileData.tags || []),
                intents: await convertNamesToIds('/api/intents', profileData.intents || []),
                intent_bodyparts: await convertNamesToIds('/api/bodyparts', profileData.bodyParts || []),
                belonging_gyms: (profileData.gyms || []).map(gym => gym.pub_id)
            };

            // アイコンがある場合のみ追加
            if (profileData.iconFile) {
                formattedData.icon = await convertFileToBase64(profileData.iconFile);
            }

            // undefinedやnullや空文字列の値を除外
            Object.keys(formattedData).forEach(key => {
                const value = formattedData[key];
                if (value === undefined || value === null ||
                    (typeof value === 'string' && value.trim() === '')) {
                    delete formattedData[key];
                }
            });

            console.log('Sending profile data:', formattedData);

            // ハンドルを先に更新（@を付けて送信）
            if (profileData.handle && profileData.handle.trim() !== '') {
                const handleWithAt = profileData.handle.startsWith('@') ? profileData.handle : `@${profileData.handle}`;
                const handleResponse = await fetch(`/api/users/${user.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ handle: handleWithAt })
                });

                if (!handleResponse.ok) {
                    const errorData = await handleResponse.json();
                    console.error('Handle update failed:', errorData);
                    alert(`ハンドル更新に失敗しました: ${errorData.message || 'Unknown error'}`);
                    return;
                }
            }

            const response = await fetch(`/api/users/${user.id}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Profile update failed:', errorData);
                alert(`プロフィール更新に失敗しました: ${errorData.error || 'Unknown error'}`);
                return;
            }

            console.log('Profile updated successfully');
            alert('プロフィールが更新されました');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('プロフィール更新中にエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">読み込み中...</div>
    if (error) return (
        <div className="p-6">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <Button onClick={() => router.refresh()}>再読み込み</Button>
        </div>
    )

    return (
        <main className="max-w-4xl mx-auto p-6 pb-[13vh] space-y-6">
            <h1 className="text-xl font-bold">設定</h1>

            {/* タブナビゲーション */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* タブコンテンツ */}
            <div className="mt-6">
                {activeTab === 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">プロフィール編集</h2>
                        {user?.id && (
                            <SetProfile
                                userId={user.id}
                                onSubmit={handleProfileSubmit}
                                onAfterSubmit={() => {
                                    console.log('Profile updated successfully');
                                }}
                            />
                        )}
                    </div>
                )}

                {activeTab === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">プライバシー設定</h2>
                        <PrivacySettings
                            settings={privacySettings}
                            anonSettings={privacyAnonSettings}
                            userId={user?.id}
                            onUpdate={(newSettings: PrivacySettings, newAnonSettings: PrivacyAnonSettings) => {
                                setPrivacySettings(newSettings)
                                setPrivacyAnonSettings(newAnonSettings)
                            }}
                        />
                    </div>
                )}

                {activeTab === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">その他設定</h2>
                        <MiscSettings
                            settings={configSettings}
                            userId={user?.id}
                            onUpdate={(newSettings: ConfigSettings) => setConfigSettings(newSettings)}
                        />
                    </div>
                )}
            </div>
        </main>
    )
}

// プライバシー設定コンポーネント
const PrivacySettings = ({ settings, anonSettings, userId, onUpdate }: PrivacySettingsProps) => {
    const [localSettings, setLocalSettings] = useState<PrivacySettings>(settings || {})
    const [localAnonSettings, setLocalAnonSettings] = useState<PrivacyAnonSettings>(anonSettings || {})
    const [isChanged, setIsChanged] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setLocalSettings(settings || {})
    }, [settings])

    useEffect(() => {
        setLocalAnonSettings(anonSettings || {})
    }, [anonSettings])

    useEffect(() => {
        const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings || {}) ||
            JSON.stringify(localAnonSettings) !== JSON.stringify(anonSettings || {})
        setIsChanged(hasChanges)
    }, [localSettings, localAnonSettings, settings, anonSettings])

    const relshipOptions = [
        { value: 'anyone', label: '誰でも' },
        { value: 'followers', label: 'フォロワーのみ' },
        { value: 'following', label: 'フォロー中のみ' },
        { value: 'follow-followers', label: '相互フォロー' },
        { value: 'no-one', label: '非公開' }
    ]

    const privacyFields = [
        { key: 'display_name', label: '表示名' },
        { key: 'description', label: '自己紹介' },
        { key: 'tags', label: 'タグ' },
        { key: 'icon', label: 'アイコン' },
        { key: 'birth_date', label: '生年月日' },
        { key: 'age', label: '年齢' },
        { key: 'generation', label: '世代' },
        { key: 'gender', label: '性別' },
        { key: 'registered_since', label: '登録日' },
        { key: 'training_since', label: 'トレーニング開始時期' },
        { key: 'skill_level', label: 'スキルレベル' },
        { key: 'intents', label: 'トレーニング目的' },
        { key: 'intent_bodyparts', label: '鍛えたい部位' },
        { key: 'belonging_gyms', label: '所属ジム' },
        { key: 'followings', label: 'フォロー一覧' },
        { key: 'followings_count', label: 'フォロー数' },
        { key: 'followers', label: 'フォロワー一覧' },
        { key: 'followers_count', label: 'フォロワー数' },
        { key: 'status', label: 'ステータス' },
        { key: 'status_location', label: 'ステータス位置' },
        { key: 'status_menus', label: 'ステータスメニュー' },
        { key: 'status_histories', label: 'ステータス履歴' },
        { key: 'posts', label: '投稿' },
        { key: 'posts_location', label: '投稿位置' },
        { key: 'posts_count', label: '投稿数' }
    ]

    const handleFieldChange = (field: string, value: string) => {
        setLocalSettings((prev: PrivacySettings) => ({
            ...prev,
            [field]: value as RelshipType
        }))
    }

    const handleAnonFieldChange = (field: string, value: string) => {
        setLocalAnonSettings((prev: PrivacyAnonSettings) => ({
            ...prev,
            [field]: value as RelshipType
        }))
    }

    const handleSave = async () => {
        if (!userId || !isChanged) return

        try {
            setIsSaving(true)

            // 通常プライバシー設定を保存
            const normalResponse = await fetch(`/api/users/${userId}/config/privacy`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(localSettings)
            })

            if (!normalResponse.ok) {
                throw new Error('Failed to update normal privacy settings')
            }

            // 匿名プライバシー設定を保存
            const anonResponse = await fetch(`/api/users/${userId}/config/privacy/anon`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(localAnonSettings)
            })

            if (!anonResponse.ok) {
                throw new Error('Failed to update anonymous privacy settings')
            }

            const normalData = await normalResponse.json()
            const anonData = await anonResponse.json()

            onUpdate(normalData, anonData)
            console.log('プライバシー設定が更新されました')
            setIsChanged(false)
        } catch (error) {
            console.error('Error updating privacy settings:', error)
            alert('プライバシー設定の更新に失敗しました')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-md font-medium mb-4">可視性設定</h3>

                {/* 通常モード設定 */}
                <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-800 mb-4">通常モード</h4>
                    <div className="space-y-4">
                        {privacyFields.map((field) => (
                            <div key={field.key} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 flex-1">
                                    {field.label}
                                </label>
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={localSettings[field.key] || 'anyone'}
                                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                        className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {relshipOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 匿名モード設定 */}
                <div>
                    <h4 className="text-sm font-medium text-gray-800 mb-4">匿名モード</h4>
                    <div className="space-y-4">
                        {privacyFields.map((field) => (
                            <div key={`anon-${field.key}`} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 flex-1">
                                    {field.label}
                                </label>
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={(typeof localAnonSettings[field.key] === 'string') ? localAnonSettings[field.key] as string : 'anyone'}
                                        onChange={(e) => handleAnonFieldChange(field.key, e.target.value)}
                                        className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {relshipOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isChanged && (
                <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? '保存中...' : '変更を保存'}
                    </button>
                </div>
            )}
        </div>
    )
}

// その他設定コンポーネント
const MiscSettings = ({ settings, userId, onUpdate }: MiscSettingsProps) => {
    const [localSettings, setLocalSettings] = useState<ConfigSettings>(settings || {})
    const [isChanged, setIsChanged] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setLocalSettings(settings || {})
    }, [settings])

    useEffect(() => {
        const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings || {})
        setIsChanged(hasChanges)
    }, [localSettings, settings])

    const handleToggle = (field: string, value: boolean) => {
        setLocalSettings((prev: ConfigSettings) => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSelectChange = (field: string, value: string) => {
        setLocalSettings((prev: ConfigSettings) => ({
            ...prev,
            [field]: value as RelshipType
        }))
    }

    const handleNotificationToggle = (noticeKind: string, enabled: boolean) => {
        setLocalSettings((prev: ConfigSettings) => {
            const currentMuteKinds = prev.mute_notice_kinds || []
            let newMuteKinds

            if (enabled) {
                // 有効にする場合は、ミュートリストから削除
                newMuteKinds = currentMuteKinds.filter(kind => kind !== noticeKind)
            } else {
                // 無効にする場合は、ミュートリストに追加
                newMuteKinds = [...currentMuteKinds, noticeKind]
            }

            return {
                ...prev,
                mute_notice_kinds: newMuteKinds
            }
        })
    }

    const handleSave = async () => {
        if (!userId || !isChanged) return

        try {
            setIsSaving(true)

            // frontend_ux と dmgroup 系を除外したデータを送信
            const filteredSettings = { ...localSettings }
            delete filteredSettings.frontend_ux
            delete filteredSettings.dm_group_request_allow
            delete filteredSettings.dm_group_auto_allow

            const response = await fetch(`/api/users/${userId}/config/misc`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filteredSettings)
            })

            if (!response.ok) {
                throw new Error('Failed to update config settings')
            }

            const updatedSettings = await response.json()
            onUpdate(updatedSettings)
            alert('設定が更新されました')
        } catch (error) {
            console.error('Error updating config settings:', error)
            alert('設定の更新に失敗しました')
        } finally {
            setIsSaving(false)
        }
    }

    const relshipOptions = [
        { value: 'anyone', label: '誰でも' },
        { value: 'followers', label: 'フォロワーのみ' },
        { value: 'following', label: 'フォロー中のみ' },
        { value: 'follow-followers', label: '相互フォロー' },
        { value: 'no-one', label: '非公開' }
    ]

    // 通知種類の定義（仕様書準拠のMVP対象のみ）
    const notificationTypes = [
        { kind: 'matching/offline/same-gym', label: '同じジムでのマッチング' },
        { kind: 'social/follower-added', label: 'フォロワー追加' },
        { kind: 'social/following-posted', label: 'フォロー中のユーザーの投稿' },
        { kind: 'social/following-started-training', label: 'フォロー中のユーザーのトレーニング開始' },
        { kind: 'social/training-partner-request', label: '合トレ申請' },
        { kind: 'post/liked', label: '投稿にいいね' },
        { kind: 'post/commented', label: '投稿にコメント' },
        { kind: 'post/mentioned', label: '投稿でメンション' },
        { kind: 'dm/pair/invite-received', label: 'DM招待受信' },
        { kind: 'dm/pair/request-accepted', label: 'DM申請承認' },
        { kind: 'dm/pair/received', label: 'DMメッセージ受信' }
    ]

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-md font-medium mb-4">マッチング設定</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            オフラインマッチングを有効にする
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localSettings.enable_matching_offline || false}
                                onChange={(e) => handleToggle('enable_matching_offline', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-md font-medium mb-4">DMリクエスト設定</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            DM ペアリクエストを許可する
                        </label>
                        <select
                            value={localSettings.dm_pair_request_allow || 'anyone'}
                            onChange={(e) => handleSelectChange('dm_pair_request_allow', e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {relshipOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                            DM ペア自動許可する
                        </label>
                        <select
                            value={localSettings.dm_pair_auto_allow || 'follow-followers'}
                            onChange={(e) => handleSelectChange('dm_pair_auto_allow', e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {relshipOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-md font-medium mb-4">通知設定</h3>
                <div className="space-y-3">
                    {notificationTypes.map((notificationType) => {
                        const isEnabled = !(localSettings.mute_notice_kinds || []).includes(notificationType.kind)
                        return (
                            <div key={notificationType.kind} className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">
                                    {notificationType.label}
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isEnabled}
                                        onChange={(e) => handleNotificationToggle(notificationType.kind, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        )
                    })}
                </div>
            </div>

            {isChanged && (
                <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? '保存中...' : '変更を保存'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default SettingsPage