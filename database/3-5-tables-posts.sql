CREATE TABLE posts_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    posted_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    posted_at                       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    body                            TEXT,
    status_rel_id                   BIGINT          REFERENCES status_master(rel_id) ON DELETE SET NULL,

    CONSTRAINT posts_master_posted_at_reasonable CHECK (posted_at <= NOW()),
    CONSTRAINT posts_master_body_not_empty CHECK (LENGTH(TRIM(body)) > 0)
);

CREATE UNIQUE INDEX idx__posts_master__pub_id ON posts_master (pub_id);
CREATE INDEX idx__posts_master__posted_user_rel_id ON posts_master (posted_user_rel_id);
CREATE INDEX idx__posts_master__posted_at ON posts_master (posted_at);
CREATE INDEX idx__posts_master__status_rel_id ON posts_master (status_rel_id);

CREATE INDEX idx__posts_master__body_fts ON posts_master USING pgroonga (body);


CREATE TABLE posts_lines_body_mentions (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    post_rel_id                     BIGINT          NOT NULL REFERENCES posts_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    offset_num                      SMALLINT        NOT NULL,

    CONSTRAINT posts_body_mentions_offset_num_positive CHECK (offset_num >= 0)
);

CREATE INDEX idx__posts_lines_body_mentions__post_rel_id ON posts_lines_body_mentions (post_rel_id);
CREATE INDEX idx__posts_lines_body_mentions__target_user_rel_id ON posts_lines_body_mentions (target_user_rel_id);


CREATE TABLE posts_lines_tags (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    post_rel_id                     BIGINT          NOT NULL REFERENCES posts_master(rel_id) ON DELETE CASCADE,
    tag_rel_id                      BIGINT          NOT NULL REFERENCES tags_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__posts_lines_tags__post_rel_id__tag_rel_id ON posts_lines_tags (post_rel_id, tag_rel_id);
CREATE INDEX idx__posts_lines_tags__tag_rel_id ON posts_lines_tags (tag_rel_id);


CREATE TABLE posts_lines_photos (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    post_rel_id                     BIGINT          NOT NULL REFERENCES posts_master(rel_id) ON DELETE CASCADE,
    photo_rel_id                    UUID            NOT NULL REFERENCES storage.objects(id) ON DELETE CASCADE,
    photo_thumb_rel_id              UUID            REFERENCES storage.objects(id) ON DELETE SET NULL
);

CREATE INDEX idx__posts_lines_photos__post_rel_id ON posts_lines_photos (post_rel_id);
CREATE INDEX idx__posts_lines_photos__photo_rel_id ON posts_lines_photos (photo_rel_id);
CREATE INDEX idx__posts_lines_photos__photo_thumb_rel_id ON posts_lines_photos (photo_thumb_rel_id);


CREATE TABLE posts_lines_likes (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    post_rel_id                     BIGINT          NOT NULL REFERENCES posts_master(rel_id) ON DELETE CASCADE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    liked_at                        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx__posts_lines_likes__post_rel_id__user_rel_id ON posts_lines_likes (post_rel_id, user_rel_id);
CREATE INDEX idx__posts_lines_likes__user_rel_id ON posts_lines_likes (user_rel_id);
CREATE INDEX idx__posts_lines_likes__liked_at ON posts_lines_likes (liked_at);


CREATE TABLE comments_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    post_rel_id                     BIGINT          NOT NULL REFERENCES posts_master(rel_id) ON DELETE CASCADE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    commented_at                    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    body                            TEXT            NOT NULL,

    CONSTRAINT comments_master_commented_at_reasonable CHECK (commented_at <= NOW()),
    CONSTRAINT comments_master_body_not_empty CHECK (LENGTH(TRIM(body)) > 0)
);

CREATE UNIQUE INDEX idx__comments_master__pub_id ON comments_master (pub_id);
CREATE INDEX idx__comments_master__post_rel_id ON comments_master (post_rel_id);
CREATE INDEX idx__comments_master__user_rel_id ON comments_master (user_rel_id);
CREATE INDEX idx__comments_master__commented_at ON comments_master (commented_at);


CREATE TABLE comments_lines_mentions (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    comment_rel_id                  BIGINT          NOT NULL REFERENCES comments_master(rel_id) ON DELETE CASCADE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    offset_num                      SMALLINT        NOT NULL,

    CONSTRAINT comments_lines_mentions_offset_num_positive CHECK (offset_num >= 0)
);

CREATE INDEX idx__comments_lines_mentions__comment_rel_id ON comments_lines_mentions (comment_rel_id);
CREATE INDEX idx__comments_lines_mentions__user_rel_id ON comments_lines_mentions (user_rel_id);
