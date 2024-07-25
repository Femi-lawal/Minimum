# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files first
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/service \
    ./services/gateway

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata wget

WORKDIR /app

COPY --from=builder /app/service .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

RUN adduser -D -u 1000 appuser
USER appuser

EXPOSE ${PORT}

CMD ["./service"]
