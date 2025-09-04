CREATE TABLE users_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          UUID            NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
    anon_pub_id                     CHAR(22)        NOT NULL UNIQUE,
    handle                          VARCHAR(31)     NOT NULL UNIQUE,

    CONSTRAINT users_master_anon_pub_id_format CHECK (anon_pub_id ~ '^~[a-zA-Z0-9_-]{21}$'),
    CONSTRAINT users_master_handle_format CHECK (handle ~ '^@[a-zA-Z0-9_\.-]{3,30}$')
);

CREATE UNIQUE INDEX idx__users_master__pub_id ON users_master (pub_id);
CREATE UNIQUE INDEX idx__users_master__anon_pub_id ON users_master (anon_pub_id);
CREATE UNIQUE INDEX idx__users_master__handle ON users_master (handle);


CREATE TABLE tags_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    name                            VARCHAR(100)    NOT NULL,

    CONSTRAINT tags_master_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT tags_master_name_no_hash_space CHECK (name !~ '[# 　]')
);

CREATE UNIQUE INDEX idx__tags_master__pub_id ON tags_master (pub_id);
CREATE INDEX idx__tags_master__name ON tags_master (name);


CREATE TABLE intents_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    intent                          VARCHAR(200)    NOT NULL,

    CONSTRAINT intents_master_intent_not_empty CHECK (LENGTH(TRIM(intent)) > 0)
);

CREATE UNIQUE INDEX idx__intents_master__pub_id ON intents_master (pub_id);
CREATE        INDEX idx__intents_master__intent ON intents_master (intent);


CREATE TABLE bodyparts_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    bodypart                        VARCHAR(100)    NOT NULL,

    CONSTRAINT bodyparts_master_bodypart_not_empty CHECK (LENGTH(TRIM(bodypart)) > 0)
);

CREATE UNIQUE INDEX idx__bodyparts_master__pub_id ON bodyparts_master (pub_id);
CREATE INDEX idx__bodyparts_master__bodypart ON bodyparts_master (bodypart);


CREATE TABLE gymchains_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    name                            VARCHAR(200)    NOT NULL,
    icon_rel_id                     UUID            REFERENCES storage.objects(id) ON DELETE SET NULL,

    CONSTRAINT gymchains_master_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE UNIQUE INDEX idx__gymchains_master__pub_id ON gymchains_master (pub_id);
CREATE INDEX idx__gymchains_master__name ON gymchains_master (name);
CREATE INDEX idx__gymchains_master__icon ON gymchains_master (icon_rel_id);


CREATE TABLE gyms_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    name                            VARCHAR(200)    NOT NULL,
    gymchain_rel_id                 BIGINT          REFERENCES gymchains_master(rel_id) ON DELETE CASCADE,
    gymchain_internal_id            JSONB,
    location                        GEOGRAPHY(POINT, 4326),
    photo_rel_id                    UUID            REFERENCES storage.objects(id) ON DELETE SET NULL,

    CONSTRAINT gyms_master_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE UNIQUE INDEX idx__gyms_master__pub_id ON gyms_master (pub_id);
CREATE INDEX idx__gyms_master__name ON gyms_master (name);
CREATE INDEX idx__gyms_master__location ON gyms_master USING GIST (location);
CREATE INDEX idx__gyms_master__gymchain_rel_id ON gyms_master (gymchain_rel_id);
CREATE INDEX idx__gyms_master__gymchain_internal_id ON gyms_master USING GIN (gymchain_internal_id);
CREATE INDEX idx__gyms_master__photo_rel_id ON gyms_master (photo_rel_id);
