#!/bin/sh
set -e

echo "Updating apk..."
apk update

echo "Installing protobuf and git..."
apk add --no-cache protobuf git

echo "Installing go plugins..."
export GOPROXY=https://proxy.golang.org,direct
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

export PATH=$PATH:$(go env GOPATH)/bin

export PATH=$PATH:$(go env GOPATH)/bin

echo "Checking proto content..."
cat pkg/proto/blog.proto | grep "ToggleBookmark"

echo "Generating blog proto..."
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       pkg/proto/blog.proto

echo "Moving generated files to correct package directory..."
mv pkg/proto/blog.pb.go pkg/proto/blog/blog.pb.go
mv pkg/proto/blog_grpc.pb.go pkg/proto/blog/blog_grpc.pb.go

echo "Done!"
