'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image as PDFImage, Font } from '@react-pdf/renderer'
import QRCode from 'qrcode'

// 日本語フォントを登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-VariableFont_wght.ttf'
})

interface CustomizationProps {
  backgroundColor: string
  textColor: string
  subtitle: string
  selectedImage: string | null
  titleSize: number
  subtitleSize: number
  imageSize: number
  imagePosition: string
  titlePosition: string
  subtitlePosition: string
  qrPosition: string
}

interface PdfGeneratorProps {
  qrCodeUrl: string
  customization?: CustomizationProps
}

// 共通のテキスト定数
export const CARD_TEXT = {
  title: 'PROTEN',
  subtitle: '筋トレ仲間募集中！'
} as const

// 共通のフォント設定
export const CARD_FONTS = {
  primary: 'NotoSansJP',
  fallback: 'Courier'
} as const

// 共通の配置計算関数（PDF用）
const getPositionValues = (position: string, containerWidth: number, containerHeight: number, elementWidth: number, elementHeight: number, padding: number = 8) => {
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

// PDF用のスタイル定義
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
    width: '210mm',
    height: '297mm',
    fontFamily: CARD_FONTS.primary
  },
  cardContainer: {
    position: 'relative',
    width: '210mm',
    height: '297mm',
    backgroundColor: '#ffffff'
  },
  card: {
    position: 'absolute',
    width: '91mm',
    height: '55mm',
    margin: 0,
    padding: 0
  },
  cardContent: {
    padding: 0,
    height: '100%',
    width: '100%',
    position: 'relative'
  }
})

export function PdfGenerator({ qrCodeUrl, customization }: PdfGeneratorProps) {
  // デフォルトのカスタマイズ設定
  const defaultCustomization: CustomizationProps = {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    subtitle: CARD_TEXT.subtitle,
    selectedImage: null,
    titleSize: 24,
    subtitleSize: 12,
    imageSize: 32,
    imagePosition: 'top-left',
    titlePosition: 'center',
    subtitlePosition: 'bottom-left',
    qrPosition: 'bottom-right'
  }

  const customSettings = { ...defaultCustomization, ...customization }

  // A4用紙のサイズ
  const a4Width = 210 // mm
  const a4Height = 297 // mm

  // 名刺のサイズ
  const cardWidth = 91 // mm
  const cardHeight = 55 // mm

  // 名刺レイアウト全体のサイズ
  const totalCardWidth = cardWidth * 2 // 2列
  const totalCardHeight = cardHeight * 5 // 5行

  // 中央配置のためのオフセット
  const offsetX = (a4Width - totalCardWidth) / 2
  const offsetY = (a4Height - totalCardHeight) / 2

  // QRコードをBase64データURLに変換
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('')

  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl, {
          width: 100,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeDataUrl(qrCodeDataURL)
      } catch (error) {
        console.error('QRコード生成エラー:', error)
      }
    }

    if (qrCodeUrl) {
      generateQRCode()
    }
  }, [qrCodeUrl])

  // PDF用の寸法計算（ピクセルからmmへの変換係数）
  const pxToMm = 0.264583 // 96dpiでの変換係数
  const cardWidthPx = cardWidth / pxToMm
  const cardHeightPx = cardHeight / pxToMm
  const paddingPx = 8 / pxToMm // 約3mm

  // 10個の名刺を2列5行で配置
  const cards: React.ReactElement[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 2; col++) {
      const index = row * 2 + col
      const x = offsetX + col * cardWidth
      const y = offsetY + row * cardHeight

      // 各要素の配置計算
      const imageSize = customSettings.imageSize
      const imagePosValues = getPositionValues(
        customSettings.imagePosition,
        cardWidthPx,
        cardHeightPx,
        imageSize,
        imageSize,
        paddingPx
      )

      // テキストサイズの概算（文字数×フォントサイズ×係数）
      const titleWidth = CARD_TEXT.title.length * customSettings.titleSize * 0.6
      const titleHeight = customSettings.titleSize
      const titlePosValues = getPositionValues(
        customSettings.titlePosition,
        cardWidthPx,
        cardHeightPx,
        titleWidth,
        titleHeight,
        paddingPx
      )

      const subtitleWidth = customSettings.subtitle.length * customSettings.subtitleSize * 0.6
      const subtitleHeight = customSettings.subtitleSize
      const subtitlePosValues = getPositionValues(
        customSettings.subtitlePosition,
        cardWidthPx,
        cardHeightPx,
        subtitleWidth,
        subtitleHeight,
        paddingPx
      )

      const qrSize = 34 // PDF用QRコードサイズ
      const qrPosValues = getPositionValues(
        customSettings.qrPosition,
        cardWidthPx,
        cardHeightPx,
        qrSize,
        qrSize,
        paddingPx
      )

      cards.push(
        <View
          key={index}
          style={[
            styles.card,
            {
              left: `${x}mm`,
              top: `${y}mm`,
              backgroundColor: customSettings.backgroundColor
            }
          ]}
        >
          <View style={styles.cardContent}>
            {/* カスタム画像 */}
            <View style={{
              position: 'absolute',
              left: `${imagePosValues.x * pxToMm}mm`,
              top: `${imagePosValues.y * pxToMm}mm`
            }}>
              {customSettings.selectedImage && customSettings.selectedImage.trim() !== '' ? (
                <PDFImage
                  src={customSettings.selectedImage}
                  style={{
                    width: `${customSettings.imageSize * pxToMm}mm`,
                    height: `${customSettings.imageSize * pxToMm}mm`
                  }}
                />
              ) : (
                <View>  
                </View>
              )}
            </View>

            {/* タイトル */}
            <View style={{
              position: 'absolute',
              left: `${titlePosValues.x * pxToMm}mm`,
              top: `${titlePosValues.y * pxToMm}mm`
            }}>
              <Text style={{
                color: customSettings.textColor,
                textAlign: 'left',
                fontSize: customSettings.titleSize * 0.75, // PDFでは少し小さめに調整
                fontFamily: CARD_FONTS.primary,
                fontWeight: 'bold'
              }}>
                {CARD_TEXT.title}
              </Text>
            </View>

            {/* サブタイトル */}
            <View style={{
              position: 'absolute',
              left: `${subtitlePosValues.x * pxToMm}mm`,
              top: `${subtitlePosValues.y * pxToMm}mm`
            }}>
              <Text style={{
                color: customSettings.textColor,
                textAlign: 'left',
                fontSize: customSettings.subtitleSize * 0.75, // PDFでは少し小さめに調整
                fontFamily: CARD_FONTS.primary,
                fontWeight: 'normal'
              }}>
                {customSettings.subtitle}
              </Text>
            </View>

            {/* QRコード */}
            <View style={{
              position: 'absolute',
              left: `${qrPosValues.x * pxToMm}mm`,
              top: `${qrPosValues.y * pxToMm}mm`
            }}>
              {qrCodeDataUrl ? (
                <PDFImage
                  src={qrCodeDataUrl}
                  style={{ width: `${qrSize * pxToMm}mm`, height: `${qrSize * pxToMm}mm` }}
                />
              ) : (
                <Text style={{
                  fontSize: 6,
                  color: '#000000',
                  textAlign: 'center',
                  fontFamily: CARD_FONTS.fallback
                }}>
                  QR
                </Text>
              )}
            </View>
          </View>
        </View>
      )
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cardContainer}>
          {cards}
        </View>
      </Page>
    </Document>
  )
}