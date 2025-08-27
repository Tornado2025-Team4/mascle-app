CREATE TABLE reports_master (
    rel_id                          BIGSERIAL       PRIMARY KEY,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    pub_id                          CHAR(21)        NOT NULL UNIQUE,
    reporter_user_rel_id            BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    target_user_rel_id              BIGINT          NOT NULL REFERENCES users_master(rel_id) ON DELETE CASCADE,
    reported_at                     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reason                          TEXT            NOT NULL,
    status                          report_status   DEFAULT 'onhold',
    context                         JSONB           DEFAULT '{}',

    CONSTRAINT reports_master_no_self_report CHECK (reporter_user_rel_id <> target_user_rel_id),
    CONSTRAINT reports_master_reason_not_empty CHECK (LENGTH(TRIM(reason)) > 0),
    CONSTRAINT reports_master_reported_at_reasonable CHECK (reported_at <= NOW())
);

CREATE UNIQUE INDEX idx__reports_master__pub_id ON reports_master (pub_id);
CREATE INDEX idx__reports_master__reporter_user_rel_id ON reports_master (reporter_user_rel_id);
CREATE INDEX idx__reports_master__target_user_rel_id ON reports_master (target_user_rel_id);
CREATE INDEX idx__reports_master__reported_at ON reports_master (reported_at);
CREATE INDEX idx__reports_master__status ON reports_master (status);
