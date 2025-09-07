'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { PdfGenerator, CARD_TEXT, CARD_FONTS } from './_components/pdf-generator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RiDownload2Line } from "react-icons/ri";
import { IoPrintSharp } from "react-icons/io5";
import { pdf } from '@react-pdf/renderer'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { IoArrowBack } from 'react-icons/io5'
import { useRouter } from 'next/navigation'

const DEFAULT_IMAGE = null

// 共通の配置計算関数
const getPositionValues = (position: string, containerWidth: number, containerHeight: number, elementWidth: number, elementHeight: number, padding: number = 12) => {
  const positions: Record<string, { x: number, y: number }> = {
    'top-left': { x: padding, y: padding },
    'top-center': { x: (containerWidth - elementWidth) / 2, y: padding },
    'top-right': { x: containerWidth - elementWidth - padding, y: padding },
    'center-left': { x: padding, y: (containerHeight - elementHeight) / 2 },
    'center': { x: (containerWidth - elementWidth) / 2, y: (containerHeight - elementHeight) / 2 },
    'center-right': { x: containerWidth - elementWidth - padding, y: (containerHeight - elementHeight) / 2 },
    'bottom-left': { x: padding, y: containerHeight - elementHeight - padding },
    'bottom-center': { x: (containerWidth - elementWidth) / 2, y: containerHeight - elementHeight - padding },
    'bottom-right': { x: containerWidth - elementWidth - padding, y: containerHeight - elementHeight - padding }
  }
  return positions[position] || positions['center']
}

export default function CardPage() {
  const params = useParams()
  const userId = params.userId as string
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  // カスタマイズ状態
  const [customization, setCustomization] = useState({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    subtitle: CARD_TEXT.subtitle as string,
    selectedImage: DEFAULT_IMAGE as string | null,
    titleSize: 24,
    subtitleSize: 12,
    imageSize: 32,
    imagePosition: 'top-left',
    titlePosition: 'center',
    subtitlePosition: 'bottom-left',
    qrPosition: 'bottom-right'
  })

  // 画像アップロード用のref
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const qrCodeUrl = `${baseUrl}/${userId}`

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      // 画像がある場合は、有効性をチェック
      if (customization.selectedImage) {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = customization.selectedImage as string
        })
      }

      const blob = await pdf(<PdfGenerator qrCodeUrl={qrCodeUrl} customization={customization} />).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'business-cards.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // PDFダウンロード後にページをリロード
      window.location.reload()
    } catch (error) {
      console.error('PDF出力エラー:', error)
      // より詳細なエラーメッセージ
      if (customization.selectedImage) {
        alert('画像の処理中にエラーが発生しました。画像を削除するか、別の画像を試してください。')
      } else {
        alert('PDF出力中にエラーが発生しました。しばらく時間をおいて再試行してください。')
      }
    } finally {
      setIsExporting(false)
    }
  }

  // 画像アップロードハンドラー
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCustomization(prev => ({ ...prev, selectedImage: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // 画像削除ハンドラー
  const handleImageRemove = () => {
    setCustomization(prev => ({ ...prev, selectedImage: null as string | null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // プレビュー用のコンテナサイズ（ピクセル）
  const previewCardWidth = 345 // 91mm ≈ 345px (96dpi基準)
  const previewCardHeight = 208 // 55mm ≈ 208px (96dpi基準)
  const previewPadding = 12

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-[13vh]">
      <div className="container mx-auto px-4">
        {/* ヘッダー */}
        <header className="flex items-center justify-start px-4 pt-5">
          <button className="text-2xl" onClick={() => router.back()}>
            <IoArrowBack />
          </button>
        </header>

        <div className="max-w-4xl mx-auto mt-5">
          <Card>
            <CardHeader>
              <CardTitle>名刺プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <div
                  className="shadow-lg relative overflow-hidden md:w-[345px] md:h-[208px] w-[240px] h-[145px]"
                  style={{
                    backgroundColor: customization.backgroundColor
                  }}
                >
                  {/* 画像 */}
                  {(() => {
                    const imageSize = {
                      width: customization.imageSize,
                      height: customization.imageSize
                    }
                    // デスクトップサイズを使用（CSSでレスポンシブ対応）
                    const imagePos = getPositionValues(
                      customization.imagePosition,
                      previewCardWidth,
                      previewCardHeight,
                      imageSize.width,
                      imageSize.height,
                      previewPadding
                    )
                    return (
                      <div
                        className="absolute"
                        style={{
                          left: `${imagePos.x}px`,
                          top: `${imagePos.y}px`
                        }}
                      >
                        {customization.selectedImage && typeof customization.selectedImage === 'string' && customization.selectedImage.trim() !== '' ? (
                          <img
                            src={customization.selectedImage}
                            alt="カスタム画像"
                            style={{
                              width: `${imageSize.width}px`,
                              height: `${imageSize.height}px`,
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          <div
                            className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
                            style={{
                              width: `${customization.imageSize}px`,
                              height: `${customization.imageSize}px`
                            }}
                          >
                            <span className="text-xs text-gray-400">画像</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {/* タイトル */}
                  {(() => {
                    // テキストサイズに基づく概算サイズ（実際のサイズとは多少異なる場合があります）
                    const titleWidth = CARD_TEXT.title.length * customization.titleSize * 0.8
                    const titleHeight = customization.titleSize

                    const titlePos = getPositionValues(
                      customization.titlePosition,
                      previewCardWidth,
                      previewCardHeight,
                      titleWidth,
                      titleHeight,
                      previewPadding
                    )
                    return (
                      <div
                        className="absolute"
                        style={{
                          left: `${titlePos.x}px`,
                          top: `${titlePos.y}px`
                        }}
                      >
                        <h2
                          className="font-bold whitespace-nowrap"
                          style={{
                            color: customization.textColor,
                            fontFamily: CARD_FONTS.primary,
                            fontSize: `${customization.titleSize}px`
                          }}
                        >
                          {CARD_TEXT.title}
                        </h2>
                      </div>
                    )
                  })()}

                  {/* サブタイトル */}
                  {(() => {
                    const subtitleWidth = customization.subtitle.length * customization.subtitleSize * 0.8
                    const subtitleHeight = customization.subtitleSize

                    const subtitlePos = getPositionValues(
                      customization.subtitlePosition,
                      previewCardWidth,
                      previewCardHeight,
                      subtitleWidth,
                      subtitleHeight,
                      previewPadding
                    )
                    return (
                      <div
                        className="absolute"
                        style={{
                          left: `${subtitlePos.x}px`,
                          top: `${subtitlePos.y}px`
                        }}
                      >
                        <p
                          className="font-medium whitespace-nowrap"
                          style={{
                            color: customization.textColor,
                            fontFamily: CARD_FONTS.primary,
                            fontSize: `${customization.subtitleSize}px`
                          }}
                        >
                          {customization.subtitle}
                        </p>
                      </div>
                    )
                  })()}

                  {/* QRコード */}
                  {(() => {
                    const qrSize = 40

                    const qrPos = getPositionValues(
                      customization.qrPosition,
                      previewCardWidth,
                      previewCardHeight,
                      qrSize,
                      qrSize,
                      previewPadding
                    )
                    return (
                      <div
                        className="absolute"
                        style={{
                          left: `${qrPos.x}px`,
                          top: `${qrPos.y}px`
                        }}
                      >
                        <QRCodeSVG
                          value={qrCodeUrl}
                          size={qrSize}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="flex items-center gap-2 text-sm">
                  <RiDownload2Line className="w-4 h-4" />
                  {isExporting ? 'PDF生成中...' : 'PDF出力'}
                </Button>
                <Link href={`/${userId}/card/print`} className="flex items-center gap-2">
                  <Button className="flex items-center gap-2 text-sm">
                    <IoPrintSharp className="w-4 h-4" />
                    印刷
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* カスタマイズパネル */}
        <div className="max-w-4xl mx-auto mt-4 md:mt-6">
          <Card>
            <CardHeader>
              <CardTitle>名刺カスタマイズ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-3">
                {/* 背景色選択 */}
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">背景色</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={customization.backgroundColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <span className="text-sm text-gray-600">{customization.backgroundColor}</span>
                  </div>
                </div>

                {/* 文字色選択 */}
                <div className="space-y-2">
                  <Label htmlFor="textColor">文字色</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Input
                      id="textColor"
                      type="color"
                      value={customization.textColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, textColor: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <span className="text-sm text-gray-600">{customization.textColor}</span>
                  </div>
                </div>
              </div>

              {/* サブタイトル編集 */}
              <div className="space-y-2">
                <Label htmlFor="subtitle">サブタイトルテキスト</Label>
                <Input
                  id="subtitle"
                  value={customization.subtitle}
                  onChange={(e) => setCustomization(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="テキストを入力してください"
                />
              </div>

              {/* 画像アップロード */}
              <div className="space-y-2">
                <Label>画像（1:1の正方形で表示されます）</Label>
                <div className="space-y-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 border rounded-lg flex items-center gap-2 transition-colors hover:border-gray-300"
                    >
                      <span className="text-sm">画像を選択</span>
                    </Button>

                    {customization.selectedImage && (
                      <Button
                        onClick={handleImageRemove}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        削除
                      </Button>
                    )}
                  </div>

                  {customization.selectedImage && typeof customization.selectedImage === 'string' && customization.selectedImage.trim() !== '' && (
                    <div className="mt-2">
                      <img
                        src={customization.selectedImage}
                        alt="プレビュー"
                        className="w-16 h-16 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* サイズ設定 */}
              <div className="space-y-3 md:space-y-4">
                <Label className="text-base md:text-lg font-semibold">サイズ設定</Label>

                {/* タイトルサイズ */}
                <div className="space-y-2">
                  <Label htmlFor="titleSize" className="text-sm">タイトルサイズ (px)</Label>
                  <Input
                    id="titleSize"
                    type="number"
                    min="8"
                    max="48"
                    value={customization.titleSize}
                    onChange={(e) => setCustomization(prev => ({ ...prev, titleSize: parseInt(e.target.value) || 24 }))}
                  />
                </div>

                {/* サブタイトルサイズ */}
                <div className="space-y-2">
                  <Label htmlFor="subtitleSize" className="text-sm">サブタイトルサイズ (px)</Label>
                  <Input
                    id="subtitleSize"
                    type="number"
                    min="6"
                    max="24"
                    value={customization.subtitleSize}
                    onChange={(e) => setCustomization(prev => ({ ...prev, subtitleSize: parseInt(e.target.value) || 12 }))}
                  />
                </div>

                {/* 画像サイズ */}
                <div className="space-y-2">
                  <Label htmlFor="imageSize" className="text-sm">画像サイズ (px) - 1:1の正方形</Label>
                  <Input
                    id="imageSize"
                    type="number"
                    min="16"
                    max="80"
                    value={customization.imageSize}
                    onChange={(e) => setCustomization(prev => ({ ...prev, imageSize: parseInt(e.target.value) || 32 }))}
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}