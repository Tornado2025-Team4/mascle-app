import type { Notification } from '@/types/notification.type';
import { useRouter } from 'next/navigation';

// 通知の表示テキストを取得
export const getNotificationDisplayText = (
  notification: Notification,
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
    case "dm/group/received":
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
    case "dm/group/invite-received":
      return `${user_name}さんからグループDM招待がありました`;
    case "dm/group/request-accepted":
      return `${user_name}さんがグループDM申請を承認しました`;
    case "dm/group/request-received":
      return `${user_name}さんからグループDM申請がありました`;
    case "dm/group/member-added":
      return `${user_name}さんがグループDMに追加されました`;
    case "matching/online/recommend":
      return `${user_name}さんがおすすめされました`;
    case "report/resolved":
      return "報告が解決されました";
    case "report/rejected":
      return "報告が却下されました";
    case "system/warning":
      return "システム警告";
    case "system/announcement":
      return "システムお知らせ";
    case "other":
      return user_name 
        ? `${user_name}さんからの通知`
        : "通知";
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
      return user_uuid ? `/${user_uuid}` : '/';
    
    case "social/follower-added":
    case "social/following-posted":
    case "social/following-started-training":
    case "social/training-partner-request":
    case "matching/offline/same-gym":
    case "matching/online/recommend":
      // ユーザープロフィールページ
      return user_uuid ? `/${user_uuid}` : '/';
    
    case "dm/pair/received":
    case "dm/pair/invite-received":
    case "dm/pair/request-accepted":
    case "dm/group/received":
    case "dm/group/invite-received":
    case "dm/group/request-accepted":
    case "dm/group/request-received":
    case "dm/group/member-added":
      // DMページ
      return '/dm';
    
    case "report/resolved":
    case "report/rejected":
      // 報告ページ（未実装）
      return '/';
    
    case "system/warning":
    case "system/announcement":
      // システム通知ページ（未実装）
      return '/';
    
    case "other":
    default:
      // デフォルトはホーム
      return '/';
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