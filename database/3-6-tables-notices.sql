CREATE TABLE notices_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    notified_at                     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    kind                            notice_kind     NOT NULL,
    igniter_user_rel_id             BIGINT          REFERENCES users_master(rel_id) ON DELETE CASCADE,
    add_info                        JSONB           DEFAULT '{}'::JSONB, -- 通知種別固有の追加情報を格納する(投稿IDなど)

    CONSTRAINT notices_master_notified_at_reasonable CHECK (notified_at <= NOW())
);

CREATE UNIQUE INDEX idx__notices_master__pub_id ON notices_master (pub_id);
CREATE INDEX idx__notices_master__notified_at ON notices_master (notified_at);
CREATE INDEX idx__notices_master__kind ON notices_master (kind);
CREATE INDEX idx__notices_master__igniter_user_rel_id ON notices_master (igniter_user_rel_id);


CREATE TABLE notices_lines_assigned_users (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    notice_rel_id                   BIGINT          NOT NULL REFERENCES notices_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    is_read                         BOOLEAN         NOT NULL DEFAULT FALSE,
    should_be_anon                  BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx__notices_lines_assigned_users__notice_target ON notices_lines_assigned_users (notice_rel_id, target_user_rel_id);
CREATE INDEX idx__notices_lines_assigned_users__target_user_rel_id ON notices_lines_assigned_users (target_user_rel_id);
CREATE INDEX idx__notices_lines_assigned_users__is_read ON notices_lines_assigned_users (is_read);
CREATE INDEX idx__notices_lines_assigned_users__target_user_is_read ON notices_lines_assigned_users (target_user_rel_id, is_read);
CREATE INDEX idx__notices_lines_assigned_users__should_be_anon ON notices_lines_assigned_users (should_be_anon);
