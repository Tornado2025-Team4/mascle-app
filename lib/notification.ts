import type { Notification } from "@/types/notification.type";
import { useRouter } from "next/navigation";

// 通知の表示テキストを取得
export const getNotificationDisplayText = (
  notification: Notification
): string => {
  const user_name = notification.mentions[0]?.profile.display_name;
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
      return `${user_name}さんからトレーニングパートナー申請がありました`;
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
  const user_uuid = notification.mentions[0]?.profile.uuid;

  switch (notification.kind) {
    case "post/liked":
    case "post/commented":
    case "post/mentioned":
      // 投稿詳細ページ（post_idが必要だが、現在のデータ構造では取得できないため、ユーザーページに遷移）
      return user_uuid ? `/${user_uuid}` : "/";

    case "social/follower-added":
    case "social/following-posted":
    case "social/following-started-training":
    case "social/training-partner-request":
    case "matching/offline/same-gym":
      // ユーザープロフィールページ
      return user_uuid ? `/${user_uuid}` : "/";

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
