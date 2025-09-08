CREATE TABLE dm_groups_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    opened_at                       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    is_hidden                       BOOLEAN         NOT NULL DEFAULT TRUE,
    join_request_allow              relship         NOT NULL DEFAULT 'anyone',
    join_auto_allow                 relship         NOT NULL DEFAULT 'no-one',
    name                            VARCHAR(200)    NOT NULL,
    icon_rel_id                     UUID            REFERENCES storage.objects(id) ON DELETE SET NULL,
    created_by_user_rel_id          BIGINT          REFERENCES users_master(rel_id) ON DELETE SET NULL,

    CONSTRAINT dm_groups_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT dm_groups_opened_time_valid CHECK (opened_at <= NOW())
);

CREATE UNIQUE INDEX idx__dm_groups_master__pub_id ON dm_groups_master (pub_id);
CREATE INDEX idx__dm_groups_master__opened_at ON dm_groups_master (opened_at);
CREATE INDEX idx__dm_groups_master__is_hidden ON dm_groups_master (is_hidden);
CREATE INDEX idx__dm_groups_master__name ON dm_groups_master (name);
CREATE INDEX idx__dm_groups_master__icon_rel_id ON dm_groups_master (icon_rel_id);
CREATE INDEX idx__dm_groups_master__created_by_user_rel_id ON dm_groups_master (created_by_user_rel_id);


CREATE TABLE dm_groups_lines_tags (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    dm_group_rel_id                 BIGINT          NOT NULL REFERENCES dm_groups_master(rel_id) ON DELETE CASCADE,
    tag_rel_id                      BIGINT          NOT NULL REFERENCES tags_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__dm_groups_lines_tags__group_tag ON dm_groups_lines_tags (dm_group_rel_id, tag_rel_id);
CREATE INDEX idx__dm_groups_lines_tags__tag_rel_id ON dm_groups_lines_tags (tag_rel_id);


CREATE TABLE dm_groups_lines_members (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    dm_group_rel_id                 BIGINT          NOT NULL REFERENCES dm_groups_master(rel_id) ON DELETE CASCADE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    is_admin                        BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx__dm_groups_lines_members__group_user ON dm_groups_lines_members (dm_group_rel_id, user_rel_id);
CREATE INDEX idx__dm_groups_lines_members__user_rel_id ON dm_groups_lines_members (user_rel_id);
CREATE INDEX idx__dm_groups_lines_members__is_admin ON dm_groups_lines_members (is_admin);


CREATE TABLE dm_groups_lines_invites (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    dm_group_rel_id                 BIGINT          NOT NULL REFERENCES dm_groups_master(rel_id) ON DELETE CASCADE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__dm_groups_lines_invites__group_user ON dm_groups_lines_invites (dm_group_rel_id, user_rel_id);
CREATE INDEX idx__dm_groups_lines_invites__user_rel_id ON dm_groups_lines_invites (user_rel_id);


CREATE TABLE dm_groups_lines_requests (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    dm_group_rel_id                 BIGINT          NOT NULL REFERENCES dm_groups_master(rel_id) ON DELETE CASCADE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__dm_groups_lines_requests__group_user ON dm_groups_lines_requests (dm_group_rel_id, user_rel_id);
CREATE INDEX idx__dm_groups_lines_requests__user_rel_id ON dm_groups_lines_requests (user_rel_id);


CREATE TABLE dm_groups_lines_blocks (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    dm_group_rel_id                 BIGINT          NOT NULL REFERENCES dm_groups_master(rel_id) ON DELETE CASCADE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__dm_groups_lines_blocks__group_user ON dm_groups_lines_blocks (dm_group_rel_id, user_rel_id);
CREATE INDEX idx__dm_groups_lines_blocks__user_rel_id ON dm_groups_lines_blocks (user_rel_id);


CREATE TABLE dm_groups_messages_master (
    rel_id              BIGSERIAL       PRIMARY KEY,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id              CHAR(21)        NOT NULL UNIQUE,
    dm_group_rel_id     BIGINT          NOT NULL REFERENCES dm_groups_master(rel_id) ON DELETE CASCADE,
    sent_by_user_rel_id BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    sent_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    body                TEXT            NOT NULL,

    CONSTRAINT dm_groups_messages_body_not_empty CHECK (LENGTH(TRIM(body)) > 0),
    CONSTRAINT dm_groups_messages_time_valid CHECK (sent_at <= NOW())
);

CREATE UNIQUE INDEX idx__dm_groups_messages__pub_id ON dm_groups_messages_master (pub_id);
CREATE INDEX idx__dm_groups_messages__dm_group_rel_id ON dm_groups_messages_master (dm_group_rel_id);
CREATE INDEX idx__dm_groups_messages__sent_by_user_rel_id ON dm_groups_messages_master (sent_by_user_rel_id);
CREATE INDEX idx__dm_groups_messages__sent_at ON dm_groups_messages_master (sent_at);


CREATE TABLE dm_groups_messages_lines_mentions (
    rel_id              BIGSERIAL       PRIMARY KEY,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    message_rel_id      BIGINT          NOT NULL REFERENCES dm_groups_messages_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id  BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    offset_num          SMALLINT        NOT NULL,

    CONSTRAINT dm_groups_messages_lines_mentions_offset_num_non_negative CHECK (offset_num >= 0)
);

CREATE INDEX idx__dm_groups_messages_lines_mentions__message_rel_id ON dm_groups_messages_lines_mentions (message_rel_id);
CREATE INDEX idx__dm_groups_messages_lines_mentions__target_user_rel_id ON dm_groups_messages_lines_mentions (target_user_rel_id);


CREATE TABLE dm_groups_messages_line_reply (
    rel_id                  BIGSERIAL       PRIMARY KEY,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    message_rel_id          BIGINT          NOT NULL UNIQUE REFERENCES dm_groups_messages_master(rel_id) ON DELETE CASCADE,
    target_message_rel_id   BIGINT          NOT NULL REFERENCES dm_groups_messages_master(rel_id) ON DELETE CASCADE,

    CONSTRAINT dm_groups_messages_line_reply_no_self_reply CHECK (message_rel_id <> target_message_rel_id)
);

CREATE UNIQUE INDEX idx__dm_groups_messages_line_reply__message_rel_id ON dm_groups_messages_line_reply (message_rel_id);
CREATE INDEX idx__dm_groups_messages_line_reply__target_message_rel_id ON dm_groups_messages_line_reply (target_message_rel_id);
