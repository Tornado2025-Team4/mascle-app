CREATE TABLE users_line_config (
    rel_id                          BIGSERIAL          PRIMARY KEY,
    created_at                      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT             NOT NULL UNIQUE REFERENCES users_master(rel_id) ON DELETE CASCADE,
    frontend_ux                     JSONB              DEFAULT '{}',
    mute_notice_kinds               notice_kind[]      DEFAULT ARRAY[]::notice_kind[],
    dm_pair_request_allow           relship            DEFAULT 'anyone',
    dm_pair_auto_allow              relship            DEFAULT 'follow-followers',
    dm_group_request_allow          relship            DEFAULT 'anyone',
    dm_group_auto_allow             relship            DEFAULT 'follow-followers',
    enable_matching_offline         BOOLEAN            DEFAULT TRUE
);

CREATE UNIQUE INDEX idx__users_line_config__user_rel_id ON users_line_config (user_rel_id);


CREATE TABLE users_line_privacy (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL UNIQUE REFERENCES users_master(rel_id) ON DELETE CASCADE,

    display_name                    relship         DEFAULT 'anyone',
    description                     relship         DEFAULT 'anyone',
    tags                            relship         DEFAULT 'anyone',
    icon                            relship         DEFAULT 'anyone',
    birth_date                      relship         DEFAULT 'no-one',
    age                             relship         DEFAULT 'no-one',
    generation                      relship         DEFAULT 'no-one',
    gender                          relship         DEFAULT 'no-one',
    registered_since                relship         DEFAULT 'no-one',
    training_since                  relship         DEFAULT 'anyone',
    skill_level                     relship         DEFAULT 'anyone',
    intents                         relship         DEFAULT 'anyone',
    intent_bodyparts                relship         DEFAULT 'anyone',
    belonging_gyms                  relship         DEFAULT 'no-one',
    followings                      relship         DEFAULT 'anyone',
    followings_count                relship         DEFAULT 'anyone',
    followers                       relship         DEFAULT 'anyone',
    followers_count                 relship         DEFAULT 'anyone',
    status                          relship         DEFAULT 'no-one',
    status_location                 relship         DEFAULT 'no-one',
    status_menus                    relship         DEFAULT 'no-one',
    status_histories                relship         DEFAULT 'no-one',
    posts                           relship         DEFAULT 'anyone',
    posts_location                  relship         DEFAULT 'no-one',
    posts_count                     relship         DEFAULT 'anyone'
);

CREATE UNIQUE INDEX idx__users_line_privacy__user_rel_id ON users_line_privacy (user_rel_id);


-- 匿名時に更に表示項目を絞るための設定
CREATE TABLE users_line_privacy_anon (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL UNIQUE REFERENCES users_master(rel_id) ON DELETE CASCADE,

    completely_hidden               BOOLEAN         DEFAULT FALSE,
    view_real_profile               relship         DEFAULT 'follow-followers',

    display_name                    relship         DEFAULT 'follow-followers',
    description                     relship         DEFAULT 'follow-followers',
    tags                            relship         DEFAULT 'follow-followers',
    icon                            relship         DEFAULT 'anyone',
    birth_date                      relship         DEFAULT 'no-one',
    age                             relship         DEFAULT 'no-one',
    generation                      relship         DEFAULT 'no-one',
    gender                          relship         DEFAULT 'no-one',
    registered_since                relship         DEFAULT 'no-one',
    training_since                  relship         DEFAULT 'anyone',
    skill_level                     relship         DEFAULT 'anyone',
    intents                         relship         DEFAULT 'anyone',
    intent_bodyparts                relship         DEFAULT 'anyone',
    followings                      relship         DEFAULT 'follow-followers',
    followings_count                relship         DEFAULT 'anyone',
    followers                       relship         DEFAULT 'follow-followers',
    followers_count                 relship         DEFAULT 'anyone'
);

CREATE UNIQUE INDEX idx__users_line_privacy_anon__user_rel_id ON users_line_privacy_anon (user_rel_id);
