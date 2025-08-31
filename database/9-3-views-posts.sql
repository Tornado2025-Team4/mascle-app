CREATE VIEW view_posts_master AS
SELECT
    p.rel_id,

    check_relationship_access(u.rel_id, po.posts) as privacy_allowed,
    check_relationship_access(u.rel_id, po.posts_location) as privacy_allowed_location,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN p.pub_id
        ELSE NULL
    END as pub_id,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN p.posted_user_rel_id
        ELSE NULL
    END as posted_user_rel_id,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN p.posted_at
        ELSE NULL
    END as posted_at,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN p.body
        ELSE NULL
    END as body,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts)
            AND check_relationship_access(u.rel_id, po.posts_location) THEN p.trained_gym_rel_id
        ELSE NULL
    END as gym_rel_id,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN COALESCE(like_count.count, 0)
        ELSE NULL
    END as like_count,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN COALESCE(comment_count.count, 0)
        ELSE NULL
    END as comment_count,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN
            CASE WHEN user_like.rel_id IS NOT NULL THEN true ELSE false END
        ELSE NULL
    END as is_liked_by_current_user,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN
            CASE WHEN user_comment.rel_id IS NOT NULL THEN true ELSE false END
        ELSE NULL
    END as is_commented_by_current_user

FROM posts_master p
LEFT JOIN users_master u ON p.posted_user_rel_id = u.rel_id
LEFT JOIN gyms_master g ON p.trained_gym_rel_id = g.rel_id
LEFT JOIN users_line_privacy po ON u.rel_id = po.user_rel_id
LEFT JOIN (
    SELECT post_rel_id, COUNT(*) as count
    FROM posts_lines_likes
    GROUP BY post_rel_id
) like_count ON p.rel_id = like_count.post_rel_id
LEFT JOIN (
    SELECT post_rel_id, COUNT(*) as count
    FROM comments_master
    GROUP BY post_rel_id
) comment_count ON p.rel_id = comment_count.post_rel_id
LEFT JOIN posts_lines_likes user_like ON p.rel_id = user_like.post_rel_id
    AND user_like.user_rel_id = get_current_user_rel_id();


CREATE VIEW view_posts_lines_tags AS
SELECT
    pt.rel_id,

    check_relationship_access(u.rel_id, po.posts) as privacy_allowed,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN pt.post_rel_id
        ELSE NULL
    END as post_rel_id,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN pt.tag_rel_id
        ELSE NULL
    END as tag_rel_id
FROM posts_lines_tags pt
LEFT JOIN posts_master p ON pt.post_rel_id = p.rel_id
LEFT JOIN tags_master t ON pt.tag_rel_id = t.rel_id
LEFT JOIN users_master u ON p.posted_user_rel_id = u.rel_id
LEFT JOIN users_line_privacy po ON u.rel_id = po.user_rel_id;


CREATE VIEW view_posts_lines_body_mentions AS
SELECT
    pm.rel_id,

    check_relationship_access(u_poster.rel_id, po.posts) as privacy_allowed,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN pm.post_rel_id
        ELSE NULL
    END as post_rel_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN pm.target_user_rel_id
        ELSE NULL
    END as target_user_rel_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN pm.offset_num
        ELSE NULL
    END as offset_num
FROM posts_lines_body_mentions pm
LEFT JOIN posts_master p ON pm.post_rel_id = p.rel_id
LEFT JOIN users_master u_poster ON p.posted_user_rel_id = u_poster.rel_id
LEFT JOIN users_master u_mentioned ON pm.target_user_rel_id = u_mentioned.rel_id
LEFT JOIN users_line_privacy po ON u_poster.rel_id = po.user_rel_id;


CREATE VIEW view_posts_lines_photos AS
SELECT
    pp.rel_id,

    check_relationship_access(u.rel_id, po.posts) as privacy_allowed,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN pp.post_rel_id
        ELSE NULL
    END as post_rel_id,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN pp.photo_rel_id
        ELSE NULL
    END as photo_rel_id,

    CASE
        WHEN check_relationship_access(u.rel_id, po.posts) THEN pp.photo_thumb_rel_id
        ELSE NULL
    END as photo_thumb_rel_id
FROM posts_lines_photos pp
LEFT JOIN posts_master p ON pp.post_rel_id = p.rel_id
LEFT JOIN users_master u ON p.posted_user_rel_id = u.rel_id
LEFT JOIN users_line_privacy po ON u.rel_id = po.user_rel_id;


CREATE VIEW view_posts_lines_likes AS
SELECT
    pl.rel_id,

    check_relationship_access(u_poster.rel_id, po.posts) as privacy_allowed,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN pl.post_rel_id
        ELSE NULL
    END as post_rel_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN pl.user_rel_id
        ELSE NULL
    END as user_rel_id
FROM posts_lines_likes pl
LEFT JOIN posts_master p ON pl.post_rel_id = p.rel_id
LEFT JOIN users_master u_poster ON p.posted_user_rel_id = u_poster.rel_id
LEFT JOIN users_master u_liker ON pl.user_rel_id = u_liker.rel_id
LEFT JOIN users_line_privacy po ON u_poster.rel_id = po.user_rel_id;


CREATE VIEW view_comments_master AS
SELECT
    c.rel_id,

    check_relationship_access(u_poster.rel_id, po.posts) as privacy_allowed,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN c.pub_id
        ELSE NULL
    END as pub_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN c.post_rel_id
        ELSE NULL
    END as post_rel_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN c.user_rel_id
        ELSE NULL
    END as commenter_user_rel_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN c.commented_at
        ELSE NULL
    END as commented_at,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN c.body
        ELSE NULL
    END as body
FROM comments_master c
LEFT JOIN posts_master p ON c.post_rel_id = p.rel_id
LEFT JOIN users_master u_poster ON p.posted_user_rel_id = u_poster.rel_id
LEFT JOIN users_master u_commenter ON c.user_rel_id = u_commenter.rel_id
LEFT JOIN users_line_privacy po ON u_poster.rel_id = po.user_rel_id;



CREATE VIEW view_comments_lines_mentions AS
SELECT
    cm.rel_id,

    check_relationship_access(u_poster.rel_id, po.posts) as privacy_allowed,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN cm.comment_rel_id
        ELSE NULL
    END as comment_rel_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN cm.user_rel_id
        ELSE NULL
    END as mentioned_user_rel_id,

    CASE
        WHEN check_relationship_access(u_poster.rel_id, po.posts) THEN cm.offset_num
        ELSE NULL
    END as offset_num
FROM comments_lines_mentions cm
LEFT JOIN comments_master c ON cm.comment_rel_id = c.rel_id
LEFT JOIN posts_master p ON c.post_rel_id = p.rel_id
LEFT JOIN users_master u_poster ON p.posted_user_rel_id = u_poster.rel_id
LEFT JOIN users_master u_commenter ON c.user_rel_id = u_commenter.rel_id
LEFT JOIN users_master u_mentioned ON cm.user_rel_id = u_mentioned.rel_id
LEFT JOIN users_line_privacy po ON u_poster.rel_id = po.user_rel_id;
