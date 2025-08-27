CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Master tables
CREATE TRIGGER trg_users_master_updated_at BEFORE UPDATE ON users_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tags_master_updated_at BEFORE UPDATE ON tags_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_intents_master_updated_at BEFORE UPDATE ON intents_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bodyparts_master_updated_at BEFORE UPDATE ON bodyparts_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_gymchains_master_updated_at BEFORE UPDATE ON gymchains_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_gyms_master_updated_at BEFORE UPDATE ON gyms_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User profile tables
CREATE TRIGGER trg_users_line_profile_updated_at BEFORE UPDATE ON users_line_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_lines_tags_updated_at BEFORE UPDATE ON users_lines_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_lines_belonging_gyms_updated_at BEFORE UPDATE ON users_lines_belonging_gyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_lines_intents_updated_at BEFORE UPDATE ON users_lines_intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_lines_intent_bodyparts_updated_at BEFORE UPDATE ON users_lines_intent_bodyparts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_status_master_updated_at BEFORE UPDATE ON status_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User config tables
CREATE TRIGGER trg_users_line_config_updated_at BEFORE UPDATE ON users_line_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_line_privacy_online_updated_at BEFORE UPDATE ON users_line_privacy_online FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_line_privacy_offline_updated_at BEFORE UPDATE ON users_line_privacy_offline FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User relationships
CREATE TRIGGER trg_users_lines_followings_updated_at BEFORE UPDATE ON users_lines_followings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_lines_blocks_updated_at BEFORE UPDATE ON users_lines_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Posts tables
CREATE TRIGGER trg_posts_master_updated_at BEFORE UPDATE ON posts_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_posts_lines_body_mentions_updated_at BEFORE UPDATE ON posts_lines_body_mentions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_posts_lines_tags_updated_at BEFORE UPDATE ON posts_lines_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_posts_lines_photos_updated_at BEFORE UPDATE ON posts_lines_photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_posts_lines_likes_updated_at BEFORE UPDATE ON posts_lines_likes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_comments_master_updated_at BEFORE UPDATE ON comments_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_comments_lines_mentions_updated_at BEFORE UPDATE ON comments_lines_mentions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notices tables
CREATE TRIGGER trg_notices_master_updated_at BEFORE UPDATE ON notices_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_notices_lines_mentions_updated_at BEFORE UPDATE ON notices_lines_mentions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DM pair tables
CREATE TRIGGER trg_dm_pairs_master_updated_at BEFORE UPDATE ON dm_pairs_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_pair_messages_master_updated_at BEFORE UPDATE ON dm_pair_messages_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_pair_messages_lines_mentions_updated_at BEFORE UPDATE ON dm_pair_messages_lines_mentions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_pair_messages_line_reply_updated_at BEFORE UPDATE ON dm_pair_messages_line_reply FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DM group tables
CREATE TRIGGER trg_dm_groups_master_updated_at BEFORE UPDATE ON dm_groups_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_lines_tags_updated_at BEFORE UPDATE ON dm_groups_lines_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_lines_members_updated_at BEFORE UPDATE ON dm_groups_lines_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_lines_invites_updated_at BEFORE UPDATE ON dm_groups_lines_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_lines_requests_updated_at BEFORE UPDATE ON dm_groups_lines_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_lines_blocks_updated_at BEFORE UPDATE ON dm_groups_lines_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_messages_master_updated_at BEFORE UPDATE ON dm_groups_messages_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_messages_lines_mentions_updated_at BEFORE UPDATE ON dm_groups_messages_lines_mentions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dm_groups_messages_line_reply_updated_at BEFORE UPDATE ON dm_groups_messages_line_reply FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reports tables
CREATE TRIGGER trg_reports_master_updated_at BEFORE UPDATE ON reports_master FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
