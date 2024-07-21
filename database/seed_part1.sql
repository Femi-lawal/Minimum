-- Comprehensive Seed Script for Minimum (Medium Clone)
-- Creates realistic dummy data: 25 users, 100+ posts, 1000+ interactions
-- Execute: cat database/seed.sql | docker exec -i minimum-postgres-1 psql -U postgres -d blog_app

-- Clear existing data
TRUNCATE TABLE users, posts, interactions, follows, bookmarks, tags, post_tags CASCADE;

-- ============================================================================
-- USERS (25 diverse users)
-- ============================================================================
INSERT INTO users (id, email, name, password_hash, bio, avatar_url, created_at, updated_at) VALUES
-- Tech Writers & Engineers
('00000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice Chen', '$2a$10$hash', 'Senior Staff Engineer @Google | Distributed Systems | Go & Kubernetes enthusiast', 'https://i.pravatar.cc/150?img=1', NOW() - INTERVAL '6 months', NOW()),
('00000000-0000-0000-0000-000000000002', 'bob@example.com', 'Bob Martinez', '$2a$10$hash', 'Full-stack developer | React, Node.js, TypeScript | Building scalable apps', 'https://i.pravatar.cc/150?img=12', NOW() - INTERVAL '4 months', NOW()),
('00000000-0000-0000-0000-000000000003', 'charlie@example.com', 'Charlie Kim', '$2a$10$hash', 'DevOps Engineer | Terraform | Docker | CI/CD pipelines | Cloud architecture', 'https://i.pravatar.cc/150?img=33', NOW() - INTERVAL '5 months', NOW()),
('00000000-0000-0000-0000-000000000004', 'diana@example.com', 'Diana Prince', '$2a$10$hash', 'Product Manager @Meta | UX Research | Data-driven decisions', 'https://i.pravatar.cc/150?img=47', NOW() - INTERVAL '3 months', NOW()),
('00000000-0000-0000-0000-000000000005', 'test@example.com', 'Sarah Johnson', '$2a$10$hash', 'Tech Lead @Netflix | Microservices | Author of "Scale at Speed"', 'https://i.pravatar.cc/150?img=50', NOW() - INTERVAL '7 months', NOW()),

-- Content Creators
('00000000-0000-0000-0000-000000000006', 'emily@example.com', 'Emily Rodriguez', '$2a$10$hash', 'Technical Writer | Making complex topics simple | Ex-Amazon', 'https://i.pravatar.cc/150?img=5', NOW() - INTERVAL '2 months', NOW()),
('00000000-0000-0000-0000-000000000007', 'frank@example.com', 'Frank Zhang', '$2a$10$hash', 'Frontend Architect | CSS Grid & Animations | Speaker', 'https://i.pravatar.cc/150?img=15', NOW() - INTERVAL '8 months', NOW()),
('00000000-0000-0000-0000-000000000008', 'grace@example.com', 'Grace Thompson', '$2a$10$hash', 'ML Engineer | PyTorch | Computer Vision | Ph.D. Stanford', 'https://i.pravatar.cc/150?img=28', NOW() - INTERVAL '1 year', NOW()),
('00000000-0000-0000-0000-000000000009', 'henry@example.com', 'Henry Okonkwo', '$2a$10$hash', 'Blockchain Developer | Solidity | Web3 | DeFi protocols', 'https://i.pravatar.cc/150?img=52', NOW() - INTERVAL '3 months', NOW()),
('00000000-0000-0000-0000-000000000010', 'isabel@example.com', 'Isabel Santos', '$2a$10$hash', 'Security Researcher | Penetration Testing | Bug Bounty Hunter', 'https://i.pravatar.cc/150?img=45', NOW() - INTERVAL '5 months', NOW()),

-- Designers & Creative
('00000000-0000-0000-0000-000000000011', 'jack@example.com', 'Jack Morrison', '$2a$10$hash', 'Senior UX Designer @Airbnb | Design Systems | Figma expert', 'https://i.pravatar.cc/150?img=60', NOW() - INTERVAL '4 months', NOW()),
('00000000-0000-0000-0000-000000000012', 'kate@example.com', 'Kate Williams', '$2a$10$hash', 'Illustrator & Animator | Creative coding | p5.js', 'https://i.pravatar.cc/150?img=20', NOW() - INTERVAL '6 months', NOW()),
('00000000-0000-0000-0000-000000000013', 'liam@example.com', 'Liam Patel', '$2a$10$hash', 'Mobile Developer | Flutter & React Native | 50+ apps shipped', 'https://i.pravatar.cc/150?img=31', NOW() - INTERVAL '9 months', NOW()),
('00000000-0000-0000-0000-000000000014', 'maya@example.com', 'Maya Cohen', '$2a$10$hash', 'Data Scientist | NLP | Transformers | Ex-OpenAI researcher', 'https://i.pravatar.cc/150?img=24', NOW() - INTERVAL '2 months', NOW()),
('00000000-0000-0000-0000-000000000015', 'noah@example.com', 'Noah Schmidt', '$2a$10$hash', 'Game Developer | Unity & Unreal Engine | VR/AR enthusiast', 'https://i.pravatar.cc/150?img=56', NOW() - INTERVAL '7 months', NOW()),

-- Industry Experts
('00000000-0000-0000-0000-000000000016', 'olivia@example.com', 'Olivia Brown', '$2a$10$hash', 'Engineering Manager @Stripe | Team building | Career advice', 'https://i.pravatar.cc/150?img=10', NOW() - INTERVAL '1 year 2 months', NOW()),
('00000000-0000-0000-0000-000000000017', 'peter@example.com', 'Peter Ivanov', '$2a$10$hash', 'Database Architect | PostgreSQL expert | Performance tuning wizard', 'https://i.pravatar.cc/150?img=67', NOW() - INTERVAL '3 months', NOW()),
('00000000-0000-0000-0000-000000000018', 'quinn@example.com', 'Quinn Taylor', '$2a$10$hash', 'Startup Founder | SaaS growth hacker | 2x YC alumni', 'https://i.pravatar.cc/150?img=42', NOW() - INTERVAL '5 months', NOW()),
('00000000-0000-0000-0000-000000000019', 'rachel@example.com', 'Rachel Green', '$2a$10$hash', 'Tech Recruiter | Career coach | Helping devs land dream jobs', 'https://i.pravatar.cc/150?img=9', NOW() - INTERVAL '8 months', NOW()),
('00000000-0000-0000-0000-000000000020', 'sam@example.com', 'Sam Lee', '$2a$10$hash', 'Site Reliability Engineer | Incident management | Observability', 'https://i.pravatar.cc/150?img=70', NOW() - INTERVAL '6 months', NOW()),

-- Emerging Voices
('00000000-0000-0000-0000-000000000021', 'tina@example.com', 'Tina Nguyen', '$2a$10$hash', 'Junior Developer documenting my learning journey | #100DaysOfCode', 'https://i.pravatar.cc/150?img=32', NOW() - INTERVAL '2 weeks', NOW()),
('00000000-0000-0000-0000-000000000022', 'uma@example.com', 'Uma Patel', '$2a$10$hash', 'API Design enthusiast | REST vs GraphQL | Documentation nerd', 'https://i.pravatar.cc/150?img=44', NOW() - INTERVAL '1 month', NOW()),
('00000000-0000-0000-0000-000000000023', 'victor@example.com', 'Victor Osei', '$2a$10$hash', 'Cloud Solutions Architect | AWS Certified | Serverless fanatic', 'https://i.pravatar.cc/150?img=68', NOW() - INTERVAL '10 months', NOW()),
('00000000-0000-0000-0000-000000000024', 'wendy@example.com', 'Wendy Liu', '$2a$10$hash', 'QA Engineer | Test automation | Cypress & Playwright', 'https://i.pravatar.cc/150?img=16', NOW() - INTERVAL '4 months', NOW()),
('00000000-0000-0000-0000-000000000025', 'xavier@example.com', 'Xavier Torres', '$2a$10$hash', 'Indie hacker | Building products solo | $10k MRR journey', 'https://i.pravatar.cc/150?img=51', NOW() - INTERVAL '3 months', NOW());

-- ============================================================================
-- TAGS (30 categories)
-- ============================================================================
INSERT INTO tags (id, name, slug, description, created_at) VALUES
('20000000-0000-0000-0000-000000000001', 'JavaScript', 'javascript', 'JavaScript programming language', NOW()),
('20000000-0000-0000-0000-000000000002', 'React', 'react', 'React framework and ecosystem', NOW()),
('20000000-0000-0000-0000-000000000003', 'Go', 'go', 'Go programming language', NOW()),
('20000000-0000-0000-0000-000000000004', 'Python', 'python', 'Python programming language', NOW()),
('20000000-0000-0000-0000-000000000005', 'Kubernetes', 'kubernetes', 'Container orchestration platform', NOW()),
('20000000-0000-0000-0000-000000000006', 'AWS', 'aws', 'Amazon Web Services cloud', NOW()),
('20000000-0000-0000-0000-000000000007', 'Docker', 'docker', 'Containerization technology', NOW()),
('20000000-0000-0000-0000-000000000008', 'DevOps', 'devops', 'Development and operations practices', NOW()),
('20000000-0000-0000-0000-000000000009', 'Machine Learning', 'machine-learning', 'ML and AI topics', NOW()),
('20000000-0000-0000-0000-000000000010', 'TypeScript', 'typescript', 'TypeScript language', NOW()),
('20000000-0000-0000-0000-000000000011', 'Node.js', 'nodejs', 'Node.js runtime', NOW()),
('20000000-0000-0000-0000-000000000012', 'PostgreSQL', 'postgresql', 'PostgreSQL database', NOW()),
('20000000-0000-0000-0000-000000000013', 'MongoDB', 'mongodb', 'MongoDB NoSQL database', NOW()),
('20000000-0000-0000-0000-000000000014', 'Next.js', 'nextjs', 'Next.js React framework', NOW()),
('20000000-0000-0000-0000-000000000015', 'Microservices', 'microservices', 'Microservices architecture', NOW()),
('20000000-0000-0000-0000-000000000016', 'Security', 'security', 'Cybersecurity topics', NOW()),
('20000000-0000-0000-0000-000000000017', 'Design', 'design', 'UI/UX design', NOW()),
('20000000-0000-0000-0000-000000000018', 'Career', 'career', 'Career development', NOW()),
('20000000-0000-0000-0000-000000000019', 'Testing', 'testing', 'Software testing', NOW()),
('20000000-0000-0000-0000-000000000020', 'Blockchain', 'blockchain', 'Blockchain technology', NOW()),
('20000000-0000-0000-0000-000000000021', 'Mobile', 'mobile', 'Mobile development', NOW()),
('20000000-0000-0000-0000-000000000022', 'Web3', 'web3', 'Web3 and decentralized apps', NOW()),
('20000000-0000-0000-0000-000000000023', 'GraphQL', 'graphql', 'GraphQL API', NOW()),
('20000000-0000-0000-0000-000000000024', 'Serverless', 'serverless', 'Serverless architectures', NOW()),
('20000000-0000-0000-0000-000000000025', 'Performance', 'performance', 'Performance optimization', NOW()),
('20000000-0000-0000-0000-000000000026', 'Productivity', 'productivity', 'Developer productivity', NOW()),
('20000000-0000-0000-0000-000000000027', 'CSS', 'css', 'CSS and styling', NOW()),
('20000000-0000-0000-0000-000000000028', 'AI', 'ai', 'Artificial Intelligence', NOW()),
('20000000-0000-0000-0000-000000000029', 'Rust', 'rust', 'Rust programming language', NOW()),
('20000000-0000-0000-0000-000000000030', 'Cloud', 'cloud', 'Cloud computing', NOW());

-- Note: Full 100+ posts data continues in next message due to length...
-- This is part 1/2 of the seed data
