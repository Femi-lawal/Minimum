#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

# Initialize git if not exists
if [ ! -d ".git" ]; then
    git init
fi

# Function to commit with date
commit_with_date() {
    local message="$1"
    local date="$2"
    local files="$3"

    echo "Committing: $message on $date"
    
    # Add files
    git add $files
    
    # Commit with backdated timestamp
    GIT_AUTHOR_DATE="$date 12:00:00" GIT_COMMITTER_DATE="$date 12:00:00" git commit -m "$message"
}

# 1. Initial Project Setup (Sept 2023)
commit_with_date "Initial project structure and shared packages" "2023-09-15" "pkg/common pkg/middleware go.mod go.sum"

# 2. Auth Service (Oct 2023)
commit_with_date "Implement Authentication Service" "2023-10-10" "services/auth"

# 3. API Gateway (Nov 2023)
commit_with_date "Implement API Gateway" "2023-11-05" "services/gateway"

# 4. Frontend Initialization (Jan 2024)
commit_with_date "Initialize Next.js Frontend" "2024-01-20" "frontend/package.json frontend/tsconfig.json frontend/tailwind.config.ts frontend/postcss.config.mjs frontend/next.config.mjs frontend/public frontend/README.md frontend/eslint.config.mjs frontend/next.config.ts frontend/package-lock.json"

# 5. Frontend Auth (Feb 2024)
commit_with_date "Implement Frontend Authentication Pages" "2024-02-15" "frontend/src/app/(auth)"

# 6. Frontend Dashboard (Mar 2024)
commit_with_date "Implement Dashboard and Layout" "2024-03-10" "frontend/src/app/dashboard frontend/src/app/layout.tsx frontend/src/app/globals.css"

# 7. DevOps & Infrastructure (April 2024)
commit_with_date "Add Docker Compose and Observability Stack" "2024-04-05" "docker-compose.yml infrastructure/ services/*/Dockerfile frontend/Dockerfile"

# 8. Advanced Modernization - gRPC (May 2024)
commit_with_date "Migrate to gRPC for Inter-Service Communication" "2024-05-10" "pkg/proto services/auth/main.go services/gateway/main.go go.mod go.sum"

# 9. Advanced Modernization - Testing (June 2024)
commit_with_date "Add Comprehensive Backend and Frontend Tests" "2024-06-15" "services/auth/main_test.go frontend/e2e frontend/playwright.config.ts"

# 10. Advanced Modernization - K8s & CI/CD (July 2024)
commit_with_date "Add Kubernetes Manifests and CI/CD Workflow" "2024-07-20" "k8s/ .github/"

# 11. Final Polish (Present)
commit_with_date "Update Modernization Playbook and Finalize" "$(date +%Y-%m-%d)" "MODERNIZATION_PLAYBOOK.md task.md .gitignore"

echo "History simulation complete."
git log --oneline --graph --all
