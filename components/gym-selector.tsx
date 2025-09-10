import React, { useState, useEffect, useRef, useCallback } from 'react';
import type * as L from 'leaflet';
import { Gym } from './setprofile';

export type GymSelectorProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (gym: Gym) => void;
};

type Chain = {
    pub_id: string;
    name: string;
};

interface WindowWithSelectGym extends Window {
    selectGym?: (gymId: string) => void;
}

const GymSelector: React.FC<GymSelectorProps> = ({ isOpen, onClose, onSelect }) => {
    const [activeTab, setActiveTab] = useState<'search' | 'map'>('search');
    const [chains, setChains] = useState<Chain[]>([]);
    const [selectedChain, setSelectedChain] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Gym[]>([]);
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([35.6762, 139.6503]); // 皇居の座標
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);

    // オーバーレイが最初に開かれるときと閉じられるときの状態管理
    useEffect(() => {
        if (isOpen) {
            setActiveTab('search');
            setSelectedChain('');
            setSearchResults([]);
            setLoading(false);
            // searchTermはタブ切り替え時にリセットしない
        } else {
            // ダイアログが閉じられたときにsearchTermをリセット
            setSearchTerm('');
        }
    }, [isOpen]);

    // 近くのジムを検索
    const fetchNearbyGyms = useCallback(async () => {
        if (!mapInstance.current) return;

        const bounds = mapInstance.current.getBounds();
        const center = mapInstance.current.getCenter();
        const ne = bounds.getNorthEast();
        const distance = center.distanceTo(ne) * 3; // 3倍の範囲

        try {
            const params = new URLSearchParams({
                lat: center.lat.toString(),
                lng: center.lng.toString(),
                radius: distance.toString(),
                limit: '50'
            });
            if (selectedChain) {
                params.append('chain_id', selectedChain);
            }

            const response = await fetch(`/api/gyms?${params}`);
            if (response.ok) {
                const nearbyGymsData = await response.json();

                // APIレスポンスの実際の構造に合わせて修正
                const gymArray: Gym[] = nearbyGymsData.map((gym: {
                    pub_id: string;
                    name: string;
                    photo_url?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    chain?: { pub_id: string; name: string; icon_url?: string | null };
                }) => ({
                    pub_id: gym.pub_id,
                    name: gym.name,
                    photo_rel_id: null, // photo_urlから変換する場合は別途処理が必要
                    latitude: gym.latitude,
                    longitude: gym.longitude,
                    chain_name: gym.chain?.name || null,
                    distance: 0 // 距離計算は必要に応じて追加
                }));

                // 既存のマーカーをクリア
                if (mapInstance.current) {
                    mapInstance.current.eachLayer((layer: L.Layer) => {
                        if ((layer as unknown as { isGymMarker?: boolean }).isGymMarker) {
                            mapInstance.current?.removeLayer(layer);
                        }
                    });
                }

                // 新しいマーカーを追加
                const LeafletModule = await import('leaflet');
                gymArray.forEach((gym: Gym) => {
                    if (gym.latitude && gym.longitude && mapInstance.current) {
                        const marker = LeafletModule.default.marker([gym.latitude, gym.longitude])
                            .addTo(mapInstance.current);

                        const displayName = gym.chain_name ? `${gym.chain_name} - ${gym.name}` : gym.name;
                        marker.bindPopup(`
                            <div>
                                <h3>${displayName}</h3>
                                <button onclick="window.selectGym('${gym.pub_id}')" style="
                                    background: #111827;
                                    color: white;
                                    border: none;
                                    padding: 8px 16px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    margin-top: 8px;
                                ">選択</button>
                            </div>
                        `);

                        // カスタムプロパティを追加
                        (marker as unknown as { isGymMarker: boolean }).isGymMarker = true;
                    }
                });

                // グローバル関数を設定（ポップアップから呼び出すため）
                (window as WindowWithSelectGym).selectGym = (gymId: string) => {
                    const selectedGym = gymArray.find((g: Gym) => g.pub_id === gymId);
                    if (selectedGym) {
                        onSelect(selectedGym);
                    }
                };
            }
        } catch (error) {
            console.error('Failed to fetch nearby gyms:', error);
        }
    }, [selectedChain, onSelect]);

    // チェーン一覧を取得
    useEffect(() => {
        const fetchChains = async () => {
            try {
                const response = await fetch('/api/gymchains?limit=100');
                if (response.ok) {
                    const data = await response.json();

                    // データ形式を統一
                    let chainArray: Chain[] = [];
                    if (Array.isArray(data)) {
                        chainArray = data;
                    } else {
                        chainArray = Object.entries(data).map(([id, chainData]: [string, unknown]) => {
                            // chainDataがオブジェクトの場合はnameプロパティを取得、文字列の場合はそのまま使用
                            const name = typeof chainData === 'object' && chainData !== null
                                ? (chainData as Record<string, unknown>).name as string
                                : chainData as string;

                            return {
                                pub_id: id,
                                name: name
                            };
                        });
                    }

                    setChains(chainArray);
                }
            } catch (error) {
                console.error('Failed to fetch chains:', error);
            }
        };
        if (isOpen) {
            fetchChains();
        }
    }, [isOpen]);

    // 現在地を取得
    useEffect(() => {
        if (isOpen && activeTab === 'map') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setMapCenter([position.coords.latitude, position.coords.longitude]);
                    },
                    (error) => {
                        console.warn('位置情報の取得に失敗しました。皇居を中心に表示します。', error);
                        // 皇居の座標をデフォルトとして使用
                    }
                );
            }
        }
    }, [isOpen, activeTab]);

    // 地図の初期化（Leafletライブラリを動的にロード）
    useEffect(() => {
        if (isOpen && activeTab === 'map' && mapRef.current && !mapInstance.current) {
            const initMap = async () => {
                try {
                    // Leafletライブラリを動的にロード
                    const L = await import('leaflet');

                    // CSSを動的にロード（requireの代わりにlinkタグで追加）
                    if (!document.querySelector('link[href*="leaflet"]')) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                        document.head.appendChild(link);
                    }

                    // 地図を初期化
                    mapInstance.current = L.default.map(mapRef.current!).setView(mapCenter, 13);

                    // タイルレイヤーを追加
                    L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(mapInstance.current);

                    // 地図の移動/ズーム時の処理
                    mapInstance.current.on('moveend zoomend', () => {
                        fetchNearbyGyms();
                    });

                    // 初回ジム検索
                    fetchNearbyGyms();
                } catch (error) {
                    console.error('地図の初期化に失敗しました:', error);
                    // エラーの場合は地図を無効化
                    if (mapRef.current) {
                        mapRef.current.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">地図を読み込めませんでした</div>';
                    }
                }
            };

            initMap();
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [isOpen, activeTab, mapCenter, fetchNearbyGyms]);

    // 検索結果を取得
    useEffect(() => {
        const searchGyms = async () => {
            if (searchTerm.length === 0) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                const params = new URLSearchParams({
                    name: searchTerm,
                    limit: '20'
                });
                if (selectedChain) {
                    params.append('chain_id', selectedChain);
                }

                const response = await fetch(`/api/gyms?${params}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('API Response:', data); // デバッグ用ログ

                    // APIレスポンスの実際の構造に合わせて修正
                    const gymArray: Gym[] = data.map((gym: {
                        pub_id: string;
                        name: string;
                        photo_url?: string | null;
                        latitude?: number | null;
                        longitude?: number | null;
                        chain?: { pub_id: string; name: string; icon_url?: string | null };
                        address?: string | null;
                    }) => ({
                        pub_id: gym.pub_id,
                        name: gym.name,
                        chain_name: gym.chain?.name || null,
                        latitude: gym.latitude,
                        longitude: gym.longitude,
                        address: gym.address
                    }));

                    setSearchResults(gymArray);
                }
            } catch (error) {
                console.error('Failed to search gyms:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchGyms, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedChain]);

    const formatGymName = (gym: Gym) => {
        const name = typeof gym.name === 'string' ? gym.name : JSON.stringify(gym.name);
        const chainName = typeof gym.chain_name === 'string' ? gym.chain_name : '';
        return chainName ? `${chainName} - ${name}` : name;
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000,
            padding: 20
        }}
            onClick={(e) => {
                // 背景クリック時の処理
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                width: '95%',
                height: '85%',
                maxWidth: 1000,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
                onClick={(e) => e.stopPropagation()} // ダイアログ内のクリックは伝播させない
            >
                {/* ヘッダー */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>ジムを選択</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 24,
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* タブ */}
                <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
                    <button
                        onClick={() => setActiveTab('search')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '10px 20px',
                            fontSize: 14,
                            cursor: 'pointer',
                            color: activeTab === 'search' ? '#111827' : '#6b7280',
                            borderBottom: activeTab === 'search' ? '2px solid #111827' : 'none',
                            fontWeight: activeTab === 'search' ? 600 : 400
                        }}
                    >
                        入力して検索
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '10px 20px',
                            fontSize: 14,
                            cursor: 'pointer',
                            color: activeTab === 'map' ? '#111827' : '#6b7280',
                            borderBottom: activeTab === 'map' ? '2px solid #111827' : 'none',
                            fontWeight: activeTab === 'map' ? 600 : 400
                        }}
                    >
                        地図から選択
                    </button>
                </div>

                {/* コンテンツ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {activeTab === 'search' ? (
                        <>
                            {/* チェーン選択 */}
                            <div style={{ marginBottom: 16, flexShrink: 0 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                                    チェーン（オプション）
                                </label>
                                <select
                                    value={selectedChain}
                                    onChange={e => setSelectedChain(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        fontSize: 14
                                    }}
                                >
                                    <option value="">すべてのチェーン</option>
                                    {chains.map(chain => (
                                        <option key={chain.pub_id} value={chain.pub_id}>
                                            {typeof chain.name === 'string' ? chain.name : JSON.stringify(chain.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 店舗名検索 */}
                            <div style={{ marginBottom: 16, flexShrink: 0 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                                    店舗名
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="店舗名を入力してください"
                                    disabled={false}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        fontSize: 14,
                                        backgroundColor: '#ffffff',
                                        color: '#000000',
                                        opacity: 1
                                    }}
                                />
                            </div>

                            {/* 検索結果 */}
                            <div style={{
                                flex: 1,
                                minHeight: 0,
                                overflow: 'hidden',
                                border: '1px solid #e5e7eb',
                                borderRadius: 8,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {loading ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                                        検索中...
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        minHeight: 0
                                    }}>
                                        {searchResults.map(gym => (
                                            <div
                                                key={gym.pub_id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    minHeight: '60px'
                                                }}
                                            >
                                                <div style={{ flex: 1, marginRight: 12 }}>
                                                    <div style={{ fontWeight: 500 }}>{formatGymName(gym)}</div>
                                                </div>
                                                <button
                                                    onClick={() => onSelect(gym)}
                                                    style={{
                                                        background: '#111827',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: 6,
                                                        fontSize: 14,
                                                        cursor: 'pointer',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    追加
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : searchTerm.length > 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                                        該当するジムが見つかりませんでした
                                    </div>
                                ) : (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
                                        店舗名を入力して検索してください
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 地図タブ */}
                            <div style={{ marginBottom: 16, flexShrink: 0 }}>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                                    チェーン（オプション）
                                </label>
                                <select
                                    value={selectedChain}
                                    onChange={e => setSelectedChain(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: 8,
                                        fontSize: 14
                                    }}
                                >
                                    <option value="">すべてのチェーン</option>
                                    {chains.map(chain => (
                                        <option key={chain.pub_id} value={chain.pub_id}>
                                            {typeof chain.name === 'string' ? chain.name : JSON.stringify(chain.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 地図 */}
                            <div
                                ref={mapRef}
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    border: '1px solid #e5e7eb'
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GymSelector;
