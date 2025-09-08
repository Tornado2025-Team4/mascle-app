export interface DMPair {
  dm_id: string;
  user_b_id: string;
  user_b_display_name: string;
  user_b_icon_url: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  user_b_allowed: boolean;
}

export interface DMHistory {
  message_id: string;
  user_id: string;
  message: string;
  reply_id?: string;
  created_at: string;
}

export interface DMDetail {
  dm_id: string;
  user_b_id: string;
  user_b_display_name: string;
  user_b_icon_url: string;
  user_b_allowed: boolean;
}

export interface SendMessageRequest {
  message: string;
  reply_id?: string;
}

export interface StartDMRequest {
  user_id: string;
}
