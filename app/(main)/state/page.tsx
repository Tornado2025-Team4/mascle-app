'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    PlusIcon,
    Edit3Icon,
    CheckIcon,
    Trash2Icon,
    ChevronDownIcon,
    PlayIcon,
    StopCircleIcon,
    XIcon
} from 'lucide-react'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import GymSelector from '@/components/gym-selector'

// Gym型定義
interface Gym {
    pub_id: string
    name: string
    chain_name?: string | null
    latitude?: number | null
    longitude?: number | null
    photo_rel_id?: string | null
    distance?: number
    address?: string | null
}

// 型定義
interface TrainingHistory {
    pub_id: string
    started_at: string
    finished_at?: string | null
    gym?: {
        pub_id: string
        name: string
        gymchain?: {
            name: string
        }
    } | null
    partners: Array<{
        pub_id: string
        handle: string
        display_name?: string
    }>
    menus: Array<{
        menu: {
            pub_id: string
            name: string
            bodypart?: {
                pub_id: string
                name: string
            }
        }
        sets?: Array<{
            weight?: number
            reps?: number
        }>
    }>
    menus_cardio: Array<{
        menu: {
            pub_id: string
            name: string
        }
        duration?: string
        distance?: number
    }>
}

interface TrainingMenu {
    pub_id: string
    name: string
    bodypart?: {
        pub_id: string
        name: string
    } | null
}

interface CardioMenu {
    pub_id: string
    name: string
}

interface SelectedMenu {
    pub_id: string
    name: string
    sets: Array<{ weight?: number; reps?: number }>
}

interface SelectedCardioMenu {
    pub_id: string
    name: string
    duration?: string | undefined
    distance?: number | undefined
}

export default function StatePage() {
    const [activeTab, setActiveTab] = useState('history')
    const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([])
    const [trainingMenus, setTrainingMenus] = useState<TrainingMenu[]>([])
    const [cardioMenus, setCardioMenus] = useState<CardioMenu[]>([])
    const [bodyparts, setBodyparts] = useState<Record<string, string>>({})
    const [selectedCategory, setSelectedCategory] = useState('全部')
    const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
    const [editingMenuName, setEditingMenuName] = useState('')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [menuToDelete, setMenuToDelete] = useState<string | null>(null)
    const [isCardioDelete, setIsCardioDelete] = useState(false)

    // 履歴編集関連
    const [historyDeleteDialogOpen, setHistoryDeleteDialogOpen] = useState(false)
    const [historyToDelete, setHistoryToDelete] = useState<string | null>(null)

    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // トレーニング開始関連
    const [startTrainingDialogOpen, setStartTrainingDialogOpen] = useState(false)
    const [gymSelectorOpen, setGymSelectorOpen] = useState(false)
    const [selectedGym, setSelectedGym] = useState<Gym | null>(null)

    // トレーニング終了関連
    const [finishTrainingDialogOpen, setFinishTrainingDialogOpen] = useState(false)
    const [finishingStatusId, setFinishingStatusId] = useState<string | null>(null)
    const [selectedMenus, setSelectedMenus] = useState<Array<{ pub_id: string; name: string; sets: Array<{ weight?: number; reps?: number }> }>>([])
    const [selectedCardioMenus, setSelectedCardioMenus] = useState<Array<{ pub_id: string; name: string; duration?: string; distance?: number }>>([])
    const [selectedPartners, setSelectedPartners] = useState<Array<{ handle: string; pub_id: string }>>([])
    const [partnerSearchTerm, setPartnerSearchTerm] = useState('')
    const [partnerSearchResults, setPartnerSearchResults] = useState<Array<{
        pub_id: string
        handle: string
        display_name: string
    }>>([])
    const [isPartnerSearching2, setIsPartnerSearching2] = useState(false)

    // メニュー作成関連
    const [createMenuDialogOpen, setCreateMenuDialogOpen] = useState(false)
    const [newMenuName, setNewMenuName] = useState('')
    const [newMenuBodypart, setNewMenuBodypart] = useState('')

    // ローディング状態管理
    const [isStartingTraining, setIsStartingTraining] = useState(false)
    const [isFinishingTraining, setIsFinishingTraining] = useState(false)
    const [isCreatingMenu, setIsCreatingMenu] = useState(false)

    // メニュー選択ダイアログ
    const [menuSelectorOpen, setMenuSelectorOpen] = useState(false)
    const [menuSelectorType, setMenuSelectorType] = useState<'regular' | 'cardio'>('regular')
    const [menuSelectorCallback, setMenuSelectorCallback] = useState<((menus: TrainingMenu[] | CardioMenu[]) => void) | null>(null)

    // 履歴詳細ダイアログ
    const [historyDetailOpen, setHistoryDetailOpen] = useState(false)
    const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<TrainingHistory | null>(null)

    // 履歴編集ダイアログ
    const [editHistoryDialogOpen, setEditHistoryDialogOpen] = useState(false)
    const [editingHistory, setEditingHistory] = useState<TrainingHistory | null>(null)
    const [editHistoryGym, setEditHistoryGym] = useState<Gym | null>(null)
    const [editHistoryMenus, setEditHistoryMenus] = useState<SelectedMenu[]>([])
    const [editHistoryCardioMenus, setEditHistoryCardioMenus] = useState<SelectedCardioMenu[]>([])
    const [editHistoryPartners, setEditHistoryPartners] = useState<Array<{ handle: string; pub_id: string }>>([])
    const [editPartnerSearchTerm, setEditPartnerSearchTerm] = useState('')
    const [editPartnerSearchResults, setEditPartnerSearchResults] = useState<Array<{
        pub_id: string
        handle: string
        display_name: string
    }>>([])
    const [isPartnerSearching, setIsPartnerSearching] = useState(false)

    // メニュー編集状態（トレーニング終了時用）
    const [editingFinishMenuIndex, setEditingFinishMenuIndex] = useState<number | null>(null)
    const [editingFinishCardioMenuIndex, setEditingFinishCardioMenuIndex] = useState<number | null>(null)

    // メニュー編集状態（履歴編集時用）
    const [editingHistoryMenuIndex, setEditingHistoryMenuIndex] = useState<number | null>(null)
    const [editingHistoryCardioMenuIndex, setEditingHistoryCardioMenuIndex] = useState<number | null>(null)

    const supabase = createBrowserClient()

    // API共通ヘッダー取得関数
    const getAuthHeaders = React.useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
        }
        return headers
    }, [supabase])

    const fetchBodyparts = React.useCallback(async () => {
        try {
            const response = await fetch('/api/bodyparts')
            if (!response.ok) {
                throw new Error('Failed to fetch bodyparts')
            }
            const data = await response.json()
            setBodyparts(data)
        } catch (error) {
            console.error('Error fetching bodyparts:', error)
        }
    }, [])

    const fetchTrainingHistory = React.useCallback(async (userId: string) => {
        try {
            const headers = await getAuthHeaders()
            const response = await fetch(`/api/users/${userId}/status`, { headers })
            if (!response.ok) {
                throw new Error('Failed to fetch training history')
            }
            const statusList = await response.json()

            // 各ステータスの詳細を取得
            const detailedHistory = await Promise.all(
                statusList.map(async (status: { pub_id: string }) => {
                    const detailResponse = await fetch(`/api/users/${userId}/status/${status.pub_id}`, { headers })
                    if (!detailResponse.ok) {
                        return null
                    }
                    return await detailResponse.json()
                })
            )

            setTrainingHistory(detailedHistory.filter(Boolean))
        } catch (error) {
            console.error('Error fetching training history:', error)
        }
    }, [getAuthHeaders])

    const fetchTrainingMenus = React.useCallback(async (userId: string) => {
        try {
            const headers = await getAuthHeaders()
            const response = await fetch(`/api/users/${userId}/menus`, { headers })
            if (!response.ok) {
                throw new Error('Failed to fetch training menus')
            }
            const data = await response.json()
            setTrainingMenus(data)
        } catch (error) {
            console.error('Error fetching training menus:', error)
        }
    }, [getAuthHeaders])

    const fetchCardioMenus = React.useCallback(async (userId: string) => {
        try {
            const headers = await getAuthHeaders()
            const response = await fetch(`/api/users/${userId}/menus_cardio`, { headers })
            if (!response.ok) {
                throw new Error('Failed to fetch cardio menus')
            }
            const data = await response.json()
            setCardioMenus(data)
        } catch (error) {
            console.error('Error fetching cardio menus:', error)
        }
    }, [getAuthHeaders])

    // データ取得
    useEffect(() => {
        const initializeData = async () => {
            try {
                // meを使用
                const userId = 'me'
                setCurrentUserId(userId)

                await Promise.all([
                    fetchBodyparts(),
                    fetchTrainingHistory(userId),
                    fetchTrainingMenus(userId),
                    fetchCardioMenus(userId)
                ])
            } catch (error) {
                console.error('Error initializing data:', error)
            } finally {
                setLoading(false)
            }
        }

        initializeData()
    }, [fetchBodyparts, fetchTrainingHistory, fetchTrainingMenus, fetchCardioMenus])

    // カテゴリオプション
    const getCategoryOptions = (): string[] => {
        const options = ['全部']
        Object.values(bodyparts).forEach((bodypart: string) => {
            options.push(bodypart)
        })
        options.push('有酸素運動')
        return options
    }

    // フィルタリングされたメニュー
    const getFilteredMenus = (): (TrainingMenu | CardioMenu)[] => {
        if (selectedCategory === '全部') {
            return [...trainingMenus, ...cardioMenus]
        } else if (selectedCategory === '有酸素運動') {
            return cardioMenus
        } else {
            return trainingMenus.filter((menu: TrainingMenu) =>
                menu.bodypart?.name === selectedCategory
            )
        }
    }

    // 編集開始
    const startEditMenu = (menu: TrainingMenu | CardioMenu) => {
        setEditingMenuId(menu.pub_id)
        setEditingMenuName(menu.name)
    }

    // 編集確定
    const confirmEditMenu = async () => {
        if (!editingMenuId || !editingMenuName.trim() || !currentUserId) return

        try {
            const headers = await getAuthHeaders()
            headers['Content-Type'] = 'application/json'

            // 有酸素メニューかどうかを判定
            const isCardio = cardioMenus.some(menu => menu.pub_id === editingMenuId)
            const endpoint = isCardio ? 'menus_cardio' : 'menus'

            const response = await fetch(`/api/users/${currentUserId}/${endpoint}/${editingMenuId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ name: editingMenuName.trim() })
            })

            if (!response.ok) {
                throw new Error('Failed to update menu')
            }

            // ローカル状態を更新
            if (isCardio) {
                setCardioMenus((prev: CardioMenu[]) => prev.map((menu: CardioMenu) =>
                    menu.pub_id === editingMenuId
                        ? { ...menu, name: editingMenuName.trim() }
                        : menu
                ))
            } else {
                setTrainingMenus((prev: TrainingMenu[]) => prev.map((menu: TrainingMenu) =>
                    menu.pub_id === editingMenuId
                        ? { ...menu, name: editingMenuName.trim() }
                        : menu
                ))
            }

            setEditingMenuId(null)
            setEditingMenuName('')
        } catch (error) {
            console.error('Error updating menu:', error)
        }
    }

    // 編集キャンセル
    const cancelEditMenu = () => {
        setEditingMenuId(null)
        setEditingMenuName('')
    }

    // 削除確認
    const confirmDeleteMenu = (menuId: string) => {
        setMenuToDelete(menuId)
        setIsCardioDelete(cardioMenus.some(menu => menu.pub_id === menuId))
        setDeleteDialogOpen(true)
    }

    // 削除実行
    const executeDeleteMenu = async () => {
        if (!menuToDelete || !currentUserId) return

        try {
            const headers = await getAuthHeaders()
            const endpoint = isCardioDelete ? 'menus_cardio' : 'menus'

            const response = await fetch(`/api/users/${currentUserId}/${endpoint}/${menuToDelete}`, {
                method: 'DELETE',
                headers
            })

            if (!response.ok) {
                throw new Error('Failed to delete menu')
            }

            // ローカル状態を更新
            if (isCardioDelete) {
                setCardioMenus((prev: CardioMenu[]) => prev.filter((menu: CardioMenu) => menu.pub_id !== menuToDelete))
            } else {
                setTrainingMenus((prev: TrainingMenu[]) => prev.filter((menu: TrainingMenu) => menu.pub_id !== menuToDelete))
            }

            setDeleteDialogOpen(false)
            setMenuToDelete(null)
            setIsCardioDelete(false)
        } catch (error) {
            console.error('Error deleting menu:', error)
        }
    }

    // 記録削除確認
    const confirmDeleteHistory = (historyId: string) => {
        setHistoryToDelete(historyId)
        setHistoryDeleteDialogOpen(true)
    }

    // 記録削除実行
    const executeDeleteHistory = async () => {
        if (!historyToDelete || !currentUserId) return

        try {
            const headers = await getAuthHeaders()
            const response = await fetch(`/api/users/${currentUserId}/status/${historyToDelete}`, {
                method: 'DELETE',
                headers
            })

            if (!response.ok) {
                throw new Error('Failed to delete history')
            }

            setTrainingHistory((prev: TrainingHistory[]) => prev.filter((history: TrainingHistory) => history.pub_id !== historyToDelete))
            setHistoryDeleteDialogOpen(false)
            setHistoryToDelete(null)
        } catch (error) {
            console.error('Error deleting history:', error)
        }
    }

    // 時刻フォーマット
    const formatTime = (timeString: string) => {
        return new Date(timeString).toLocaleString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // ジム名フォーマット
    const formatGymName = (gym: TrainingHistory['gym']) => {
        if (!gym) return 'ジム未設定'
        return gym.gymchain ? `${gym.gymchain.name} - ${gym.name}` : gym.name
    }

    // メニュー名の取得
    const getMenuNames = (history: TrainingHistory) => {
        const regularMenus = history.menus.map(item => item.menu.name)
        const cardioMenus = history.menus_cardio.map(item => item.menu.name)
        return [...regularMenus, ...cardioMenus]
    }

    // メニューカテゴリ表示
    const getMenuCategoryDisplay = (menu: TrainingMenu | CardioMenu) => {
        if ('bodypart' in menu && menu.bodypart) {
            return menu.bodypart.name
        }
        return '有酸素運動'
    }

    // トレーニング開始
    const startTraining = async () => {
        if (!currentUserId) return

        setIsStartingTraining(true)
        try {
            const headers = await getAuthHeaders()
            headers['Content-Type'] = 'application/json'

            const body: {
                started_at: string
                gym_pub_id?: string
            } = {
                started_at: new Date().toISOString()
            }

            if (selectedGym) {
                body.gym_pub_id = selectedGym.pub_id
            }

            const response = await fetch(`/api/users/${currentUserId}/status`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                throw new Error('Failed to start training')
            }

            // 履歴を再取得
            await fetchTrainingHistory(currentUserId)

            setStartTrainingDialogOpen(false)
            setSelectedGym(null)
        } catch (error) {
            console.error('Error starting training:', error)
        } finally {
            setIsStartingTraining(false)
        }
    }    // トレーニング終了
    const finishTraining = async () => {
        if (!currentUserId || !finishingStatusId) return

        setIsFinishingTraining(true)
        try {
            const headers = await getAuthHeaders()
            headers['Content-Type'] = 'application/json'

            const body: {
                finished_at: string
                menus?: Array<{
                    menu: { pub_id: string }
                    sets: Array<{ weight?: number; reps?: number }>
                }>
                menus_cardio?: Array<{
                    menu: { pub_id: string }
                    duration?: string
                    distance?: number
                }>
                partners?: Array<{ handle: string }>
            } = {
                finished_at: new Date().toISOString()
            }

            if (selectedMenus.length > 0) {
                body.menus = selectedMenus.map(menu => ({
                    menu: { pub_id: menu.pub_id },
                    sets: menu.sets
                }))
            }

            if (selectedCardioMenus.length > 0) {
                body.menus_cardio = selectedCardioMenus.map(menu => ({
                    menu: { pub_id: menu.pub_id },
                    ...(menu.duration && { duration: menu.duration }),
                    ...(menu.distance && { distance: menu.distance })
                }))
            }

            if (selectedPartners.length > 0) {
                body.partners = selectedPartners.map(partner => ({ handle: partner.handle }))
            }

            const response = await fetch(`/api/users/${currentUserId}/status/${finishingStatusId}/finish`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                throw new Error('Failed to finish training')
            }

            // 履歴を再取得
            await fetchTrainingHistory(currentUserId)

            setFinishTrainingDialogOpen(false)
            setFinishingStatusId(null)
            setSelectedMenus([])
            setSelectedCardioMenus([])
            setSelectedPartners([])
        } catch (error) {
            console.error('Error finishing training:', error)
        } finally {
            setIsFinishingTraining(false)
        }
    }

    // メニュー作成
    const createMenu = async () => {
        if (!currentUserId || !newMenuName.trim()) return

        setIsCreatingMenu(true)
        try {
            const headers = await getAuthHeaders()
            headers['Content-Type'] = 'application/json'

            const isCardio = newMenuBodypart === 'cardio'
            const endpoint = isCardio ? 'menus_cardio' : 'menus'

            const body: {
                name: string
                bodypart?: { pub_id: string }
            } = {
                name: newMenuName.trim()
            }

            if (!isCardio && newMenuBodypart) {
                body.bodypart = { pub_id: newMenuBodypart }
            }

            const response = await fetch(`/api/users/${currentUserId}/${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                throw new Error('Failed to create menu')
            }

            // メニューを再取得
            if (isCardio) {
                await fetchCardioMenus(currentUserId)
            } else {
                await fetchTrainingMenus(currentUserId)
            }

            setCreateMenuDialogOpen(false)
            setNewMenuName('')
            setNewMenuBodypart('')
        } catch (error) {
            console.error('Error creating menu:', error)
        } finally {
            setIsCreatingMenu(false)
        }
    }

    // 履歴更新
    const updateHistory = async () => {
        if (!currentUserId || !editingHistory) return

        setIsFinishingTraining(true) // ローディング状態として流用
        try {
            const headers = await getAuthHeaders()
            headers['Content-Type'] = 'application/json'

            const body: {
                gym_pub_id?: string | null
                menus?: Array<{
                    menu: { pub_id: string }
                    sets: Array<{ weight?: number; reps?: number }>
                }>
                menus_cardio?: Array<{
                    menu: { pub_id: string }
                    duration?: string
                    distance?: number
                }>
                partners?: Array<{ pub_id: string }>
            } = {}

            // ジム情報
            if (editHistoryGym) {
                body.gym_pub_id = editHistoryGym.pub_id
            } else {
                body.gym_pub_id = null
            }

            // 筋トレメニュー
            body.menus = editHistoryMenus.map(menu => ({
                menu: { pub_id: menu.pub_id },
                sets: menu.sets.filter(set => set.weight !== undefined || set.reps !== undefined) // 空のセットを除外
            }))

            // 有酸素メニュー
            body.menus_cardio = editHistoryCardioMenus.map(menu => ({
                menu: { pub_id: menu.pub_id },
                ...(menu.duration && { duration: menu.duration }),
                ...(menu.distance && { distance: menu.distance })
            }))

            // パートナー
            body.partners = editHistoryPartners.map(partner => ({ pub_id: partner.pub_id }))

            const response = await fetch(`/api/users/${currentUserId}/status/${editingHistory.pub_id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                throw new Error('Failed to update history')
            }

            // 履歴を再取得
            await fetchTrainingHistory(currentUserId)

            setEditHistoryDialogOpen(false)
            setEditingHistory(null)
            setEditHistoryGym(null)
            setEditHistoryMenus([])
            setEditHistoryCardioMenus([])
            setEditHistoryPartners([])
        } catch (error) {
            console.error('Error updating history:', error)
            alert('履歴の更新に失敗しました。')
        } finally {
            setIsFinishingTraining(false)
        }
    }

    // 最新の未完了履歴があるかチェック
    const hasActiveTraining = () => {
        return trainingHistory.length > 0 && !trainingHistory[0].finished_at
    }

    // トレーニング時間の計算
    const calculateTrainingDuration = (startedAt: string, finishedAt?: string | null) => {
        if (!finishedAt) return null
        const start = new Date(startedAt)
        const finish = new Date(finishedAt)
        const diffMinutes = Math.round((finish.getTime() - start.getTime()) / (1000 * 60))
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
    }

    // メニューセレクターを開く
    const openMenuSelector = (type: 'regular' | 'cardio', callback: (menus: TrainingMenu[] | CardioMenu[]) => void) => {
        setMenuSelectorType(type)
        setMenuSelectorCallback(() => callback)
        setMenuSelectorOpen(true)
    }

    // 履歴詳細を開く
    const openHistoryDetail = (history: TrainingHistory) => {
        setSelectedHistoryDetail(history)
        setHistoryDetailOpen(true)
    }

    // パートナー検索
    const searchPartners = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setEditPartnerSearchResults([])
            return
        }

        setIsPartnerSearching(true)
        try {
            const response = await fetch(`/api/users?handle_id=${encodeURIComponent(searchTerm.trim())}&limit=10`)
            if (response.ok) {
                const users = await response.json()
                setEditPartnerSearchResults(users.map((user: { pub_id: string; handle: string; display_name: string }) => ({
                    pub_id: user.pub_id,
                    handle: user.handle,
                    display_name: user.display_name
                })))
            } else {
                setEditPartnerSearchResults([])
            }
        } catch (error) {
            console.error('パートナー検索エラー:', error)
            setEditPartnerSearchResults([])
        } finally {
            setIsPartnerSearching(false)
        }
    }, [])

    // パートナー検索のデバウンス
    useEffect(() => {
        const timer = setTimeout(() => {
            if (editPartnerSearchTerm) {
                searchPartners(editPartnerSearchTerm)
            } else {
                setEditPartnerSearchResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [editPartnerSearchTerm, searchPartners])

    // パートナー検索（トレーニング終了時）
    const searchPartnersFinish = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setPartnerSearchResults([])
            return
        }

        setIsPartnerSearching2(true)
        try {
            const response = await fetch(`/api/users?handle_id=${encodeURIComponent(searchTerm.trim())}&limit=10`)
            if (response.ok) {
                const users = await response.json()
                setPartnerSearchResults(users.map((user: { pub_id: string; handle: string; display_name: string }) => ({
                    pub_id: user.pub_id,
                    handle: user.handle,
                    display_name: user.display_name
                })))
            } else {
                setPartnerSearchResults([])
            }
        } catch (error) {
            console.error('パートナー検索エラー:', error)
            setPartnerSearchResults([])
        } finally {
            setIsPartnerSearching2(false)
        }
    }, [])

    // パートナー検索のデバウンス（トレーニング終了時）
    useEffect(() => {
        const timer = setTimeout(() => {
            if (partnerSearchTerm) {
                searchPartnersFinish(partnerSearchTerm)
            } else {
                setPartnerSearchResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [partnerSearchTerm, searchPartnersFinish])

    // 履歴編集を開始
    const startEditHistory = (history: TrainingHistory) => {
        setEditingHistory(history)
        setEditHistoryGym(history.gym ? {
            pub_id: history.gym.pub_id,
            name: history.gym.name,
            chain_name: history.gym.gymchain?.name || null
        } : null)

        // メニューを変換
        setEditHistoryMenus(history.menus.map(m => ({
            pub_id: m.menu.pub_id,
            name: m.menu.name,
            sets: m.sets || [{}]
        })))

        setEditHistoryCardioMenus(history.menus_cardio.map(m => ({
            pub_id: m.menu.pub_id,
            name: m.menu.name,
            duration: m.duration || undefined,
            distance: m.distance || undefined
        })))

        setEditHistoryPartners(history.partners.map(p => ({ handle: p.handle, pub_id: p.pub_id })))
        setEditHistoryDialogOpen(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg font-medium text-gray-600">読み込み中...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">トレーニング記録管理</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="history">記録管理</TabsTrigger>
                        <TabsTrigger value="menu">メニュー管理</TabsTrigger>
                    </TabsList>

                    {/* 記録管理タブ */}
                    <TabsContent value="history" className="space-y-4">
                        {/* トレーニング開始/終了ボタン */}
                        {hasActiveTraining() ? (
                            <Button
                                onClick={() => {
                                    const activeHistory = trainingHistory[0]
                                    setFinishingStatusId(activeHistory.pub_id)
                                    setFinishTrainingDialogOpen(true)
                                }}
                                className="w-full h-12 text-lg font-semibold"
                                variant="outline"
                                disabled={isFinishingTraining}
                            >
                                <StopCircleIcon className="w-5 h-5 mr-2" />
                                {isFinishingTraining ? '終了中...' : 'トレーニング終了'}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setStartTrainingDialogOpen(true)}
                                className="w-full h-12 text-lg font-semibold"
                                disabled={isStartingTraining}
                            >
                                <PlayIcon className="w-5 h-5 mr-2" />
                                {isStartingTraining ? '開始中...' : 'トレーニング開始'}
                            </Button>
                        )}

                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">トレーニング記録</h2>
                        </div>

                        <div className="space-y-4">
                            {trainingHistory.map((history: TrainingHistory) => (
                                <div
                                    key={history.pub_id}
                                    className="bg-white rounded-lg p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => openHistoryDetail(history)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0 space-y-2 pr-2">
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div>開始: {formatTime(history.started_at)}</div>
                                                <div>終了: {history.finished_at ? formatTime(history.finished_at) : '未終了'}</div>
                                            </div>

                                            <div className="font-medium text-gray-900">
                                                {formatGymName(history.gym)}
                                            </div>

                                            {history.partners.length > 0 && (
                                                <div className="text-sm text-gray-600">
                                                    一緒にトレーニング: {' '}
                                                    {history.partners.map((partner, index: number) => (
                                                        <span key={`${history.pub_id}-partner-${index}`}>
                                                            <a
                                                                href={`/${partner.handle.substring(1)}`}
                                                                className="text-blue-600 hover:underline"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {partner.handle}
                                                            </a>
                                                            {index < history.partners.length - 1 && ', '}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="text-sm text-gray-700 min-w-0">
                                                <span className="font-medium">メニュー: </span>
                                                <span className="break-words">{getMenuNames(history).join(', ')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    startEditHistory(history)
                                                }}
                                                className="w-8 h-8 p-0"
                                            >
                                                <Edit3Icon className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    confirmDeleteHistory(history.pub_id)
                                                }}
                                                className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* メニュー管理タブ */}
                    <TabsContent value="menu" className="space-y-4">
                        {/* メニュー作成ボタン */}
                        <Button
                            onClick={() => setCreateMenuDialogOpen(true)}
                            className="w-full h-12 text-lg font-semibold"
                            disabled={isCreatingMenu}
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            {isCreatingMenu ? '作成中...' : 'メニューを作成'}
                        </Button>

                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">メニュー管理</h2>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-40">
                                        {selectedCategory}
                                        <ChevronDownIcon className="w-4 h-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-40">
                                    {getCategoryOptions().map((category: string) => (
                                        <DropdownMenuItem
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                        >
                                            {category}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="space-y-3">
                            {getFilteredMenus().map((menu: TrainingMenu | CardioMenu) => (
                                <div key={menu.pub_id} className="bg-white rounded-lg p-4 shadow-sm border">
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="text-sm text-gray-600 mb-1 break-words">
                                                {getMenuCategoryDisplay(menu)}
                                            </div>

                                            {editingMenuId === menu.pub_id ? (
                                                <Input
                                                    value={editingMenuName}
                                                    onChange={(e) => setEditingMenuName(e.target.value)}
                                                    className="text-gray-900 font-medium"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            confirmEditMenu()
                                                        } else if (e.key === 'Escape') {
                                                            cancelEditMenu()
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="text-gray-900 font-medium break-words">{menu.name}</div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {editingMenuId === menu.pub_id ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={confirmEditMenu}
                                                        className="w-8 h-8 p-0"
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => confirmDeleteMenu(menu.pub_id)}
                                                        className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2Icon className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => startEditMenu(menu)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    <Edit3Icon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* 削除確認ダイアログ */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>メニューを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            この操作は取り消すことができません。メニューが完全に削除されます。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                            キャンセル
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDeleteMenu}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            削除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 記録削除確認ダイアログ */}
            <AlertDialog open={historyDeleteDialogOpen} onOpenChange={setHistoryDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>トレーニング記録を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                            この操作は取り消すことができません。トレーニング記録が完全に削除されます。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setHistoryDeleteDialogOpen(false)}>
                            キャンセル
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDeleteHistory}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            削除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* トレーニング開始ダイアログ */}
            <Dialog
                open={startTrainingDialogOpen && !gymSelectorOpen}
                onOpenChange={(open) => {
                    // ジム選択ダイアログが開いている間は閉じることを許可しない
                    if (!gymSelectorOpen) {
                        setStartTrainingDialogOpen(open)
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle>トレーニング開始</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>トレーニングするジムを選択（オプション）</Label>
                            <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => setGymSelectorOpen(true)}
                            >
                                {selectedGym ? (
                                    selectedGym.chain_name ?
                                        `${selectedGym.chain_name} - ${selectedGym.name}` :
                                        selectedGym.name
                                ) : 'ジムを選択'}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={startTraining} disabled={isStartingTraining}>
                            {isStartingTraining ? '開始中...' : '開始'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* トレーニング終了ダイアログ */}
            <Dialog open={finishTrainingDialogOpen} onOpenChange={(open) => {
                setFinishTrainingDialogOpen(open)
                if (!open) {
                    setEditingFinishMenuIndex(null)
                    setEditingFinishCardioMenuIndex(null)
                }
            }}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>トレーニング終了</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* やったメニューの記録 */}
                        <div>
                            <Label>実施したメニュー（オプション）</Label>
                            <div className="mt-2 space-y-2">
                                {selectedMenus.map((menu, index) => (
                                    <div key={menu.pub_id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            {editingFinishMenuIndex === index ? (
                                                <div className="flex-1 min-w-0 mr-2 flex gap-2">
                                                    <Input
                                                        value={selectedMenus[index].name}
                                                        onChange={(e) => {
                                                            const updatedMenus = [...selectedMenus]
                                                            updatedMenus[index] = { ...updatedMenus[index], name: e.target.value }
                                                            setSelectedMenus(updatedMenus)
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditingFinishMenuIndex(null)}
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="font-medium flex-1 min-w-0 mr-2">{menu.name}</div>
                                            )}
                                            <div className="flex gap-1">
                                                {editingFinishMenuIndex !== index && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditingFinishMenuIndex(index)}
                                                    >
                                                        <Edit3Icon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedMenus(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-2">
                                            {/* ヘッダー */}
                                            <div className="flex gap-2 text-sm font-medium text-gray-700 px-2">
                                                <div className="w-8">セット</div>
                                                <div className="w-20 text-center">重量</div>
                                                <div className="w-20 text-center">回数</div>
                                                <div className="w-8"></div>
                                            </div>
                                            {menu.sets.map((set, setIndex) => (
                                                <div key={setIndex} className="flex gap-2 items-center text-sm">
                                                    <div className="w-8 text-center text-gray-600">{setIndex + 1}</div>
                                                    <div className="relative w-20">
                                                        <Input
                                                            placeholder="0"
                                                            type="number"
                                                            value={set.weight || ''}
                                                            onChange={(e) => {
                                                                const newSets = [...menu.sets]
                                                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                                                if (value !== undefined) {
                                                                    newSets[setIndex] = { ...newSets[setIndex], weight: value }
                                                                } else {
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    const { weight, ...rest } = newSets[setIndex]
                                                                    newSets[setIndex] = rest as { weight?: number; reps?: number }
                                                                }
                                                                const newMenus = [...selectedMenus]
                                                                newMenus[index] = { ...newMenus[index], sets: newSets }
                                                                setSelectedMenus(newMenus)
                                                            }}
                                                            className="pr-8"
                                                        />
                                                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">kg</span>
                                                    </div>
                                                    <div className="relative w-20">
                                                        <Input
                                                            placeholder="0"
                                                            type="number"
                                                            value={set.reps || ''}
                                                            onChange={(e) => {
                                                                const newSets = [...menu.sets]
                                                                const value = e.target.value ? parseInt(e.target.value) : undefined
                                                                if (value !== undefined) {
                                                                    newSets[setIndex] = { ...newSets[setIndex], reps: value }
                                                                } else {
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    const { reps, ...rest } = newSets[setIndex]
                                                                    newSets[setIndex] = rest as { weight?: number; reps?: number }
                                                                }
                                                                const newMenus = [...selectedMenus]
                                                                newMenus[index] = { ...newMenus[index], sets: newSets }
                                                                setSelectedMenus(newMenus)
                                                            }}
                                                            className="pr-8"
                                                        />
                                                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">回</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            const newMenus = [...selectedMenus]
                                                            newMenus[index] = {
                                                                ...newMenus[index],
                                                                sets: newMenus[index].sets.filter((_, i) => i !== setIndex)
                                                            }
                                                            setSelectedMenus(newMenus)
                                                        }}
                                                        className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                                                    >
                                                        <XIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    const newMenus = [...selectedMenus]
                                                    newMenus[index] = {
                                                        ...newMenus[index],
                                                        sets: [...newMenus[index].sets, {}]
                                                    }
                                                    setSelectedMenus(newMenus)
                                                }}
                                                className="ml-10"
                                            >
                                                セット追加
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => openMenuSelector('regular', (menus) => {
                                        const menu = menus[0] as TrainingMenu
                                        if (!selectedMenus.find(m => m.pub_id === menu.pub_id)) {
                                            setSelectedMenus(prev => [...prev, {
                                                pub_id: menu.pub_id,
                                                name: menu.name,
                                                sets: [{}]
                                            }])
                                        }
                                    })}
                                >
                                    + メニューを追加
                                </Button>
                            </div>
                        </div>

                        {/* 有酸素メニュー */}
                        <div>
                            <Label>有酸素運動（オプション）</Label>
                            <div className="mt-2 space-y-2">
                                {selectedCardioMenus.map((menu, index) => (
                                    <div key={menu.pub_id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            {editingFinishCardioMenuIndex === index ? (
                                                <div className="flex-1 min-w-0 mr-2 flex gap-2">
                                                    <Input
                                                        value={selectedCardioMenus[index].name}
                                                        onChange={(e) => {
                                                            const updatedMenus = [...selectedCardioMenus]
                                                            updatedMenus[index] = { ...updatedMenus[index], name: e.target.value }
                                                            setSelectedCardioMenus(updatedMenus)
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditingFinishCardioMenuIndex(null)}
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="font-medium flex-1 min-w-0 mr-2">{menu.name}</div>
                                            )}
                                            <div className="flex gap-1">
                                                {editingFinishCardioMenuIndex !== index && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditingFinishCardioMenuIndex(index)}
                                                    >
                                                        <Edit3Icon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedCardioMenus(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-2">
                                            {/* ヘッダー */}
                                            <div className="flex gap-2 text-sm font-medium text-gray-700 px-2">
                                                <div className="w-24 text-center">時間</div>
                                                <div className="w-24 text-center">距離</div>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative w-24">
                                                    <Input
                                                        placeholder="30"
                                                        value={menu.duration || ''}
                                                        onChange={(e) => {
                                                            const newMenus = [...selectedCardioMenus]
                                                            const value = e.target.value.trim()
                                                            if (value) {
                                                                newMenus[index] = { ...newMenus[index], duration: value }
                                                            } else {
                                                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                const { duration, ...rest } = newMenus[index]
                                                                newMenus[index] = rest
                                                            }
                                                            setSelectedCardioMenus(newMenus)
                                                        }}
                                                        className="pr-10"
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">分</span>
                                                </div>
                                                <div className="relative w-24">
                                                    <Input
                                                        placeholder="5.0"
                                                        type="number"
                                                        step="0.1"
                                                        value={menu.distance || ''}
                                                        onChange={(e) => {
                                                            const newMenus = [...selectedCardioMenus]
                                                            const value = e.target.value ? parseFloat(e.target.value) : undefined
                                                            if (value !== undefined) {
                                                                newMenus[index] = { ...newMenus[index], distance: value }
                                                            } else {
                                                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                const { distance, ...rest } = newMenus[index]
                                                                newMenus[index] = rest
                                                            }
                                                            setSelectedCardioMenus(newMenus)
                                                        }}
                                                        className="pr-10"
                                                    />
                                                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => openMenuSelector('cardio', (menus) => {
                                        const menu = menus[0] as CardioMenu
                                        if (!selectedCardioMenus.find(m => m.pub_id === menu.pub_id)) {
                                            setSelectedCardioMenus(prev => [...prev, {
                                                pub_id: menu.pub_id,
                                                name: menu.name
                                            }])
                                        }
                                    })}
                                >
                                    + 有酸素運動を追加
                                </Button>
                            </div>
                        </div>

                        {/* パートナー検索・追加 */}
                        <div>
                            <Label>一緒にトレーニングした人（オプション）</Label>
                            <div className="mt-2 space-y-2">
                                {selectedPartners.map((partner, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                                        <span>{partner.handle.startsWith('@') ? partner.handle : `@${partner.handle}`}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setSelectedPartners(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="space-y-2">
                                    <Input
                                        placeholder="@ハンドル名を入力"
                                        value={partnerSearchTerm}
                                        onChange={(e) => setPartnerSearchTerm(e.target.value)}
                                    />

                                    {/* 検索結果 */}
                                    {partnerSearchResults.length > 0 && (
                                        <div className="border rounded-md max-h-40 overflow-y-auto">
                                            {partnerSearchResults.map((user) => (
                                                <div
                                                    key={user.pub_id}
                                                    className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                                    onClick={() => {
                                                        if (!selectedPartners.find(p => p.pub_id === user.pub_id)) {
                                                            setSelectedPartners(prev => [...prev, {
                                                                pub_id: user.pub_id,
                                                                handle: user.handle
                                                            }])
                                                        }
                                                        setPartnerSearchTerm('')
                                                        setPartnerSearchResults([])
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-medium">{user.handle.startsWith('@') ? user.handle : `@${user.handle}`}</div>
                                                        <div className="text-sm text-gray-500">{user.display_name}</div>
                                                    </div>
                                                    <Button size="sm" variant="ghost">
                                                        追加
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 検索中インジケーター */}
                                    {isPartnerSearching2 && (
                                        <div className="text-sm text-gray-500 text-center py-2">
                                            検索中...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={finishTraining} disabled={isFinishingTraining}>
                            {isFinishingTraining ? '終了中...' : '終了'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* メニュー作成ダイアログ */}
            <Dialog open={createMenuDialogOpen} onOpenChange={setCreateMenuDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>メニューを作成</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>メニュー名</Label>
                            <Input
                                value={newMenuName}
                                onChange={(e) => setNewMenuName(e.target.value)}
                                placeholder="メニュー名を入力"
                            />
                        </div>
                        <div>
                            <Label>部位</Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full mt-2">
                                        {newMenuBodypart === 'cardio' ? '有酸素運動' :
                                            newMenuBodypart ? Object.entries(bodyparts).find(([id]) => id === newMenuBodypart)?.[1] || '部位を選択' :
                                                '部位を選択'}
                                        <ChevronDownIcon className="w-4 h-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full">
                                    {Object.entries(bodyparts).map(([id, name]) => (
                                        <DropdownMenuItem
                                            key={id}
                                            onClick={() => setNewMenuBodypart(id)}
                                        >
                                            {name}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuItem onClick={() => setNewMenuBodypart('cardio')}>
                                        有酸素運動
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={createMenu} disabled={!newMenuName.trim() || isCreatingMenu}>
                            {isCreatingMenu ? '作成中...' : '作成'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ジムセレクター */}
            <GymSelector
                isOpen={gymSelectorOpen}
                onClose={() => {
                    setGymSelectorOpen(false)
                    // トレーニング開始ダイアログが開いていた場合は再表示
                    if (startTrainingDialogOpen) {
                        setTimeout(() => {
                            setStartTrainingDialogOpen(true)
                        }, 50)
                    }
                    // 履歴編集ダイアログが開いていた場合は再表示
                    if (editHistoryDialogOpen) {
                        setTimeout(() => {
                            setEditHistoryDialogOpen(true)
                        }, 50)
                    }
                }}
                onSelect={(gym) => {
                    if (startTrainingDialogOpen) {
                        setSelectedGym(gym)
                    } else if (editHistoryDialogOpen) {
                        setEditHistoryGym(gym)
                    }
                    setGymSelectorOpen(false)
                    // トレーニング開始ダイアログが開いていた場合は再表示
                    if (startTrainingDialogOpen) {
                        setTimeout(() => {
                            setStartTrainingDialogOpen(true)
                        }, 50)
                    }
                    // 履歴編集ダイアログが開いていた場合は再表示
                    if (editHistoryDialogOpen) {
                        setTimeout(() => {
                            setEditHistoryDialogOpen(true)
                        }, 50)
                    }
                }}
            />

            {/* 履歴詳細ダイアログ */}
            <Dialog open={historyDetailOpen} onOpenChange={setHistoryDetailOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>トレーニング詳細</DialogTitle>
                    </DialogHeader>
                    {selectedHistoryDetail && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">基本情報</h3>
                                <div className="space-y-1 text-sm">
                                    <div>開始時間: {formatTime(selectedHistoryDetail.started_at)}</div>
                                    <div>終了時間: {selectedHistoryDetail.finished_at ? formatTime(selectedHistoryDetail.finished_at) : '未終了'}</div>
                                    {selectedHistoryDetail.finished_at && (
                                        <div>トレーニング時間: {calculateTrainingDuration(selectedHistoryDetail.started_at, selectedHistoryDetail.finished_at)}</div>
                                    )}
                                    <div>ジム: {formatGymName(selectedHistoryDetail.gym)}</div>
                                </div>
                            </div>

                            {selectedHistoryDetail.partners.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">一緒にトレーニング</h3>
                                    <div className="space-y-1">
                                        {selectedHistoryDetail.partners.map((partner, index) => (
                                            <div key={`detail-partner-${index}`} className="text-sm">
                                                <a href={`/${partner.handle.substring(1)}`} className="text-blue-600 hover:underline">
                                                    {partner.handle}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedHistoryDetail.menus.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">筋トレメニュー</h3>
                                    <div className="space-y-3">
                                        {selectedHistoryDetail.menus.map((menuItem, index) => (
                                            <div key={`detail-menu-${index}`} className="border rounded p-3">
                                                <div className="font-medium break-words">{menuItem.menu.name}</div>
                                                {menuItem.menu.bodypart && (
                                                    <div className="text-sm text-gray-600 break-words">{menuItem.menu.bodypart.name}</div>
                                                )}
                                                {menuItem.sets && menuItem.sets.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        <div className="text-sm font-medium">セット</div>
                                                        {menuItem.sets.map((set, setIndex) => (
                                                            <div key={setIndex} className="text-sm text-gray-600">
                                                                {setIndex + 1}セット目: {set.weight ? `${set.weight}kg` : ''} {set.reps ? `${set.reps}回` : ''}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedHistoryDetail.menus_cardio.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">有酸素運動</h3>
                                    <div className="space-y-3">
                                        {selectedHistoryDetail.menus_cardio.map((cardioItem, index) => (
                                            <div key={`detail-cardio-${index}`} className="border rounded p-3">
                                                <div className="font-medium break-words">{cardioItem.menu.name}</div>
                                                <div className="text-sm text-gray-600 mt-1 break-words">
                                                    {cardioItem.duration && `時間: ${cardioItem.duration}`}
                                                    {cardioItem.distance && ` 距離: ${cardioItem.distance}km`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* メニューセレクターダイアログ */}
            <Dialog open={menuSelectorOpen} onOpenChange={setMenuSelectorOpen}>
                <DialogContent className="sm:max-w-md max-h-[60vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>メニューを選択</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        {(menuSelectorType === 'regular' ? trainingMenus : cardioMenus).map((menu) => (
                            <Button
                                key={menu.pub_id}
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                    if (menuSelectorCallback) {
                                        menuSelectorCallback([menu])
                                    }
                                    setMenuSelectorOpen(false)
                                }}
                            >
                                <div className="text-left">
                                    <div>{menu.name}</div>
                                    {menuSelectorType === 'regular' && (
                                        (() => {
                                            const regularMenu = menu as TrainingMenu
                                            return regularMenu.bodypart && (
                                                <div className="text-sm text-gray-500">{regularMenu.bodypart.name}</div>
                                            )
                                        })()
                                    )}
                                </div>
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 記録編集ダイアログ */}
            <Dialog
                open={editHistoryDialogOpen && !gymSelectorOpen}
                onOpenChange={(open) => {
                    // ジム選択ダイアログが開いている間は閉じることを許可しない
                    if (!gymSelectorOpen) {
                        setEditHistoryDialogOpen(open)
                        if (!open) {
                            setEditingHistoryMenuIndex(null)
                            setEditingHistoryCardioMenuIndex(null)
                        }
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>トレーニング記録編集</DialogTitle>
                    </DialogHeader>
                    {editingHistory && (
                        <div className="space-y-4">
                            {/* ジム選択 */}
                            <div>
                                <Label>ジム</Label>
                                <Button
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => setGymSelectorOpen(true)}
                                >
                                    {editHistoryGym ? (
                                        editHistoryGym.chain_name ?
                                            `${editHistoryGym.chain_name} - ${editHistoryGym.name}` :
                                            editHistoryGym.name
                                    ) : 'ジムを選択'}
                                </Button>
                            </div>

                            {/* 筋トレメニュー */}
                            <div>
                                <Label>筋トレメニュー</Label>
                                <div className="mt-2 space-y-2">
                                    {editHistoryMenus.map((menu, index) => (
                                        <div key={menu.pub_id} className="p-3 border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                {editingHistoryMenuIndex === index ? (
                                                    <div className="flex-1 min-w-0 mr-2 flex gap-2">
                                                        <Input
                                                            value={editHistoryMenus[index].name}
                                                            onChange={(e) => {
                                                                const updatedMenus = [...editHistoryMenus]
                                                                updatedMenus[index] = { ...updatedMenus[index], name: e.target.value }
                                                                setEditHistoryMenus(updatedMenus)
                                                            }}
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingHistoryMenuIndex(null)}
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="font-medium flex-1 min-w-0 mr-2">{menu.name}</div>
                                                )}
                                                <div className="flex gap-1">
                                                    {editingHistoryMenuIndex !== index && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingHistoryMenuIndex(index)}
                                                        >
                                                            <Edit3Icon className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditHistoryMenus(prev => prev.filter((_, i) => i !== index))}
                                                    >
                                                        <XIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-2">
                                                {/* ヘッダー */}
                                                <div className="flex gap-2 text-sm font-medium text-gray-700 px-2">
                                                    <div className="w-8">セット</div>
                                                    <div className="w-20 text-center">重量</div>
                                                    <div className="w-20 text-center">回数</div>
                                                    <div className="w-8"></div>
                                                </div>
                                                {menu.sets.map((set, setIndex) => (
                                                    <div key={setIndex} className="flex gap-2 items-center text-sm">
                                                        <div className="w-8 text-center text-gray-600">{setIndex + 1}</div>
                                                        <div className="relative w-20">
                                                            <Input
                                                                placeholder="0"
                                                                type="number"
                                                                value={set.weight || ''}
                                                                onChange={(e) => {
                                                                    const newMenus = [...editHistoryMenus]
                                                                    const newSets = [...newMenus[index].sets]
                                                                    const value = e.target.value ? parseFloat(e.target.value) : undefined
                                                                    if (value !== undefined) {
                                                                        newSets[setIndex] = { ...newSets[setIndex], weight: value }
                                                                    } else {
                                                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                        const { weight, ...rest } = newSets[setIndex]
                                                                        newSets[setIndex] = rest as { weight?: number; reps?: number }
                                                                    }
                                                                    newMenus[index] = { ...newMenus[index], sets: newSets }
                                                                    setEditHistoryMenus(newMenus)
                                                                }}
                                                                className="pr-8"
                                                            />
                                                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">kg</span>
                                                        </div>
                                                        <div className="relative w-20">
                                                            <Input
                                                                placeholder="0"
                                                                type="number"
                                                                value={set.reps || ''}
                                                                onChange={(e) => {
                                                                    const newMenus = [...editHistoryMenus]
                                                                    const newSets = [...newMenus[index].sets]
                                                                    const value = e.target.value ? parseInt(e.target.value) : undefined
                                                                    if (value !== undefined) {
                                                                        newSets[setIndex] = { ...newSets[setIndex], reps: value }
                                                                    } else {
                                                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                        const { reps, ...rest } = newSets[setIndex]
                                                                        newSets[setIndex] = rest as { weight?: number; reps?: number }
                                                                    }
                                                                    newMenus[index] = { ...newMenus[index], sets: newSets }
                                                                    setEditHistoryMenus(newMenus)
                                                                }}
                                                                className="pr-8"
                                                            />
                                                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">回</span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const newMenus = [...editHistoryMenus]
                                                                newMenus[index] = {
                                                                    ...newMenus[index],
                                                                    sets: newMenus[index].sets.filter((_, i) => i !== setIndex)
                                                                }
                                                                setEditHistoryMenus(newMenus)
                                                            }}
                                                            className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newMenus = [...editHistoryMenus]
                                                        newMenus[index] = {
                                                            ...newMenus[index],
                                                            sets: [...newMenus[index].sets, {}]
                                                        }
                                                        setEditHistoryMenus(newMenus)
                                                    }}
                                                    className="ml-10"
                                                >
                                                    セット追加
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => openMenuSelector('regular', (menus) => {
                                            const menu = menus[0] as TrainingMenu
                                            if (!editHistoryMenus.find(m => m.pub_id === menu.pub_id)) {
                                                setEditHistoryMenus(prev => [...prev, {
                                                    pub_id: menu.pub_id,
                                                    name: menu.name,
                                                    sets: [{}]
                                                }])
                                            }
                                        })}
                                    >
                                        + 筋トレメニューを追加
                                    </Button>
                                </div>
                            </div>

                            {/* 有酸素メニュー */}
                            <div>
                                <Label>有酸素運動</Label>
                                <div className="mt-2 space-y-2">
                                    {editHistoryCardioMenus.map((menu, index) => (
                                        <div key={menu.pub_id} className="p-3 border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                {editingHistoryCardioMenuIndex === index ? (
                                                    <div className="flex-1 min-w-0 mr-2 flex gap-2">
                                                        <Input
                                                            value={editHistoryCardioMenus[index].name}
                                                            onChange={(e) => {
                                                                const updatedMenus = [...editHistoryCardioMenus]
                                                                updatedMenus[index] = { ...updatedMenus[index], name: e.target.value }
                                                                setEditHistoryCardioMenus(updatedMenus)
                                                            }}
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingHistoryCardioMenuIndex(null)}
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="font-medium flex-1 min-w-0 mr-2">{menu.name}</div>
                                                )}
                                                <div className="flex gap-1">
                                                    {editingHistoryCardioMenuIndex !== index && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingHistoryCardioMenuIndex(index)}
                                                        >
                                                            <Edit3Icon className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setEditHistoryCardioMenus(prev => prev.filter((_, i) => i !== index))}
                                                    >
                                                        <XIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-2 space-y-2">
                                                {/* ヘッダー */}
                                                <div className="flex gap-2 text-sm font-medium text-gray-700 px-2">
                                                    <div className="w-24 text-center">時間</div>
                                                    <div className="w-24 text-center">距離</div>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <div className="relative w-24">
                                                        <Input
                                                            placeholder="30"
                                                            value={menu.duration || ''}
                                                            onChange={(e) => {
                                                                const newMenus = [...editHistoryCardioMenus]
                                                                const value = e.target.value.trim()
                                                                if (value) {
                                                                    newMenus[index] = { ...newMenus[index], duration: value }
                                                                } else {
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    const { duration, ...rest } = newMenus[index]
                                                                    newMenus[index] = rest as SelectedCardioMenu
                                                                }
                                                                setEditHistoryCardioMenus(newMenus)
                                                            }}
                                                            className="pr-10"
                                                        />
                                                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">分</span>
                                                    </div>
                                                    <div className="relative w-24">
                                                        <Input
                                                            placeholder="5.0"
                                                            type="number"
                                                            step="0.1"
                                                            value={menu.distance || ''}
                                                            onChange={(e) => {
                                                                const newMenus = [...editHistoryCardioMenus]
                                                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                                                if (value !== undefined) {
                                                                    newMenus[index] = { ...newMenus[index], distance: value }
                                                                } else {
                                                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                                                    const { distance, ...rest } = newMenus[index]
                                                                    newMenus[index] = rest as SelectedCardioMenu
                                                                }
                                                                setEditHistoryCardioMenus(newMenus)
                                                            }}
                                                            className="pr-10"
                                                        />
                                                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">km</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => openMenuSelector('cardio', (menus) => {
                                            const menu = menus[0] as CardioMenu
                                            if (!editHistoryCardioMenus.find(m => m.pub_id === menu.pub_id)) {
                                                setEditHistoryCardioMenus(prev => [...prev, {
                                                    pub_id: menu.pub_id,
                                                    name: menu.name
                                                }])
                                            }
                                        })}
                                    >
                                        + 有酸素運動を追加
                                    </Button>
                                </div>
                            </div>

                            {/* パートナー */}
                            <div>
                                <Label>一緒にトレーニングした人</Label>
                                <div className="mt-2 space-y-2">
                                    {editHistoryPartners.map((partner, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                                            <span>{partner.handle.startsWith('@') ? partner.handle : `@${partner.handle}`}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditHistoryPartners(prev => prev.filter((_, i) => i !== index))}
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="@ハンドル名を入力"
                                            value={editPartnerSearchTerm}
                                            onChange={(e) => setEditPartnerSearchTerm(e.target.value)}
                                        />

                                        {/* 検索結果 */}
                                        {editPartnerSearchResults.length > 0 && (
                                            <div className="border rounded-md max-h-40 overflow-y-auto">
                                                {editPartnerSearchResults.map((user) => (
                                                    <div
                                                        key={user.pub_id}
                                                        className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                                        onClick={() => {
                                                            if (!editHistoryPartners.find(p => p.pub_id === user.pub_id)) {
                                                                setEditHistoryPartners(prev => [...prev, {
                                                                    pub_id: user.pub_id,
                                                                    handle: user.handle
                                                                }])
                                                            }
                                                            setEditPartnerSearchTerm('')
                                                            setEditPartnerSearchResults([])
                                                        }}
                                                    >
                                                        <div>
                                                            <div className="font-medium">{user.handle.startsWith('@') ? user.handle : `@${user.handle}`}</div>
                                                            <div className="text-sm text-gray-500">{user.display_name}</div>
                                                        </div>
                                                        <Button size="sm" variant="ghost">
                                                            追加
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 検索中インジケーター */}
                                        {isPartnerSearching && (
                                            <div className="text-sm text-gray-500 text-center py-2">
                                                検索中...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={updateHistory}
                            disabled={isFinishingTraining}
                        >
                            {isFinishingTraining ? '保存中...' : '保存'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
