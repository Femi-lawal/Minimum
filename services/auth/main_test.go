package main

import (
	"context"
	"testing"

	pb "project/pkg/proto"

	"go.uber.org/zap"
)

func TestLogin(t *testing.T) {
	// Setup
	logger := zap.NewNop()
	svc := &Service{
		logger: logger,
	}

	tests := []struct {
		name     string
		email    string
		password string
		wantErr  bool
	}{
		{
			name:     "Valid credentials",
			email:    "test@example.com",
			password: "password",
			wantErr:  false,
		},
		{
			name:     "Invalid credentials",
			email:    "wrong@example.com",
			password: "password",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &pb.LoginRequest{
				Email:    tt.email,
				Password: tt.password,
			}
			resp, err := svc.Login(context.Background(), req)
			if (err != nil) != tt.wantErr {
				t.Errorf("Login() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && resp.Token == "" {
				t.Errorf("Login() token is empty")
			}
		})
	}
}

func TestRegister(t *testing.T) {
	// Setup
	logger := zap.NewNop()
	svc := &Service{
		logger: logger,
	}

	req := &pb.RegisterRequest{
		Email:    "new@example.com",
		Password: "password",
	}

	resp, err := svc.Register(context.Background(), req)
	if err != nil {
		t.Errorf("Register() error = %v", err)
	}
	if resp.Email != req.Email {
		t.Errorf("Register() email = %v, want %v", resp.Email, req.Email)
	}
}
