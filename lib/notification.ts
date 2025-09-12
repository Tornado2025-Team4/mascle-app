import type { Notification } from "@/types/notification.type";
import { useRouter } from "next/navigation";

// 通知種別に応じたアイコン文字列を取得
export const getNotificationIconText = (notification: Notification): string => {
  // フォールバック用のアイコン
  switch (notification.kind) {
    case "post/liked":
      return "❤️";
    case "social/follower-added":
      return "👤";
    case "post/mentioned":
    case "post/commented":
      return "💬";
    case "dm/pair/received":
    case "dm/pair/invite-received":
    case "dm/pair/request-accepted":
      return "📩";
    case "matching/offline/same-gym":
      return "🏋️";
    case "social/following-posted":
      return "📝";
    case "social/following-started-training":
      return "🏋️";
    case "social/training-partner-request":
      return "🤝";
    default:
      return "🔔";
  }
};

// 通知の表示テキストを取得
export const getNotificationDisplayText = (
  notification: Notification
): string => {
  // 新しいAPI形式では igniter_user を使用
  const user_name = notification.igniter_user?.display_name ||
    notification.mentions?.[0]?.profile.display_name ||
    '不明なユーザー';

  switch (notification.kind) {
    case "post/liked":
      return `${user_name}さんからいいねされました`;
    case "social/follower-added":
      return `${user_name}さんからフォローされました`;
    case "post/mentioned":
      return `${user_name}さんからメンションされました`;
    case "dm/pair/received":
      return `${user_name}さんからメッセージがきました`;
    case "matching/offline/same-gym":
      return `${user_name}さんが同じジムにいます`;
    case "post/commented":
      return `${user_name}さんがコメントしました`;
    case "social/following-posted":
      return `${user_name}さんが投稿しました`;
    case "social/following-started-training":
      return `${user_name}さんがトレーニングを開始しました`;
    case "social/training-partner-request":
      return `${user_name}さんから合トレ希望リクエストがありました`;
    case "dm/pair/invite-received":
      return `${user_name}さんからDM招待がありました`;
    case "dm/pair/request-accepted":
      return `${user_name}さんがDM申請を承認しました`;
    default:
      return "通知";
  }
};

// 通知クリック時の遷移先を取得
export const getNotificationLink = (notification: Notification): string => {
  // handleではなくanon_pub_idを使用する
  const user_id = notification.igniter_user?.handle ||
    notification.igniter_user?.anon_pub_id ||
    notification.mentions?.[0]?.profile.uuid;

  // add_infoから投稿IDなどの追加情報を取得
  const addInfo = notification.add_info;

  switch (notification.kind) {
    case "post/liked":
    case "post/commented":
    case "post/mentioned":
    case "social/following-posted":
      // 投稿IDがある場合は投稿詳細ページ、なければユーザーページ
      if (addInfo?.post_id) {
        return `/post/${addInfo.post_id}`;
      }
      return user_id ? `/${user_id}` : "/";

    case "social/follower-added":
    case "social/following-started-training":
    case "social/training-partner-request":
    case "matching/offline/same-gym":
      // ユーザープロフィールページ
      return user_id ? `/${user_id}` : "/";

    case "dm/pair/received":
    case "dm/pair/invite-received":
    case "dm/pair/request-accepted":
      // DMページ
      return "/dm";

    default:
      // デフォルトはホーム
      return "/";
  }
};

// 通知クリック時の処理
export const handleNotificationClick = (
  notification: Notification,
  router: ReturnType<typeof useRouter>
) => {
  const link = getNotificationLink(notification);
  router.push(link);
};
