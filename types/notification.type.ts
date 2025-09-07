export type NotificationKind = 
  | 'matching/offline/same-gym'
  | 'social/follower-added'
  | 'social/following-posted'
  | 'social/following-started-training'
  | 'social/training-partner-request'
  | 'post/liked'
  | 'post/commented'
  | 'post/mentioned'
  | 'dm/pair/invite-received'
  | 'dm/pair/request-accepted'
  | 'dm/pair/received'

export type NotificationMention = {
  rel_id: string
  offset_num: number
  target_user_rel_id: string
  use_to_notification_icon: boolean
  profile: {
    uuid: string
    handle: string
    display_name: string
    description: string
    icon_url: string
  }
}

export type Notification = {
  pub_id: string
  notified_at: string
  kind: NotificationKind
  is_oneshot: boolean
  is_read: boolean
  icon_url: string
  mentions: NotificationMention[]
}
