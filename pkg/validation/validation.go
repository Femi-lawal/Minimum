package validation

import (
	"errors"
	"regexp"
	"strings"
	"unicode"
)

// Common validation errors
var (
	ErrEmailRequired    = errors.New("email is required")
	ErrEmailInvalid     = errors.New("email format is invalid")
	ErrPasswordRequired = errors.New("password is required")
	ErrPasswordTooShort = errors.New("password must be at least 8 characters")
	ErrPasswordWeak     = errors.New("password must contain at least one uppercase letter, one lowercase letter, and one number")
	ErrTitleRequired    = errors.New("title is required")
	ErrTitleTooLong     = errors.New("title must be less than 255 characters")
	ErrContentRequired  = errors.New("content is required")
	ErrContentTooLong   = errors.New("content must be less than 50000 characters")
)

// Email validation regex (RFC 5322 simplified)
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// ValidateEmail checks if the email is valid
func ValidateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return ErrEmailRequired
	}
	if !emailRegex.MatchString(email) {
		return ErrEmailInvalid
	}
	return nil
}

// ValidatePassword checks password strength
func ValidatePassword(password string) error {
	if password == "" {
		return ErrPasswordRequired
	}
	if len(password) < 8 {
		return ErrPasswordTooShort
	}

	var hasUpper, hasLower, hasNumber bool
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		}
	}

	if !hasUpper || !hasLower || !hasNumber {
		return ErrPasswordWeak
	}

	return nil
}

// ValidatePostTitle checks post title
func ValidatePostTitle(title string) error {
	title = strings.TrimSpace(title)
	if title == "" {
		return ErrTitleRequired
	}
	if len(title) > 255 {
		return ErrTitleTooLong
	}
	return nil
}

// ValidatePostContent checks post content
func ValidatePostContent(content string) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return ErrContentRequired
	}
	if len(content) > 50000 {
		return ErrContentTooLong
	}
	return nil
}

// SanitizeString trims whitespace and removes null bytes
func SanitizeString(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "\x00", "")
	return s
}
