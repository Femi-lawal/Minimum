# Minimum Backend (Serverless)

Node.js TypeScript serverless backend for the Minimum application (Medium clone).

## Tech Stack

- **Runtime**: Node.js 22.x (AWS Lambda)
- **Language**: TypeScript 5.3+
- **Framework**: Serverless Framework v3
- **Database**: DynamoDB
- **Validation**: Zod
- **Middleware**: Middy v5
- **Observability**: AWS Lambda Powertools

## Architecture

This backend complements the Go microservices by providing **event-driven** Lambda functions for:

- **Comment Service**: Nested comment threads
- **Notification Service**: Push notifications via SNS/SES
- **Image Processing**: S3-triggered image resizing
- **Search Indexing**: Algolia integration (future)

## Local Development

### Prerequisites
- Node.js 22+
- AWS CLI configured (for deployment)
- Docker (for localstack testing)

### Install Dependencies
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

This starts `serverless offline` on port 3003.

### Test Comment API
```bash
# Create a comment (requires auth header)
curl -X POST http://localhost:3003/api/v1/posts/123e4567-e89b-12d3-a456-426614174000/comments \
  -H "Authorization: Bearer mock-token" \
  -H "Content-Type: application/json" \
  -d '{"content": "Great post!"}'

# List comments
curl http://localhost:3003/api/v1/posts/123e4567-e89b-12d3-a456-426614174000/comments
```

## Deployment

### Deploy to Dev
```bash
npm run deploy:dev
```

### Deploy to Production
```bash
npm run deploy:prod
```

## Project Structure

```
backend/
├── src/
│   ├── handlers/          # Lambda entry points
│   │   ├── comments/      # Comment CRUD
│   │   ├── notifications/ # Event processing
│   │   ├── images/        # Image processing
│   │   └── auth/          # Authorizer
│   ├── models/            # DynamoDB models
│   ├── lib/               # Utilities
│   │   ├── middleware.ts  # Middy wrapper
│   │   ├── validation.ts  # Zod schemas
│   │   ├── errors.ts      # Custom errors
│   │   └── powertools.ts  # Logger/Tracer/Metrics
│   └── types/             # TypeScript types
├── serverless.yml         # Infrastructure as code
├── tsconfig.json
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/posts/{id}/comments` | Create comment |
| `GET` | `/api/v1/posts/{id}/comments` | List comments (threaded) |
| `PUT` | `/api/v1/comments/{id}` | Update comment |
| `DELETE` | `/api/v1/comments/{id}` | Delete comment |
| `POST` | `/api/v1/comments/{id}/reply` | Reply to comment |
| `GET` | `/api/v1/notifications` | List notifications |
| `PUT` | `/api/v1/notifications/{id}/read` | Mark as read |
| `POST` | `/api/v1/images/upload-url` | Get S3 upload URL |

## Environment Variables

```bash
COMMENTS_TABLE=minimum-backend-comments-dev
NOTIFICATIONS_TABLE=minimum-backend-notifications-dev
IMAGES_BUCKET=minimum-backend-images-dev
EVENT_BUS_NAME=minimum-backend-events-dev
LOG_LEVEL=INFO
```

## Testing

```bash
npm test
```

## Integration with Go Services

The Go API Gateway proxies requests to these Lambda endpoints via API Gateway invoke.

EventBridge is used for async communication:
```
Go Post Service → EventBridge → Lambda Notification Service → SNS/SES
```
