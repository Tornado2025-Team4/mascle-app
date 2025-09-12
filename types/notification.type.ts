export type NotificationKind =
  | 'matching/offline/same-gym'
  | 'matching/online/recommend'
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
  | 'dm/group/invite-received'
  | 'dm/group/request-accepted'
  | 'dm/group/request-received'
  | 'dm/group/member-added'
  | 'dm/group/received'
  | 'report/resolved'
  | 'report/rejected'
  | 'system/warning'
  | 'system/announcement'
  | 'other'

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
  is_oneshot?: boolean
  is_read: boolean
  icon_url?: string
  mentions?: NotificationMention[]
  add_info?: {
    post_id?: string
    dm_pair_id?: string
    [key: string]: unknown
  }
  igniter_user?: {
    pub_id?: string
    anon_pub_id?: string
    handle?: string
    display_name?: string
    description?: string
    tags?: Array<{
      pub_id: string
      name: string
    }>
    icon_url?: string
    skill_level?: string
    followings_count?: number
    followers_count?: number
  }
}
