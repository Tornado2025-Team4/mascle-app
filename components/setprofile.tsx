import React, { useRef, useState, useEffect } from 'react';
import GymSelector from './gym-selector';

export type ProfileData = {
    iconUrl?: string;
    handle: string;
    displayName: string;
    bio?: string;
    tags?: string[];
    birthday?: { year?: string; month?: string; day?: string };
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined;
    trainingSince?: { year?: string; month?: string };
    intents?: string[];
    bodyParts?: string[];
    gyms?: Gym[];
};

export type Gym = {
    pub_id: string;
    name: string;
    chain_name?: string;
    latitude?: number;
    longitude?: number;
};

export type SetProfileProps = {
    initialProfile?: ProfileData;
    userId?: string; // ユーザーIDを渡す（初期データ取得用）
    onSubmit: (profile: ProfileData & { iconFile?: File | null }) => Promise<void>;
    onAfterSubmit?: () => void;
};

const GENDER_OPTIONS = [
    { value: '', label: '選択してください' },
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'その他' },
    { value: 'prefer_not_to_say', label: '無回答' },
] as const;

// 画像を中央正方形に切り抜く関数
const cropImageToSquare = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            const size = Math.min(img.width, img.height);
            const offsetX = (img.width - size) / 2;
            const offsetY = (img.height - size) / 2;

            canvas.width = size;
            canvas.height = size;

            ctx?.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);

            canvas.toBlob((blob) => {
                if (blob) {
                    const croppedFile = new File([blob], file.name, { type: file.type });
                    resolve(croppedFile);
                } else {
                    resolve(file);
                }
            }, file.type);
        };

        img.src = URL.createObjectURL(file);
    });
};

export const SetProfile: React.FC<SetProfileProps> = ({ initialProfile, userId, onSubmit, onAfterSubmit }) => {
    const [profile, setProfile] = useState<ProfileData>(initialProfile || {
        handle: '',
        displayName: '',
        bio: '',
        tags: [],
        birthday: {},
        gender: undefined,
        trainingSince: {},
        intents: [],
        bodyParts: [],
        gyms: [],
    });
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [iconPreview, setIconPreview] = useState(initialProfile?.iconUrl || '');
    const [isChanged, setIsChanged] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState<Record<string, string>>({});
    const [intentSuggestions, setIntentSuggestions] = useState<Record<string, string>>({});
    const [bodyPartSuggestions, setBodyPartSuggestions] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(!!userId);
    const [isGymSelectorOpen, setIsGymSelectorOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 初期データの取得
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!userId) return;

            try {
                setIsLoading(true);
                const response = await fetch(`/api/users/${userId}/profile`);
                if (response.ok) {
                    const data = await response.json();

                    // APIレスポンスをProfileData形式に変換
                    const convertedProfile: ProfileData = {
                        iconUrl: data.icon_url,
                        handle: (data.handle || '').replace(/^@/, ''), // @を取り除く
                        displayName: data.display_name || '',
                        bio: data.description || '',
                        tags: data.tags?.map((tag: { pub_id: string; name: string }) => tag.name) || [],
                        birthday: data.birth_date ? parseBirthDate(data.birth_date) : {},
                        gender: data.gender || undefined,
                        trainingSince: data.training_since ? parseTrainingSince(data.training_since) : {},
                        intents: data.intents?.map((intent: { pub_id: string; intent: string }) => intent.intent) || [],
                        bodyParts: data.intent_bodyparts?.map((bodypart: { pub_id: string; bodypart: string }) => bodypart.bodypart) || [],
                        gyms: data.belonging_gyms?.map((gym: {
                            pub_id: string;
                            name: string;
                            gymchain?: { pub_id: string; name: string; icon_url?: string };
                            latitude?: number;
                            longitude?: number;
                        }) => ({
                            pub_id: gym.pub_id,
                            name: gym.name,
                            chain_name: gym.gymchain?.name || null, // gymchain.nameを使用
                            latitude: gym.latitude,
                            longitude: gym.longitude
                        })) || [],
                    };

                    setProfile(convertedProfile);
                    setIconPreview(data.icon_url || '');
                }
            } catch (error) {
                console.error('Failed to fetch initial profile data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [userId]);

    // 日付文字列をパース
    const parseBirthDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn('Invalid birth date:', dateStr);
                return {};
            }
            return {
                year: date.getFullYear().toString(),
                month: (date.getMonth() + 1).toString().padStart(2, '0'),
                day: date.getDate().toString().padStart(2, '0'),
            };
        } catch (error) {
            console.error('Error parsing birth date:', dateStr, error);
            return {};
        }
    };

    const parseTrainingSince = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn('Invalid training since date:', dateStr);
                return {};
            }
            return {
                year: date.getFullYear().toString(),
                month: (date.getMonth() + 1).toString().padStart(2, '0'),
            };
        } catch (error) {
            console.error('Error parsing training since date:', dateStr, error);
            return {};
        }
    };

    // 変更検知
    useEffect(() => {
        const initialProfileForComparison = initialProfile || {
            handle: '', displayName: '', bio: '', tags: [], birthday: {},
            gender: undefined, trainingSince: {}, intents: [], bodyParts: [], gyms: []
        };
        setIsChanged(JSON.stringify(profile) !== JSON.stringify(initialProfileForComparison) || !!iconFile);
    }, [profile, iconFile, initialProfile]);    // アイコン画像選択
    const handleIconEdit = () => {
        fileInputRef.current?.click();
    };
    const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // 画像を中央正方形に切り抜き
                const croppedFile = await cropImageToSquare(file);
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setIconPreview(ev.target?.result as string);
                    setIconFile(croppedFile);
                };
                reader.readAsDataURL(croppedFile);
            } catch (error) {
                console.error('Failed to crop image:', error);
                // エラー時は元の画像を使用
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setIconPreview(ev.target?.result as string);
                    setIconFile(file);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    // ハンドルID・ディスプレイネーム・自己紹介などの入力
    function handleChange<K extends keyof ProfileData>(field: K, value: ProfileData[K]) {
        setProfile((prev) => ({ ...prev, [field]: value }));
    }

    // APIからタグ候補を取得
    useEffect(() => {
        const fetchTagSuggestions = async () => {
            if (tagInput.length > 0) {
                try {
                    const response = await fetch(`/api/tags?name=${encodeURIComponent(tagInput)}&limit=10`);
                    if (response.ok) {
                        const data = await response.json();
                        setTagSuggestions(data);
                    }
                } catch (error) {
                    console.error('Failed to fetch tag suggestions:', error);
                }
            } else {
                setTagSuggestions({});
            }
        };
        const timeoutId = setTimeout(fetchTagSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [tagInput]);

    // APIから目的候補を取得
    useEffect(() => {
        const fetchIntents = async () => {
            try {
                const response = await fetch('/api/intents?limit=100');
                if (response.ok) {
                    const data = await response.json();
                    setIntentSuggestions(data);
                }
            } catch (error) {
                console.error('Failed to fetch intents:', error);
            }
        };
        fetchIntents();
    }, []);

    // APIから部位候補を取得
    useEffect(() => {
        const fetchBodyParts = async () => {
            try {
                const response = await fetch('/api/bodyparts?limit=100');
                if (response.ok) {
                    const data = await response.json();
                    setBodyPartSuggestions(data);
                }
            } catch (error) {
                console.error('Failed to fetch bodyparts:', error);
            }
        };
        fetchBodyParts();
    }, []);

    const handleAddTag = async (tagNameOrId: string) => {
        if (!profile.tags?.includes(tagNameOrId)) {
            // 既存のタグかどうかチェック
            const isExistingTag = Object.values(tagSuggestions).includes(tagNameOrId);

            if (!isExistingTag) {
                // 新規タグの場合、作成APIを呼び出し
                try {
                    const response = await fetch('/api/tags', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: tagNameOrId })
                    });

                    if (!response.ok) {
                        console.error('Failed to create new tag:', tagNameOrId);
                        return;
                    }
                } catch (error) {
                    console.error('Error creating new tag:', error);
                    return;
                }
            }

            setProfile((prev) => ({ ...prev, tags: [...(prev.tags || []), tagNameOrId] }));
        }
        setTagInput('');
        setTagSuggestions({});
    };
    const handleRemoveTag = (tagNameOrId: string) => {
        setProfile((prev) => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tagNameOrId) }));
    };

    // ジム関連のハンドラー
    const handleAddGym = (gym: Gym) => {
        setProfile((prev) => {
            // 重複チェック：同じpub_idのジムが既に存在するかチェック
            const existingGym = (prev.gyms || []).find(g => g.pub_id === gym.pub_id);
            if (existingGym) {
                console.warn('Gym already exists:', gym.pub_id);
                return prev; // 既に存在する場合は追加しない
            }
            return {
                ...prev,
                gyms: [...(prev.gyms || []), gym]
            };
        });
        setIsGymSelectorOpen(false);
    };

    const handleRemoveGym = (gymId: string) => {
        setProfile((prev) => ({
            ...prev,
            gyms: (prev.gyms || []).filter(g => g.pub_id !== gymId)
        }));
    };

    // 適用ボタン
    const handleSubmit = async () => {
        setIsSubmitting(true);
        await onSubmit({ ...profile, iconFile });
        setIsSubmitting(false);
        setIsChanged(false);
        onAfterSubmit?.();
    };

    return (
        <div style={{
            background: '#fff',
            color: '#000',
            padding: 12,
            borderRadius: 16,
            maxWidth: 580,
            margin: '0 auto',
            position: 'relative',
            marginBottom: 120 // フッターナビゲーションのための余白
        }}>
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}>
                    <div style={{ fontSize: 16, color: '#666' }}>プロフィール情報を読み込み中...</div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
                        <div style={{ position: 'relative' }}>
                            {iconPreview ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={iconPreview}
                                    alt="アイコン"
                                    style={{
                                        marginLeft: 3,
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '2px solid #e5e7eb',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: '#f3f4f6',
                                    border: '2px solid #e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 32,
                                    color: '#9ca3af'
                                }}>
                                    👤
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleIconEdit}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    bottom: -40,
                                    fontSize: 13,
                                    background: '#f8fafc',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    padding: '6px 6px',
                                    cursor: 'pointer',
                                    color: '#374151',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#f1f5f9';
                                    e.currentTarget.style.borderColor = '#9ca3af';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                }}
                            >
                                アイコン編集
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleIconChange} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ fontWeight: 700, fontSize: 20, color: '#6b7280' }}>@</span>
                                <input
                                    type="text"
                                    value={profile.handle}
                                    onChange={e => handleChange('handle', e.target.value.replace(/^@/, ''))}
                                    placeholder="ハンドルID"
                                    style={{
                                        fontSize: 20,
                                        fontWeight: 700,
                                        border: 'none',
                                        borderBottom: '2px solid #e5e7eb',
                                        outline: 'none',
                                        background: 'transparent',
                                        width: 200,
                                        padding: '4px 0',
                                        color: '#111827'
                                    }}
                                    pattern="^[a-zA-Z0-9_]+$"
                                    maxLength={20}
                                />
                            </div>
                            <input
                                type="text"
                                value={profile.displayName}
                                onChange={e => handleChange('displayName', e.target.value)}
                                placeholder="ディスプレイネーム"
                                style={{
                                    fontSize: 18,
                                    border: 'none',
                                    borderBottom: '2px solid #e5e7eb',
                                    outline: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    padding: '4px 0 4px 30px',
                                    color: '#374151'
                                }}
                                maxLength={32}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: 48 }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#374151' }}>自己紹介</label>
                        <textarea
                            value={profile.bio || ''}
                            onChange={e => handleChange('bio', e.target.value)}
                            placeholder="自己紹介を入力してください"
                            style={{
                                width: '100%',
                                minHeight: 80,
                                border: '1px solid #d1d5db',
                                borderRadius: 12,
                                padding: 12,
                                fontSize: 15,
                                background: '#fafbfc',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                            maxLength={200}
                        />
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 12, color: '#374151' }}>タグ</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {(profile.tags || []).map(tag => (
                                <span key={tag} style={{
                                    background: '#f3f4f6',
                                    borderRadius: 20,
                                    padding: '6px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 14,
                                    color: '#374151',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#9ca3af',
                                            cursor: 'pointer',
                                            fontSize: 16,
                                            width: 16,
                                            height: 16,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            padding: 0
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.color = '#ef4444';
                                            e.currentTarget.style.background = '#fee2e2';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.color = '#9ca3af';
                                            e.currentTarget.style.background = 'none';
                                        }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && tagInput.trim()) {
                                            e.preventDefault();
                                            handleAddTag(tagInput);
                                        }
                                    }}
                                    placeholder="タグを追加"
                                    style={{
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        padding: '8px 12px',
                                        width: 200,
                                        fontSize: 14,
                                        background: '#ffffff'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (tagInput.trim()) {
                                            handleAddTag(tagInput);
                                        }
                                    }}
                                    disabled={!tagInput.trim()}
                                    style={{
                                        background: tagInput.trim() ? '#111827' : '#9ca3af',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '8px 16px',
                                        fontSize: 14,
                                        fontWeight: 500,
                                        cursor: tagInput.trim() ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        if (tagInput.trim()) {
                                            e.currentTarget.style.background = '#1f2937';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (tagInput.trim()) {
                                            e.currentTarget.style.background = '#111827';
                                        }
                                    }}
                                >
                                    追加
                                </button>
                            </div>
                            {Object.keys(tagSuggestions).length > 0 && (
                                <div style={{
                                    background: '#fff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    marginTop: 4,
                                    position: 'absolute',
                                    zIndex: 10,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    minWidth: 200,
                                    maxHeight: 200,
                                    overflowY: 'auto'
                                }}>
                                    {Object.entries(tagSuggestions).map(([id, name]) => (
                                        <div
                                            key={id}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                fontSize: 14
                                            }}
                                            onClick={() => handleAddTag(name)}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#f3f4f6';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = '#fff';
                                            }}
                                        >
                                            {name}
                                        </div>
                                    ))}
                                    {!Object.values(tagSuggestions).includes(tagInput) && tagInput.trim() && (
                                        <div
                                            style={{
                                                padding: '8px 12px',
                                                color: '#6b7280',
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                borderTop: '1px solid #e5e7eb'
                                            }}
                                            onClick={() => handleAddTag(tagInput)}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#f3f4f6';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = '#fff';
                                            }}
                                        >
                                            「{tagInput}」を新規作成
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 200 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>生年月日</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={profile.birthday?.year || ''}
                                    onChange={e => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');

                                        // 4文字以下で数字のみの場合は更新
                                        if (value.length <= 4) {
                                            handleChange('birthday', { ...profile.birthday, year: value });
                                        }
                                    }}
                                    placeholder="年"
                                    style={{
                                        width: 60,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        padding: '6px 8px',
                                        textAlign: 'center',
                                        fontSize: 14
                                    }}
                                    maxLength={4}
                                />
                                <span style={{ color: '#6b7280' }}>年</span>
                                <input
                                    type="text"
                                    value={profile.birthday?.month || ''}
                                    onChange={e => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        const numValue = parseInt(value, 10);
                                        if (value === '' || (numValue >= 1 && numValue <= 12)) {
                                            handleChange('birthday', { ...profile.birthday, month: value });
                                        }
                                    }}
                                    placeholder="月"
                                    style={{
                                        width: 40,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        padding: '6px 8px',
                                        textAlign: 'center',
                                        fontSize: 14
                                    }}
                                    maxLength={2}
                                />
                                <span style={{ color: '#6b7280' }}>月</span>
                                <input
                                    type="text"
                                    value={profile.birthday?.day || ''}
                                    onChange={e => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        const numValue = parseInt(value, 10);
                                        if (value === '' || (numValue >= 1 && numValue <= 31)) {
                                            handleChange('birthday', { ...profile.birthday, day: value });
                                        }
                                    }}
                                    placeholder="日"
                                    style={{
                                        width: 40,
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        padding: '6px 8px',
                                        textAlign: 'center',
                                        fontSize: 14
                                    }}
                                    maxLength={2}
                                />
                                <span style={{ color: '#6b7280' }}>日</span>
                            </div>
                        </div>
                        <div style={{ minWidth: 150 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>性別</div>
                            <select
                                value={profile.gender || ''}
                                onChange={e => handleChange('gender', e.target.value as ProfileData['gender'])}
                                style={{
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    padding: '6px 8px',
                                    fontSize: 14,
                                    background: '#ffffff',
                                    minWidth: 120
                                }}
                            >
                                {GENDER_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: 28 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>トレーニング開始時期</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                type="text"
                                value={profile.trainingSince?.year || ''}
                                onChange={e => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleChange('trainingSince', { ...profile.trainingSince, year: value });
                                }}
                                placeholder="年"
                                style={{
                                    width: 60,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    padding: '6px 8px',
                                    textAlign: 'center',
                                    fontSize: 14
                                }}
                                maxLength={4}
                            />
                            <span style={{ color: '#6b7280' }}>年</span>
                            <input
                                type="text"
                                value={profile.trainingSince?.month || ''}
                                onChange={e => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    const numValue = parseInt(value, 10);
                                    if (value === '' || (numValue >= 1 && numValue <= 12)) {
                                        handleChange('trainingSince', { ...profile.trainingSince, month: value });
                                    }
                                }}
                                placeholder="月"
                                style={{
                                    width: 40,
                                    border: '1px solid #d1d5db',
                                    borderRadius: 8,
                                    padding: '6px 8px',
                                    textAlign: 'center',
                                    fontSize: 14
                                }}
                                maxLength={2}
                            />
                            <span style={{ color: '#6b7280' }}>月</span>
                        </div>
                    </div>
                    <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>トレーニング目的</div>
                            <div style={{
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                padding: 12,
                                background: '#ffffff',
                                maxHeight: 180,
                                overflowY: 'auto'
                            }}>
                                {Object.entries(intentSuggestions).map(([id, name]) => (
                                    <label key={id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 8,
                                        fontSize: 14,
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={(profile.intents || []).includes(name as string)}
                                            onChange={e => {
                                                const currentIntents = profile.intents || [];
                                                if (e.target.checked) {
                                                    handleChange('intents', [...currentIntents, name as string]);
                                                } else {
                                                    handleChange('intents', currentIntents.filter(intent => intent !== name));
                                                }
                                            }}
                                            style={{ marginRight: 4 }}
                                        />
                                        {name as string}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>鍛えたい部位</div>
                            <div style={{
                                border: '1px solid #d1d5db',
                                borderRadius: 8,
                                padding: 12,
                                background: '#ffffff',
                                maxHeight: 180,
                                overflowY: 'auto'
                            }}>
                                {Object.entries(bodyPartSuggestions).map(([id, name]) => (
                                    <label key={id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 8,
                                        fontSize: 14,
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={(profile.bodyParts || []).includes(name as string)}
                                            onChange={e => {
                                                const currentBodyParts = profile.bodyParts || [];
                                                if (e.target.checked) {
                                                    handleChange('bodyParts', [...currentBodyParts, name as string]);
                                                } else {
                                                    handleChange('bodyParts', currentBodyParts.filter(part => part !== name));
                                                }
                                            }}
                                            style={{ marginRight: 4 }}
                                        />
                                        {name as string}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* よく行くジム */}
                    <div style={{ marginTop: 28 }}>
                        <div style={{ fontWeight: 600, marginBottom: 12, color: '#374151' }}>よく行くジム</div>

                        {/* 設定済みのジム一覧 */}
                        <div style={{ marginBottom: 16 }}>
                            {(profile.gyms || []).map(gym => (
                                <div
                                    key={gym.pub_id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: '#f8fafc',
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        marginBottom: 8
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                                            {gym.chain_name ? `${gym.chain_name} - ${gym.name}` : gym.name}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveGym(gym.pub_id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#94a3b8',
                                            cursor: 'pointer',
                                            fontSize: 18,
                                            width: 24,
                                            height: 24,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            padding: 0
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.color = '#ef4444';
                                            e.currentTarget.style.background = '#fee2e2';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.color = '#94a3b8';
                                            e.currentTarget.style.background = 'none';
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            {(profile.gyms || []).length === 0 && (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    color: '#64748b',
                                    fontSize: 14,
                                    background: '#f8fafc',
                                    borderRadius: 8,
                                    border: '1px dashed #cbd5e1'
                                }}>
                                    まだジムが設定されていません
                                </div>
                            )}
                        </div>

                        {/* よく行くジムを追加ボタン */}
                        <button
                            type="button"
                            onClick={() => setIsGymSelectorOpen(true)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#e2e8f0';
                                e.currentTarget.style.borderColor = '#94a3b8';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                        >
                            + よく行くジムを追加
                        </button>
                    </div>
                </>
            )}

            {/* ジム選択オーバーレイ */}
            <GymSelector
                isOpen={isGymSelectorOpen}
                onClose={() => setIsGymSelectorOpen(false)}
                onSelect={handleAddGym}
            />

            {/* 適用ボタン（変更時のみ下部にポップアップ表示） */}
            {isChanged && (
                <div style={{ position: 'fixed', left: 0, right: 0, bottom: 100, display: 'flex', justifyContent: 'center', zIndex: 100 }}>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            background: '#111827',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 24,
                            padding: '14px 32px',
                            fontSize: 16,
                            fontWeight: 600,
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isSubmitting ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.background = '#1f2937';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.background = '#111827';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {isSubmitting ? '適用中...' : '適用'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SetProfile;
