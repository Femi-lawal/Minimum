-- Generate 50 sample blog posts with variety
-- Using PostgreSQL's generate_series

INSERT INTO posts (author_id, title, subtitle, content, cover_image, status, reading_time, published_at, created_at, updated_at)
SELECT 
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1) as author_id,
    titles.title,
    'Comprehensive guide covering all the essential concepts and best practices',
    'This is a detailed article exploring the topic in depth with real-world examples and practical insights...',
    'https://images.unsplash.com/photo-' || (ARRAY['1558494949-ef010cbdcc31','1633356122544-f134324a6cee','1499750310107-5fef28a66643','1667372393119-3d4c48d07fc9','1551650975-87deedd944c3'])[floor(random() * 5 + 1)::int] || '?w=1200',
    'published',
    floor(random() * 10 + 3)::int as reading_time,
    NOW() - (floor(random() * 180)::int || ' days')::interval as published_at,
    NOW() - (floor(random() * 180)::int || ' days')::interval as created_at,
    NOW() - (floor(random() * 180)::int || ' days')::interval as updated_at
FROM (VALUES
    ('Building Scalable Microservices with Go'),
    ('React Performance Optimization Techniques'),
    ('Getting Started with Kubernetes'),
    ('Advanced TypeScript Design Patterns'),
    ('My Journey Learning System Design'),
    ('Docker Best Practices for 2025'),
    ('Why I Switched to Next.js'),
    ('10 Common PostgreSQL Mistakes to Avoid'),
    ('The Ultimate gRPC Tutorial'),
    ('5 Go Concurrency Tips That Changed My Career'),
    ('Mastering AWS Lambda with Node.js'),
    ('GraphQL vs REST: Which Should You Choose?'),
    ('Building Real-Time Apps with WebSockets'),
    ('Understanding Database Indexing'),
    ('Microservices Communication Patterns'),
    ('Zero-Downtime Deployment Strategies'),
    ('Implementing OAuth 2.0 from Scratch'),
    ('Redis Caching Strategies for Scale'),
    ('Event-Driven Architecture Explained'),
    ('Securing Your APIs: A Practical Guide'),
    ('Monitoring Distributed Systems'),
    ('CI/CD Pipeline Best Practices'),
    ('Terraform Infrastructure as Code'),
    ('Python for Data Engineering'),
    ('Building Resilient Services'),
    ('API Rate Limiting Strategies'),
    ('Observability in Production'),
    ('Debugging Kubernetes Pods'),
    ('Writing Effective Technical Documentation'),
    ('Code Review Best Practices'),
    ('Database Migration Strategies'),
    ('Testing Microservices'),
    ('Scaling Node.js Applications'),
    ('Understanding CAP Theorem'),
    ('Building a Design System'),
    ('Serverless Architecture Patterns'),
    ('Authentication vs Authorization'),
    ('Load Balancing Strategies'),
    ('Message Queue Patterns'),
    ('Container Orchestration Deep Dive'),
    ('API Versioning Strategies'),
    ('Database Sharding Explained'),
    ('Implementing Feature Flags'),
    ('Building a CDN from Scratch'),
    ('Understanding DNS Resolution'),
    ('HTTP/2 vs HTTP/3'),
    ('WebAssembly for Web Developers'),
    ('Progressive Web Apps in 2025'),
    ('Mobile-First Design Principles'),
    ('Accessibility in Modern Web Apps')
) AS titles(title);

-- Link posts to random tags (2-3 tags per post)
INSERT INTO post_tags (post_id, tag_id)
SELECT DISTINCT ON (p.id, t.id)
    p.id as post_id,
    t.id as tag_id
FROM posts p
CROSS JOIN LATERAL (
    SELECT id FROM tags ORDER BY RANDOM() LIMIT 2 + floor(random() * 2)::int
) t;

-- Summary
SELECT COUNT(*) || ' posts created' as status FROM posts;
SELECT COUNT(*) || ' post-tag relationships created' as status FROM post_tags;
