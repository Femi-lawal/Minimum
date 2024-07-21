-- Update users with real names, avatars, and bios

-- Real diverse names and bios
UPDATE users SET 
  name = CASE id::text
    WHEN '00000000-0000-0000-0000-000000000001' THEN 'Alice Chen'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'Bob Martinez'
    WHEN '00000000-0000-0000-0000-000000000003' THEN 'Charlie Kim'
    WHEN '00000000-0000-0000-0000-000000000004' THEN 'Diana Patel'
    WHEN '00000000-0000-0000-0000-000000000005' THEN 'Sarah Johnson'
    WHEN '00000000-0000-0000-0000-000000000006' THEN 'Michael Thompson'
    WHEN '00000000-0000-0000-0000-000000000007' THEN 'Emma Williams'
    WHEN '00000000-0000-0000-0000-000000000008' THEN 'James Brown'
    WHEN '00000000-0000-0000-0000-000000000009' THEN 'Olivia Davis'
    WHEN '00000000-0000-0000-0000-000000000010' THEN 'William Miller'
    WHEN '00000000-0000-0000-0000-000000000011' THEN 'Sophia Wilson'
    WHEN '00000000-0000-0000-0000-000000000012' THEN 'Benjamin Moore'
    WHEN '00000000-0000-0000-0000-000000000013' THEN 'Isabella Taylor'
    WHEN '00000000-0000-0000-0000-000000000014' THEN 'Daniel Anderson'
    WHEN '00000000-0000-0000-0000-000000000015' THEN 'Mia Thomas'
    WHEN '00000000-0000-0000-0000-000000000016' THEN 'Alexander Jackson'
    WHEN '00000000-0000-0000-0000-000000000017' THEN 'Charlotte White'
    WHEN '00000000-0000-0000-0000-000000000018' THEN 'David Harris'
    WHEN '00000000-0000-0000-0000-000000000019' THEN 'Amelia Martin'
    WHEN '00000000-0000-0000-0000-000000000020' THEN 'Joseph Garcia'
    WHEN '00000000-0000-0000-0000-000000000021' THEN 'Harper Robinson'
    WHEN '00000000-0000-0000-0000-000000000022' THEN 'Andrew Clark'
    WHEN '00000000-0000-0000-0000-000000000023' THEN 'Evelyn Lewis'
    WHEN '00000000-0000-0000-0000-000000000024' THEN 'Christopher Lee'
    WHEN '00000000-0000-0000-0000-000000000025' THEN 'Abigail Walker'
    ELSE name
  END,
  bio = CASE (SUBSTRING(id::text FROM 35)::int % 5)
    WHEN 0 THEN 'Senior Software Engineer at Google. Passionate about distributed systems and cloud architecture.'
    WHEN 1 THEN 'Product Designer & UX Researcher. Building delightful experiences for millions of users.'
    WHEN 2 THEN 'Tech Lead at Netflix. Writing about microservices, Kubernetes, and scaling systems.'
    WHEN 3 THEN 'Full-stack developer & open source contributor. JavaScript/TypeScript enthusiast.'
    WHEN 4 THEN 'Staff Engineer at Stripe. Focused on payment infrastructure and API design.'
    ELSE 'Software developer sharing insights about modern engineering practices.'
  END,
  avatar_url = CONCAT('https://i.pravatar.cc/150?u=', id::text);

-- Also add avatar URLs using ui-avatars as fallback
UPDATE users SET avatar_url = CONCAT('https://ui-avatars.com/api/?name=', REPLACE(name, ' ', '+'), '&background=random&size=150') 
WHERE avatar_url IS NULL OR avatar_url = '';

-- Verify the update
SELECT id, name, bio, avatar_url FROM users LIMIT 5;
