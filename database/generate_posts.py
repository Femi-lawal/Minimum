#!/usr/bin/env python3
"""Generate 120 realistic blog posts for seed data"""
import uuid
from datetime import datetime, timedelta
import random

POST_TEMPLATES = [
    ("Building Scalable {tech} Applications", "A comprehensive guide to production-ready development", 8),
    ("{framework} Performance Optimization Tips", "Make your apps blazing fast with these techniques", 5),
    ("Getting Started with {tech}", "A beginner-friendly introduction to modern development", 3),
    ("Advanced {topic} Design Patterns", "Deep dive into enterprise-grade architectures", 12),
    ("My Journey Learning {skill}", "Lessons learned and best practices from real projects", 6),
    ("{tool} Best Practices for 2025", "Production-tested strategies from industry leaders", 7),
    ("Why I Switched to {tech}", "And why you should consider it too", 4),
    ("10 Common {topic} Mistakes to Avoid", "Learn from these critical errors", 5),
    ("The Ultimate {tech} Tutorial Series", "From zero to production in 30 days", 15),
    ("5 {tech} Tips That Changed My Career", "Game-changing insights for developers", 4),
]

TECHS = ["Go", "Rust", "TypeScript", "Python", "React", "Next.js", "Kubernetes", "Docker", 
         "AWS Lambda", "GraphQL", "PostgreSQL", "MongoDB", "Redis", "Terraform", "gRPC"]
TOPICS = ["API Design", "Testing", "Security", "DevOps", "Architecture", "Database"]
SKILLS = ["Kubernetes", "System Design", "Code Review",  "Technical Writing"]
      
now = datetime.now()
posts_sql = []

for i in range(1, 121):
    template = random.choice(POST_TEMPLATES)
    title = template[0].format(
        tech=random.choice(TECHS),
        framework=random.choice(["React", "Vue", "Next.js", "Svelte"]),
        topic=random.choice(TOPICS),
        skill=random.choice(SKILLS),
        tool=random.choice(["Docker", "Kubernetes", "Terraform", "Git"])
    )
    
    subtitle = template[1]
    reading_time = template[2]
    author_num = (i % 25) + 1
    days_ago = random.randint(1, 180)
    pub_date = (now - timedelta(days=days_ago)).isoformat()
    
    content = f"{subtitle}. This is a comprehensive article covering all aspects of the topic..."
    img_id = random.choice([
        "photo-1558494949-ef010cbdcc31", "photo-1633356122544-f134324a6cee",
        "photo-1499750310107-5fef28a66643", "photo-1667372393119-3d4c48d07fc9"
    ])
    
    post_sql = f"('00000000-0000-0000-0000-0000000000{author_num:02d}', '{title.replace("'", "''")}', '{subtitle.replace("'", "''")}', '{content}', 'https://images.unsplash.com/{img_id}?w=1200', 'published', {reading_time}, '{pub_date}', '{pub_date}', '{pub_date}')"
    posts_sql.append(post_sql)

print("-- Blog Posts (120 posts)")
print("INSERT INTO posts (author_id, title, subtitle, content, cover_image, status, reading_time, published_at, created_at, updated_at) VALUES")
print(",\n".join(posts_sql) + ";")

# Generate post-tag relationships
print("\n-- Post-tag relationships")
print("INSERT INTO post_tags (post_id, tag_id)")
print("SELECT p.id, t.id")
print("FROM posts p")
print("CROSS JOIN LATERAL (")
print("  SELECT id FROM tags ORDER BY RANDOM() LIMIT 2")
print(") t;")
