# Minimum Blog Platform

A modern, Medium-inspired blogging platform built with **Go**, **React (Next.js)**, and **PostgreSQL**. Features a flexible architecture that supports both **microservices** (Docker Compose) and **serverless** (AWS Lambda) deployment patterns.

https://github.com/user-attachments/assets/application-demo.webm

![Demo](./frontend/screenshots/application-demo.gif)

## ✨ Features

- **Authentication** - Secure JWT-based auth with demo account for quick testing
- **Rich Blogging** - Create, edit, and publish posts with tags
- **Social Interactions** - Follow users, clap for posts, bookmark stories
- **Real-time Feed** - Dynamic feed with category filtering and search
- **User Profiles** - Customizable profiles with avatars and bios
- **Responsive Design** - Works seamlessly on desktop and mobile

## 📸 Screenshots

<table>
<tr>
<td><img src="./frontend/screenshots/01-landing-hero.png" alt="Landing Page" width="400"/><br/><em>Landing Page</em></td>
<td><img src="./frontend/screenshots/08-dashboard-feed.png" alt="Dashboard" width="400"/><br/><em>Dashboard Feed</em></td>
</tr>
<tr>
<td><img src="./frontend/screenshots/18-post-detail.png" alt="Post Detail" width="400"/><br/><em>Post Detail</em></td>
<td><img src="./frontend/screenshots/21-new-post-filled.png" alt="Post Editor" width="400"/><br/><em>Post Editor</em></td>
</tr>
<tr>
<td><img src="./frontend/screenshots/22-user-profile.png" alt="User Profile" width="400"/><br/><em>User Profile</em></td>
<td><img src="./frontend/screenshots/26-settings-full.png" alt="Settings" width="400"/><br/><em>Settings Page</em></td>
</tr>
</table>

### Mobile Responsive

<table>
<tr>
<td><img src="./frontend/screenshots/32-mobile-dashboard.png" alt="Mobile Dashboard" width="200"/></td>
<td><img src="./frontend/screenshots/33-mobile-login.png" alt="Mobile Login" width="200"/></td>
<td><img src="./frontend/screenshots/35-mobile-post-detail.png" alt="Mobile Post" width="200"/></td>
</tr>
</table>

## 🏗️ Architecture

This project supports **two deployment patterns**:

### Microservices Architecture (Development/Production)

```mermaid
graph TB
    subgraph Client
        FE[Next.js Frontend<br/>Port 3000]
    end
    
    subgraph API["API Gateway"]
        GW[Go/Gin Gateway<br/>Port 8080]
    end
    
    subgraph Services["gRPC Services"]
        AUTH[Auth Service<br/>Port 8081]
        BLOG[Blog Service<br/>Port 8082]
    end
    
    subgraph Data["Data Layer"]
        PG[(PostgreSQL<br/>Port 5432)]
        REDIS[(Redis<br/>Port 6379)]
    end
    
    subgraph Observability
        PROM[Prometheus<br/>Port 9090]
        GRAF[Grafana<br/>Port 3001]
    end
    
    FE --> GW
    GW --> AUTH
    GW --> BLOG
    AUTH --> PG
    BLOG --> PG
    GW --> REDIS
    PROM --> GW
    GRAF --> PROM
```

### Serverless Architecture (AWS Lambda)

```mermaid
graph TB
    subgraph Client
        FE[Next.js Frontend<br/>Vercel/Amplify]
    end
    
    subgraph AWS["AWS Cloud"]
        APIGW[API Gateway]
        LAMBDA[Lambda Function<br/>provided.al2]
        
        subgraph Monolith["Services-in-a-Box"]
            GW[HTTP Router]
            AUTH[Auth Handler]
            BLOG[Blog Handler]
        end
        
        RDS[(RDS PostgreSQL)]
    end
    
    FE --> APIGW
    APIGW --> LAMBDA
    LAMBDA --> Monolith
    GW --> AUTH
    GW --> BLOG
    AUTH --> RDS
    BLOG --> RDS
```

## 🚀 Quick Start

### Prerequisites

- Go 1.24+
- Node.js 18+
- Docker & Docker Compose
- (Optional) AWS CLI + Serverless Framework v3

### Option 1: Microservices with Docker Compose

```bash
# Clone the repository
git clone https://github.com/your-username/minimum.git
cd minimum

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# API:      http://localhost:8080
# Grafana:  http://localhost:3001 (admin/admin)
```

### Option 2: Local Development

```bash
# Terminal 1: Start infrastructure
docker-compose up postgres redis

# Terminal 2: Start backend services
go run ./services/gateway &
go run ./services/auth &
go run ./services/blog &

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

### Option 3: Serverless Deployment (AWS Lambda)

```bash
# Build the Lambda binary
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap ./cmd/lambda

# Deploy to AWS
serverless deploy

# Update frontend API URL
cd frontend
# Update NEXT_PUBLIC_API_URL in .env to your API Gateway URL
npm run build
```

## 🔄 Switching Between Architectures

| Aspect | Microservices | Serverless |
|--------|---------------|------------|
| **Start Command** | `docker-compose up` | `serverless deploy` |
| **Config File** | `docker-compose.yml` | `serverless.yml` |
| **Database** | Local PostgreSQL | RDS/Aurora |
| **Scaling** | Manual/Kubernetes | Automatic |
| **Cost Model** | Always-on | Pay-per-request |
| **Best For** | Development, High Traffic | Variable traffic, Cost optimization |

### Environment Variables

| Variable | Microservices | Serverless |
|----------|---------------|------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@postgres:5432/...` | SSM Parameter |
| `JWT_SECRET` | `.env` or Docker env | SSM Parameter |
| `AUTH_SERVICE_URL` | `auth:8081` | Internal goroutine |
| `BLOG_SERVICE_URL` | `blog:8082` | Internal goroutine |

## 📁 Project Structure

```
minimum/
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # Auth context
│   │   └── services/      # API client
│   └── e2e/               # Playwright E2E tests
├── services/              # Backend microservices
│   ├── gateway/           # HTTP API Gateway (Gin)
│   ├── auth/              # Authentication service (gRPC)
│   └── blog/              # Blog service (gRPC)
├── pkg/                   # Shared Go packages
│   ├── proto/             # Protocol buffer definitions
│   ├── middleware/        # Auth, CORS, Rate limiting
│   └── common/            # Shared utilities
├── cmd/
│   └── lambda/            # Lambda entrypoint (serverless)
├── infrastructure/        # Monitoring configs
├── k8s/                   # Kubernetes manifests
├── docker-compose.yml     # Microservices orchestration
└── serverless.yml         # AWS Lambda deployment
```

## 🧪 Testing

```bash
# Run E2E tests
cd frontend
npx playwright test

# Run specific test suite
npx playwright test e2e/demo.spec.ts

# View test report
npx playwright show-report
```

## 🔐 Demo Account

For quick testing, use the demo account:
- **Email**: `alice@example.com`
- **Password**: `demo123`

Or click "try the demo account" on the login page.

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/register` | User registration |
| GET | `/api/v1/posts` | List all posts |
| POST | `/api/v1/posts` | Create post (auth required) |
| GET | `/api/v1/posts/:id` | Get single post |
| GET | `/api/v1/users/:id` | Get user profile |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TailwindCSS |
| Gateway | Go 1.24, Gin, gRPC |
| Services | Go 1.24, gRPC, PostgreSQL |
| Testing | Playwright |
| Infrastructure | Docker, Prometheus, Grafana |
| Serverless | AWS Lambda, API Gateway |

## 📝 License

MIT License - feel free to use this project for learning or as a starting point for your own blog platform.
