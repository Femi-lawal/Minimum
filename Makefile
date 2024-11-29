.PHONY: build clean deploy

build:
	env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o bootstrap ./cmd/lambda

clean:
	rm -rf bootstrap

deploy: build
	serverless deploy
