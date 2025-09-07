'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IoAdd } from 'react-icons/io5'

const DEFAULT_EXERCISES: Record<string, string[]> = {
  '胸': ['インクラインダンベルプレス (40°)', 'インクラインダンベルプレス (30°)', 'ダンベルフライ'],
  '肩': ['ショルダープレス', 'サイドレイズ', 'リアレイズ'],
  '腕': ['アームカール', 'トライセプスエクステンション'],
  '背': ['デッドリフト', 'ラットプルダウン'],
  '脚': ['スクワット', 'レッグプレス'],
  '腹': ['クランチ', 'レッグレイズ'],
  '有酸素': ['トレッドミル', 'バイク']
}

type TodayMenuProps = {
  selectedExercises: string[]
  onChangeSelected: (next: string[]) => void
}

const TodayMenu: React.FC<TodayMenuProps> = ({ selectedExercises, onChangeSelected }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('胸')
  const [customExercise, setCustomExercise] = useState('')

  const handleToggleExercise = (name: string) => {
    onChangeSelected(
      selectedExercises.includes(name)
        ? selectedExercises.filter((n) => n !== name)
        : [...selectedExercises, name]
    )
  }

  const handleAddCustomExercise = () => {
    const name = customExercise.trim()
    if (!name) return
    if (!selectedExercises.includes(name)) onChangeSelected([...selectedExercises, name])
    setCustomExercise('')
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium">今日のメニュー</div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="secondary" size="sm">追加</Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <SheetTitle>追加する種目</SheetTitle>
          </SheetHeader>
          <div className="px-4 pt-3">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="grid grid-cols-7 gap-1">
                {Object.keys(DEFAULT_EXERCISES).map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs">{cat}</TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(DEFAULT_EXERCISES).map(([cat, list]) => (
                <TabsContent key={cat} value={cat} className="mt-2">
                  <ul className="divide-y rounded-lg border">
                    {list.map((name) => (
                      <li key={name} className="flex items-center justify-between px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleExercise(name)}
                          className="flex items-center gap-3 text-left flex-1"
                        >
                          <span className={`inline-block w-3 h-3 rounded-full border ${selectedExercises.includes(name) ? 'bg-red-500 border-red-500' : 'border-red-500'}`} />
                          <span className="text-sm">{name}</span>
                        </button>
                      </li>
                    ))}
                    <li className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" className="text-red-500 text-xl" onClick={handleAddCustomExercise}>
                          <IoAdd />
                        </button>
                        <Input
                          value={customExercise}
                          onChange={(e) => setCustomExercise(e.target.value)}
                          placeholder="種目を追加"
                          className="h-9"
                        />
                      </div>
                    </li>
                  </ul>
                </TabsContent>
              ))}
            </Tabs>
            <div className="sticky bottom-0 bg-white pt-3 pb-4">
              <Button type="button" className="w-full" onClick={() => setMenuOpen(false)}>完了</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default TodayMenu


