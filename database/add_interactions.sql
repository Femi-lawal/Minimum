-- Add more realistic interaction data for production feel
-- Run this to populate claps, views, and reading stats

-- Add claps (likes) to posts - realistic distribution
INSERT INTO interactions (post_id, user_id, type, count, created_at)
SELECT 
    p.id as post_id,
    u.id as user_id,
    'clap',
    floor(random() * 50 + 1)::int as count,
    NOW() - (floor(random() * 90) || ' days')::interval
FROM posts p
CROSS JOIN LATERAL (
    SELECT id FROM users ORDER BY RANDOM() LIMIT floor(random() * 15 + 5)::int
) u
ON CONFLICT (post_id, user_id, type) DO NOTHING;

-- Add view counts - more views than claps
INSERT INTO interactions (post_id, user_id, type, count, created_at)
SELECT 
    p.id as post_id,
    u.id as user_id,
    'view',
    1,
    NOW() - (floor(random() * 90) || ' days')::interval
FROM posts p
CROSS JOIN LATERAL (
    SELECT id FROM users ORDER BY RANDOM() LIMIT floor(random() * 20 + 10)::int
) u
ON CONFLICT (post_id, user_id, type) DO NOTHING;

-- Add some follow relationships
INSERT INTO follows (follower_id, followee_id, created_at)
SELECT DISTINCT
    u1.id as follower_id,
    u2.id as followee_id,
    NOW() - (floor(random() * 180) || ' days')::interval
FROM users u1
CROSS JOIN LATERAL (
    SELECT id FROM users WHERE id != u1.id ORDER BY RANDOM() LIMIT floor(random() * 8 + 2)::int
) u2
ON CONFLICT (follower_id, followee_id) DO NOTHING;

-- Add bookmarks
INSERT INTO bookmarks (user_id, post_id, created_at)
SELECT 
    u.id as user_id,
    p.id as post_id,
    NOW() - (floor(random() * 60) || ' days')::interval
FROM users u
CROSS JOIN LATERAL (
    SELECT id FROM posts ORDER BY RANDOM() LIMIT floor(random() * 10 + 3)::int
) p
ON CONFLICT (user_id, post_id) DO NOTHING;

-- Verify interaction counts
SELECT 
    'Claps' as type, 
    COUNT(DISTINCT post_id) as posts_with_interaction,
    SUM(count) as total_count 
FROM interactions WHERE type = 'clap'
UNION ALL
SELECT 
    'Views' as type, 
    COUNT(DISTINCT post_id) as posts_with_interaction,
    COUNT(*) as total_count 
FROM interactions WHERE type = 'view'
UNION ALL
SELECT 
    'Follows' as type, 
    COUNT(*) as relationships,
    NULL
FROM follows
UNION ALL
SELECT 
    'Bookmarks' as type, 
    COUNT(*) as bookmarks,
    NULL
FROM bookmarks;
