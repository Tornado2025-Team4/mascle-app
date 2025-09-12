# 通知機能仕様書

## 通知種別と表示内容

### MVP対象の通知種別

| 通知種別 | 通知条件 | 表示される内容 | アンカー先 |
|---------|---------|-------------|----------|
| `matching/offline/same-gym` | 同じジムで他のユーザーが同時にトレーニング中 | "○○さんが同じジムにいます" | 該当ユーザーのプロフィール（可視性準拠：実プロフィールor匿名プロフィール） |
| `social/follower-added` | 他のユーザーがフォロー | "○○さんからフォローされました" | 該当ユーザーのプロフィール |
| `social/following-posted` | フォロー中のユーザーが投稿 | "○○さんが投稿しました" | 該当投稿（add_infoでpost_id指定） |
| `social/following-started-training` | フォロー中のユーザーがトレーニング開始 | "○○さんがトレーニングを開始しました" | 該当ユーザーのプロフィール |
| `social/training-partner-request` | 合トレ申請を受信 | "○○さんから合トレ希望リクエストがありました" | 該当ユーザーのプロフィール |
| `post/liked` | 投稿にいいね | "○○さんからいいねされました" | 該当投稿（add_infoでpost_id指定） |
| `post/commented` | 投稿にコメント | "○○さんがコメントしました" | 該当投稿（add_infoでpost_id指定） |
| `post/mentioned` | 投稿でメンション | "○○さんからメンションされました" | 該当投稿（add_infoでpost_id指定） |
| `dm/pair/invite-received` | DM招待を受信 | "○○さんからDM招待がありました" | DMページ |
| `dm/pair/request-accepted` | DM申請が承認された | "○○さんがDM申請を承認しました" | DMページ |
| `dm/pair/received` | DMメッセージを受信 | "○○さんからメッセージがきました" | DMページ |

### アイコン表示ルール

1. **ユーザーアイコンがある場合**: ユーザーのプロフィール画像を表示
2. **ユーザーアイコンがない場合**: 通知種別に応じたフォールバック絵文字
   - `post/liked`: ❤️
   - `social/follower-added`: 👤
   - `post/mentioned`, `post/commented`: 💬
   - `dm/*`: 📩
   - `matching/offline/same-gym`, `social/following-started-training`: 🏋️
   - `social/following-posted`: 📝
   - `social/training-partner-request`: 🤝
   - その他: 🔔

### API仕様

#### 通知取得 GET `/api/users/me/notices`
レスポンス形式：
```json
[
  {
    "pub_id": "通知ID",
    "is_read": false,
    "notified_at": "2024-01-01T00:00:00Z",
    "kind": "post/liked",
    "add_info": {
      "post_id": "投稿ID"
    },
    "igniter_user": {
      "handle": "ユーザーハンドル",
      "anon_pub_id": "匿名ID",
      "display_name": "表示名",
      "icon_url": "アイコンURL"
    }
  }
]
```

#### 通知既読 PATCH `/api/users/me/notices`
リクエスト形式：
```json
{
  "notice_ids": ["通知ID1", "通知ID2"]
}
```

### データベース設計

#### `notices` テーブル
- `add_info`: JSON型 - 投稿IDなどの追加情報
  - 例: `{"post_id": "投稿のpub_id"}`

### フロントエンド仕様

#### 通知ページ
- 左の中点（既読/未読インジケーター）は削除
- アイコンまたは絵文字を表示
- 通知内容は省略せず改行してでもフル表示
- ユーザーリンクはhandleまたはanon_pub_idを使用（pub_idは使用禁止）

#### トースト通知
- 新しい通知が来たら画面上部に5秒間表示
- ×ボタンで手動で閉じることも可能

#### ポーリング
- 30秒ごとにAPIエンドポイントをポーリング
- 新着通知があればトーストで表示

### 実装状況
✅ 通知ページの実装
✅ トースト通知の実装  
✅ 30秒ポーリング
✅ 既読処理API（PATCH）
✅ add_info対応
⚠️ 通知を発火するAPIエンドポイントのadd_info対応（要実装）
