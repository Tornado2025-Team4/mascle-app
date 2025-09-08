CREATE TABLE dm_pairs_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    user_a_rel_id                   BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    user_b_rel_id                   BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    user_a_allowed                  BOOLEAN         NOT NULL DEFAULT FALSE,
    user_b_allowed                  BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT dm_pairs_master_users_different CHECK (user_a_rel_id <> user_b_rel_id),
    CONSTRAINT dm_pairs_master_user_ordering CHECK (user_a_rel_id < user_b_rel_id)
);

CREATE UNIQUE INDEX idx__dm_pairs_master__pub_id ON dm_pairs_master (pub_id);
CREATE UNIQUE INDEX idx__dm_pairs__users_pair ON dm_pairs_master (user_a_rel_id, user_b_rel_id);
CREATE INDEX idx__dm_pairs__user_a ON dm_pairs_master (user_a_rel_id);
CREATE INDEX idx__dm_pairs__user_b ON dm_pairs_master (user_b_rel_id);


CREATE TABLE dm_pair_messages_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    dm_pair_rel_id                  BIGINT          NOT NULL REFERENCES dm_pairs_master(rel_id) ON DELETE CASCADE,
    sent_user_rel_id                BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    sent_at                         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    body                            TEXT            NOT NULL,

    CONSTRAINT dm_pair_messages_body_not_empty CHECK (LENGTH(TRIM(body)) > 0),
    CONSTRAINT dm_pair_messages_time_reasonable CHECK (sent_at <= NOW())
);

CREATE UNIQUE INDEX idx__dm_pair_messages__pub_id ON dm_pair_messages_master (pub_id);
CREATE INDEX idx__dm_pair_messages__dm_pair_rel_id ON dm_pair_messages_master (dm_pair_rel_id);
CREATE INDEX idx__dm_pair_messages__sent_user_rel_id ON dm_pair_messages_master (sent_user_rel_id);
CREATE INDEX idx__dm_pair_messages__sent_at ON dm_pair_messages_master (sent_at);


CREATE TABLE dm_pair_messages_lines_mentions (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    message_rel_id                  BIGINT          NOT NULL REFERENCES dm_pair_messages_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    offset_num                      SMALLINT        NOT NULL,

    CONSTRAINT dm_pair_messages_lines_mentions_offset_non_negative CHECK (offset_num >= 0)
);

CREATE INDEX idx__dm_pair_messages_lines_mentions__message_rel_id ON dm_pair_messages_lines_mentions (message_rel_id);
CREATE INDEX idx__dm_pair_messages_lines_mentions__target_user_rel_id ON dm_pair_messages_lines_mentions (target_user_rel_id);


CREATE TABLE dm_pair_messages_line_reply (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    message_rel_id                  BIGINT          NOT NULL UNIQUE REFERENCES dm_pair_messages_master(rel_id) ON DELETE CASCADE,
    target_message_rel_id           BIGINT          NOT NULL REFERENCES dm_pair_messages_master(rel_id) ON DELETE CASCADE,

    CONSTRAINT dm_pairs_messages_line_reply_no_self_reply CHECK (message_rel_id <> target_message_rel_id)
);

CREATE UNIQUE INDEX idx__dm_pair_messages_line_reply__message_rel_id ON dm_pair_messages_line_reply (message_rel_id);
CREATE INDEX idx__dm_pair_messages_line_reply__target_message_rel_id ON dm_pair_messages_line_reply (target_message_rel_id);
