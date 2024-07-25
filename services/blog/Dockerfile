# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container
COPY . .

# Build the Go app
RUN go build -o main ./services/blog

# Run stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .

# Expose port 8082 to the outside world
EXPOSE 8082

# Command to run the executable
CMD ["./main"]
