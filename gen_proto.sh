#!/bin/sh
set -e

echo "Installing protobuf..."
apk add --no-cache protobuf

echo "Installing go plugins..."
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

export PATH=$PATH:$(go env GOPATH)/bin

echo "Generating blog proto..."
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       pkg/proto/blog.proto

echo "Done!"
