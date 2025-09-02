CREATE TABLE users_line_profile (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL UNIQUE REFERENCES users_master(rel_id) ON DELETE CASCADE,
    display_name                    VARCHAR(100),
    description                     TEXT,
    icon_rel_id                     UUID            REFERENCES storage.objects(id),
    birth_date                      DATE,
    gender                          gender,
    training_since                  DATE,
    skill_level                     SMALLINT,
    registered_at                   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_line_profile_birth_date_past CHECK (birth_date < CURRENT_DATE),
    CONSTRAINT users_line_profile_training_since_valid CHECK (training_since <= CURRENT_DATE),
    CONSTRAINT users_line_profile_display_name_not_empty CHECK (LENGTH(TRIM(display_name)) > 0)
);

CREATE UNIQUE INDEX idx__users_line_profile__user_rel_id ON users_line_profile (user_rel_id);
CREATE INDEX idx__users_line_profile__display_name ON users_line_profile (display_name);
CREATE INDEX idx__users_line_profile__gender ON users_line_profile (gender);
CREATE INDEX idx__users_line_profile__birth_date ON users_line_profile (birth_date);
CREATE INDEX idx__users_line_profile__training_since ON users_line_profile (training_since);
CREATE INDEX idx__users_line_profile__skill_level ON users_line_profile (skill_level);
CREATE INDEX idx__users_line_profile__icon_rel_id ON users_line_profile (icon_rel_id);


CREATE TABLE users_lines_tags (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    tag_rel_id                      BIGINT          NOT NULL REFERENCES tags_master(rel_id)
);

CREATE UNIQUE INDEX idx__users_lines_tags__user_tag ON users_lines_tags (user_rel_id, tag_rel_id);
CREATE INDEX idx__users_lines_tags__tag_rel_id ON users_lines_tags (tag_rel_id);


CREATE TABLE users_lines_intents (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    intent_rel_id                   BIGINT          NOT NULL REFERENCES intents_master(rel_id)
);

CREATE UNIQUE INDEX idx__users_lines_intents__user_intent ON users_lines_intents (user_rel_id, intent_rel_id);
CREATE INDEX idx__users_lines_intents__intent_rel_id ON users_lines_intents (intent_rel_id);


CREATE TABLE users_lines_intent_bodyparts (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    bodypart_rel_id                 BIGINT          NOT NULL REFERENCES bodyparts_master(rel_id)
);

CREATE UNIQUE INDEX idx__users_lines_intent_bodyparts__user_bodypart ON users_lines_intent_bodyparts (user_rel_id, bodypart_rel_id);
CREATE INDEX idx__users_lines_intent_bodyparts__bodypart_rel_id ON users_lines_intent_bodyparts (bodypart_rel_id);


CREATE TABLE users_lines_belonging_gyms (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    gym_rel_id                      BIGINT          NOT NULL REFERENCES gyms_master(rel_id),
    joined_at                       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx__users_lines_belonging_gyms__user_gym ON users_lines_belonging_gyms (user_rel_id, gym_rel_id);
CREATE INDEX idx__users_lines_belonging_gyms__gym_rel_id ON users_lines_belonging_gyms (gym_rel_id);


CREATE TABLE status_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    started_at                      TIMESTAMPTZ     NOT NULL,
    finished_at                     TIMESTAMPTZ,
    is_auto_detected                BOOLEAN         NOT NULL DEFAULT FALSE,
    gym_rel_id                      BIGINT          REFERENCES gyms_master(rel_id),

    CONSTRAINT status_time_order CHECK (finished_at IS NULL OR finished_at > started_at),
    CONSTRAINT status_started_at_past CHECK (started_at <= NOW()),
    CONSTRAINT status_reasonable_duration CHECK (
        finished_at IS NULL OR
        finished_at - started_at <= INTERVAL '12 hours'
    )
);

CREATE UNIQUE INDEX idx__status__pub_id ON status_master (pub_id);
CREATE INDEX idx__status__user_id ON status_master (user_rel_id);
CREATE INDEX idx__status__started_at ON status_master (started_at);
CREATE INDEX idx__status__finished_at ON status_master (finished_at);
CREATE INDEX idx__status__auto_detected ON status_master (is_auto_detected);
CREATE INDEX idx__status__gym_id ON status_master (gym_rel_id);


CREATE TABLE status_lines_partners (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    status_rel_id                   BIGINT          NOT NULL REFERENCES status_master(rel_id) ON DELETE CASCADE,
    partner_user_rel_id             BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__status_lines_with__status_partner ON status_lines_partners (status_rel_id, partner_user_rel_id);
CREATE INDEX idx__status_lines_with__partner_user_rel_id ON status_lines_partners (partner_user_rel_id);


CREATE TABLE menus_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    name                            VARCHAR(100)    NOT NULL,
    bodypart_rel_id                 BIGINT          REFERENCES bodyparts_master(rel_id),

    CONSTRAINT menus_master_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE UNIQUE INDEX idx__menus_master__pub_id ON menus_master (pub_id);
CREATE INDEX idx__menus_master__user_rel_id ON menus_master (user_rel_id);
CREATE INDEX idx__menus_master__name ON menus_master (name);
CREATE INDEX idx__menus_master__bodypart_rel_id ON menus_master (bodypart_rel_id);


CREATE TABLE menus_cardio_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    user_rel_id                     BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    name                            VARCHAR(100)    NOT NULL,

    CONSTRAINT menus_cardio_master_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE UNIQUE INDEX idx__menus_cardio_master__pub_id ON menus_cardio_master (pub_id);
CREATE INDEX idx__menus_cardio_master__user_rel_id ON menus_cardio_master (user_rel_id);
CREATE INDEX idx__menus_cardio_master__name ON menus_cardio_master (name);


CREATE TABLE status_lines_menus (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    status_rel_id                   BIGINT          NOT NULL REFERENCES status_master(rel_id) ON DELETE CASCADE,
    menu_rel_id                     BIGINT          NOT NULL REFERENCES menus_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__status_lines_menus__status_menu ON status_lines_menus (status_rel_id, menu_rel_id);
CREATE INDEX idx__status_lines_menus__menu_rel_id ON status_lines_menus (menu_rel_id);


CREATE TABLE status_lines_menus_cardio (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    status_rel_id                   BIGINT          NOT NULL REFERENCES status_master(rel_id) ON DELETE CASCADE,
    menu_cardio_rel_id              BIGINT          NOT NULL REFERENCES menus_cardio_master(rel_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx__status_lines_menus_cardio__status_menu ON status_lines_menus_cardio (status_rel_id, menu_cardio_rel_id);
CREATE INDEX idx__status_lines_menus_cardio__menu_cardio_rel_id ON status_lines_menus_cardio (menu_cardio_rel_id);


CREATE TABLE status_lines_menus_sets (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    status_menu_rel_id              BIGINT          NOT NULL REFERENCES status_lines_menus(rel_id) ON DELETE CASCADE,
    set_num                         SMALLINT        NOT NULL,
    weight                          DECIMAL(5,2),
    reps                            SMALLINT,

    CONSTRAINT status_lines_menus_sets_set_num_positive CHECK (set_num > 0),
    CONSTRAINT status_lines_menus_sets_weight_positive CHECK (weight IS NULL OR weight >= 0),
    CONSTRAINT status_lines_menus_sets_reps_positive CHECK (reps IS NULL OR reps > 0)
);

CREATE UNIQUE INDEX idx__status_lines_menus_sets__status_menu_set ON status_lines_menus_sets (status_menu_rel_id, set_num);
CREATE INDEX idx__status_lines_menus_sets__weight ON status_lines_menus_sets (weight);
CREATE INDEX idx__status_lines_menus_sets__reps ON status_lines_menus_sets (reps);


CREATE TABLE status_lines_menus_cardio_details (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    status_menu_cardio_rel_id       BIGINT          NOT NULL REFERENCES status_lines_menus_cardio(rel_id) ON DELETE CASCADE,
    duration                        INTERVAL,
    distance                        DECIMAL(8,2),   -- km

    CONSTRAINT status_lines_menus_cardio_details_duration_positive CHECK (duration IS NULL OR duration > INTERVAL '0'),
    CONSTRAINT status_lines_menus_cardio_details_distance_positive CHECK (distance IS NULL OR distance > 0)
);

CREATE UNIQUE INDEX idx__status_lines_menus_cardio_details__status_menu_cardio ON status_lines_menus_cardio_details (status_menu_cardio_rel_id);
CREATE INDEX idx__status_lines_menus_cardio_details__duration ON status_lines_menus_cardio_details (duration);
CREATE INDEX idx__status_lines_menus_cardio_details__distance ON status_lines_menus_cardio_details (distance);

/*

1. メニューマスタを追加→ok
2. メニューと状態を紐づける中間テーブル
    - ここでセット数や重量、回数を記録する → ok
3. 投稿に状態を紐づけられるようにする → ok
4. 1,2で発生した新規テーブルにRLSを適用 → ok
5. プライバシーマスクの種類を追加→ok
6. 1と2のためのビュー？←なにを見せる？
   多分ポストビューにまとめるのが早い
7. profileも集約ビューに設計変更(結局JOIN的なのが必要になるのでは無意味？)
    てかそもそもビューは更新用ではなく取得用だから正規化不要

トレーニング履歴はwithがいる

↓ 結局

新テーブル追加(マスタ+中間)
RLS適用
既存テーブル変更
既存のビューを再設計

こうなる

てか通知の件、もとの定義に戻したほうがいいような…
1アクションで複数ユーザに通知が飛ぶことが割とある
あとついでに本文生成はFEに移す





残りのタスク
- 通知形式ロルバ(アサイン式) → ok
- 通知関連RLS修正 → ok
- アップデートトリガー追加 → ok
- ビュー修正

ビューどうする？
取得は基本的に全部まとめてだから1ビューにまとめる？
→メニューは複数個所で取得？

てかBEがJOIN責任を負いすぎでは



プロフィールとしてしか利用しない項目は1ビューに集約
statusやメニューはそこはそこで集約ビュー
投稿もそのビューを参照するための識別子でいい

となると
- 実プロフィールビュー
- 仮想プロフィールビュー
- メニュー集約ビュー
- 状態履歴集約ビュー
- 投稿集約ビュー
- 通知ビュー

*/