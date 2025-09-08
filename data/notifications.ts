import type { Notification } from "@/types/notification.type";

export const fallbackNotifications: Notification[] = [
  // 最近の通知（未読）
  {
    pub_id: "1",
    notified_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5分前
    kind: "post/liked",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "1",
        offset_num: 0,
        target_user_rel_id: "1",
        use_to_notification_icon: true,
        profile: {
          uuid: "1",
          handle: "muscle_san",
          display_name: "筋肉さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "2",
    notified_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15分前
    kind: "social/follower-added",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "2",
        offset_num: 0,
        target_user_rel_id: "2",
        use_to_notification_icon: true,
        profile: {
          uuid: "2",
          handle: "takkun_san",
          display_name: "たっくんさん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "3",
    notified_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分前
    kind: "post/mentioned",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "3",
        offset_num: 0,
        target_user_rel_id: "3",
        use_to_notification_icon: true,
        profile: {
          uuid: "3",
          handle: "yamada_san",
          display_name: "山田さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "4",
    notified_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45分前
    kind: "post/commented",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "4",
        offset_num: 0,
        target_user_rel_id: "4",
        use_to_notification_icon: true,
        profile: {
          uuid: "4",
          handle: "sato_san",
          display_name: "佐藤さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "5",
    notified_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前
    kind: "dm/pair/received",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "5",
        offset_num: 0,
        target_user_rel_id: "5",
        use_to_notification_icon: true,
        profile: {
          uuid: "5",
          handle: "peko_chan",
          display_name: "ぺこちゃんさん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "6",
    notified_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3時間前
    kind: "matching/offline/same-gym",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "6",
        offset_num: 0,
        target_user_rel_id: "6",
        use_to_notification_icon: true,
        profile: {
          uuid: "6",
          handle: "oga_san",
          display_name: "おがさん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "7",
    notified_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4時間前
    kind: "social/following-posted",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "7",
        offset_num: 0,
        target_user_rel_id: "7",
        use_to_notification_icon: true,
        profile: {
          uuid: "7",
          handle: "tanaka_san",
          display_name: "田中さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "8",
    notified_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5時間前
    kind: "social/following-started-training",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "8",
        offset_num: 0,
        target_user_rel_id: "8",
        use_to_notification_icon: true,
        profile: {
          uuid: "8",
          handle: "suzuki_san",
          display_name: "鈴木さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "9",
    notified_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6時間前
    kind: "social/training-partner-request",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "9",
        offset_num: 0,
        target_user_rel_id: "9",
        use_to_notification_icon: true,
        profile: {
          uuid: "9",
          handle: "watanabe_san",
          display_name: "渡辺さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "10",
    notified_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7時間前
    kind: "dm/pair/invite-received",
    is_oneshot: false,
    is_read: false,
    icon_url: "",
    mentions: [
      {
        rel_id: "10",
        offset_num: 0,
        target_user_rel_id: "10",
        use_to_notification_icon: true,
        profile: {
          uuid: "10",
          handle: "ito_san",
          display_name: "伊藤さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  // 既読の通知
  {
    pub_id: "11",
    notified_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8時間前
    kind: "dm/pair/request-accepted",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "11",
        offset_num: 0,
        target_user_rel_id: "11",
        use_to_notification_icon: true,
        profile: {
          uuid: "11",
          handle: "kobayashi_san",
          display_name: "小林さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "12",
    notified_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), // 9時間前
    kind: "dm/group/invite-received",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "12",
        offset_num: 0,
        target_user_rel_id: "12",
        use_to_notification_icon: true,
        profile: {
          uuid: "12",
          handle: "kato_san",
          display_name: "加藤さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "13",
    notified_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10時間前
    kind: "dm/group/request-accepted",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "13",
        offset_num: 0,
        target_user_rel_id: "13",
        use_to_notification_icon: true,
        profile: {
          uuid: "13",
          handle: "yoshida_san",
          display_name: "吉田さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "14",
    notified_at: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), // 11時間前
    kind: "dm/group/request-received",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "14",
        offset_num: 0,
        target_user_rel_id: "14",
        use_to_notification_icon: true,
        profile: {
          uuid: "14",
          handle: "yamamoto_san",
          display_name: "山本さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "15",
    notified_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12時間前
    kind: "dm/group/member-added",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "15",
        offset_num: 0,
        target_user_rel_id: "15",
        use_to_notification_icon: true,
        profile: {
          uuid: "15",
          handle: "nakamura_san",
          display_name: "中村さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "16",
    notified_at: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(), // 13時間前
    kind: "dm/group/received",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "16",
        offset_num: 0,
        target_user_rel_id: "16",
        use_to_notification_icon: true,
        profile: {
          uuid: "16",
          handle: "kuroda_san",
          display_name: "黒田さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  // 昨日の通知
  {
    pub_id: "17",
    notified_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1日前
    kind: "matching/online/recommend",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "17",
        offset_num: 0,
        target_user_rel_id: "17",
        use_to_notification_icon: true,
        profile: {
          uuid: "17",
          handle: "fujita_san",
          display_name: "藤田さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "18",
    notified_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 1日前1時間前
    kind: "report/resolved",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [],
  },
  {
    pub_id: "19",
    notified_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 1日前2時間前
    kind: "report/rejected",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [],
  },
  {
    pub_id: "20",
    notified_at: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(), // 1日前3時間前
    kind: "system/warning",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [],
  },
  {
    pub_id: "21",
    notified_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(), // 1日前4時間前
    kind: "system/announcement",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [],
  },
  // 2日前の通知
  {
    pub_id: "22",
    notified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2日前
    kind: "other",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "22",
        offset_num: 0,
        target_user_rel_id: "22",
        use_to_notification_icon: true,
        profile: {
          uuid: "22",
          handle: "mori_san",
          display_name: "森さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "23",
    notified_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日前
    kind: "post/liked",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "23",
        offset_num: 0,
        target_user_rel_id: "23",
        use_to_notification_icon: true,
        profile: {
          uuid: "23",
          handle: "hasegawa_san",
          display_name: "長谷川さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "24",
    notified_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4日前
    kind: "social/follower-added",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "24",
        offset_num: 0,
        target_user_rel_id: "24",
        use_to_notification_icon: true,
        profile: {
          uuid: "24",
          handle: "okada_san",
          display_name: "岡田さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
  {
    pub_id: "25",
    notified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5日前
    kind: "post/mentioned",
    is_oneshot: false,
    is_read: true,
    icon_url: "",
    mentions: [
      {
        rel_id: "25",
        offset_num: 0,
        target_user_rel_id: "25",
        use_to_notification_icon: true,
        profile: {
          uuid: "25",
          handle: "goto_san",
          display_name: "後藤さん",
          description: "",
          icon_url: "/images/image.png",
        },
      },
    ],
  },
];
