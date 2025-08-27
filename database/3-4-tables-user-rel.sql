CREATE TABLE users_lines_followings (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    followed_at                     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_lines_followings_no_self_follow CHECK (user_rel_id <> target_user_rel_id)
);

CREATE UNIQUE INDEX idx__followings__user_target ON users_lines_followings (user_rel_id, target_user_rel_id);
CREATE INDEX idx__followings__target_user_id ON users_lines_followings (target_user_rel_id);


CREATE TABLE users_lines_blocks (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,

    CONSTRAINT users_lines_blocks_no_self_block CHECK (user_rel_id <> target_user_rel_id)
);

CREATE UNIQUE INDEX idx__blocks__user_target ON users_lines_blocks (user_rel_id, target_user_rel_id);
CREATE INDEX idx__blocks__target_user_id ON users_lines_blocks (target_user_rel_id);
