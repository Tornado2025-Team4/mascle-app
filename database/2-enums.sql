CREATE TYPE gender AS ENUM (
    'male',
    'female',
    'other',
    'prefer_not_to_say'
);

CREATE TYPE notice_kind AS ENUM (
    'matching/offline/same-gym',
    'matching/online/recommend',
    'social/follower-added',
    'social/following-posted',
    'social/following-started-training',
    'post/liked',
    'post/commented',
    'post/mentioned',
    'dm/pair/invite-received',
    'dm/pair/request-accepted',
    'dm/pair/received',
    'dm/group/invite-received',
    'dm/group/request-accepted',
    'dm/group/request-received',
    'dm/group/member-added',
    'dm/group/received',
    'report/resolved',
    'report/rejected',
    'system/warning',
    'system/announcement',
    'other'
);

CREATE TYPE relship AS ENUM (
    'anyone',
    'followers',
    'following',
    'follow-followers',
    'no-one'
);

CREATE TYPE report_status AS ENUM ('onhold', 'in_progress', 'resolved', 'rejected');