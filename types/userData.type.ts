export interface UserData {
  uuid: string;
  handle_id: string;
  display_name: string;
  description: string;
  icon_url: string;
  tags: string[];
  birth_date: string;
  age: number;
  generation: string;
  gender: string;
  training_since: string;
  skill_level: string;
  training_intents: string[];
  training_intent_body_parts: string[];
  belonging_gyms: {
    pub_id: string;
    name: string;
    location?: string;
  }[];
  follows_count: number;
  followers_count: number;
  registered_at: string;
  last_state: {
    pub_id: string;
    started_at: string;
    finished_at?: string;
    is_auto_detected: boolean;
    gym_pub_id: string;
    gym_name: string;
  };
}

export interface Follow {
  user_id: string;
  display_name: string;
  description: string;
  icon_url: string;
}