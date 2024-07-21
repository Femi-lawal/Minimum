-- ============================================================================
-- INTERACTIONS (1000+ claps, views, bookmarks)
-- ============================================================================

-- Generate claps (posts 1-100, random users, 1-50 claps each)
INSERT INTO interactions (id, post_id, user_id, type, count, created_at)
SELECT 
    gen_random_uuid(),
    '10000000-0000-0000-0000-0000000000' || lpad((floor(random() * 100) + 1)::text, 2, '0'),
    '00000000-0000-0000-0000-0000000000' || lpad((floor(random() * 25) + 1)::text, 2, '0'),
    'clap',
    floor(random() * 50) + 1,
    NOW() - (floor(random() * 180) || ' days')::interval
FROM generate_series(1, 500);

-- Generate views (more views than claps)
INSERT INTO interactions (id, post_id, user_id, type, count, created_at)
SELECT 
    gen_random_uuid(),
    '10000000-0000-0000-0000-0000000000' || lpad((floor(random() * 100) + 1)::text, 2, '0'),
    '00000000-0000-0000-0000-0000000000' || lpad((floor(random() * 25) + 1)::text, 2, '0'),
    'view',
    1,
    NOW() - (floor(random() * 180) || ' days')::interval
FROM generate_series(1, 2000);

-- ============================================================================
-- FOLLOWS (social graph - 300+ relationships)
-- ============================================================================
INSERT INTO follows (id, follower_id, followee_id, created_at)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-0000000000' || lpad(follower::text, 2, '0'),
    '00000000-0000-0000-0000-0000000000' || lpad(followee::text, 2, '0'),
    NOW() - (floor(random() * 180) || ' days')::interval
FROM (
    SELECT DISTINCT 
        floor(random() * 25) + 1 as follower,
        floor(random() * 25) + 1 as followee
    FROM generate_series(1, 400)
) subq
WHERE follower != followee;

-- ============================================================================
-- BOOKMARKS (200+ saved posts)
-- ============================================================================
INSERT INTO bookmarks (id, user_id, post_id, created_at)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-0000000000' || lpad((floor(random() * 25) + 1)::text, 2, '0'),
    '10000000-0000-0000-0000-0000000000' || lpad((floor(random() * 100) + 1)::text, 2, '0'),
    NOW() - (floor(random() * 180) || ' days')::interval
FROM generate_series(1, 250);

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================
SELECT '=== DATA SEEDING COMPLETE ===' as status;
SELECT 'Users:', COUNT(*) FROM users;
SELECT 'Posts:', COUNT(*) FROM posts;
SELECT 'Tags:', COUNT(*) FROM tags;
SELECT 'Post-Tag relationships:', COUNT(*) FROM post_tags;
SELECT 'Claps:', COUNT(*) FROM interactions WHERE type = 'clap';
SELECT 'Views:', COUNT(*) FROM interactions WHERE type = 'view';
SELECT 'Follows:', COUNT(*) FROM follows;
SELECT 'Bookmarks:', COUNT(*) FROM bookmarks;
SELECT 'Total interactions:', COUNT(*) FROM interactions;
