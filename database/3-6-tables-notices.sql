CREATE TABLE notices_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    notified_at                     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    kind                            notice_kind     NOT NULL,
    title                           VARCHAR(200)    NOT NULL,
    body                            TEXT,                    -- ユーザ以外へのリンクをする場合はHTMLをセット
    body_is_markdown                BOOLEAN         NOT NULL DEFAULT FALSE,
    is_oneshot                      BOOLEAN         NOT NULL DEFAULT FALSE,
    is_read                         BOOLEAN         NOT NULL DEFAULT FALSE,
    icon_rel_id                     UUID            REFERENCES storage.objects(id),
    transition_target_origin        TEXT,                     -- 遷移元オリジン(省略でアプリ内)
    transition_target_path          TEXT            NOT NULL, -- 遷移先パス

    CONSTRAINT notices_master_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT notices_master_notified_at_reasonable CHECK (notified_at <= NOW())
);

CREATE UNIQUE INDEX idx__notices_master__pub_id ON notices_master (pub_id);
CREATE INDEX idx__notices_master__user_rel_id ON notices_master (user_rel_id);
CREATE INDEX idx__notices_master__notified_at ON notices_master (notified_at);
CREATE INDEX idx__notices_master__kind ON notices_master (kind);
CREATE INDEX idx__notices_master__title ON notices_master (title);
CREATE INDEX idx__notices_master__body_fts ON notices_master USING GIN (to_tsvector('japanese', body));


CREATE TABLE notices_lines_mentions (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    notice_rel_id                   BIGINT          NOT NULL REFERENCES notices_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    use_offline_pub_id              BOOLEAN         NOT NULL DEFAULT FALSE,
    offset_num                      SMALLINT        NOT NULL,

    use_to_notification_icon        BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT notices_lines_mentions_offset_num_non_negative CHECK (offset_num >= 0)
);

CREATE INDEX idx__notices_lines_mentions__notice_rel_id ON notices_lines_mentions (notice_rel_id);
CREATE INDEX idx__notices_lines_mentions__target_user_rel_id ON notices_lines_mentions (target_user_rel_id);
