package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func setupAuthTestDB(t *testing.T) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

func setupAuthRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/auth/register", Register)
	r.POST("/api/auth/login", Login)
	return r
}

func TestRegisterSuccess(t *testing.T) {
	setupAuthTestDB(t)
	router := setupAuthRouter()

	body := map[string]interface{}{
		"name":     "Test User",
		"email":    "registersuccess@example.com",
		"password": "Password123",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusCreated, w.Code, w.Body.String())
	}

	var user models.User
	err := config.DB.Where("email = ?", "registersuccess@example.com").First(&user).Error
	if err != nil {
		t.Fatalf("expected user to be created, got error: %v", err)
	}

	if user.Password == "Password123" {
		t.Fatalf("expected password to be hashed, but it was stored as plain text")
	}
}

func TestRegisterDuplicateEmail(t *testing.T) {
	setupAuthTestDB(t)
	router := setupAuthRouter()

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Password123"), 14)

	existingUser := models.User{
		Name:     "Existing User",
		Email:    "duplicate@example.com",
		Password: string(hashedPassword),
	}

	if err := config.DB.Create(&existingUser).Error; err != nil {
		t.Fatalf("failed to seed existing user: %v", err)
	}

	body := map[string]interface{}{
		"name":     "Another User",
		"email":    "duplicate@example.com",
		"password": "Password123",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusBadRequest, w.Code, w.Body.String())
	}
}

func TestLoginSuccess(t *testing.T) {
	setupAuthTestDB(t)
	router := setupAuthRouter()

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Password123"), 14)

	user := models.User{
		Name:     "Test User",
		Email:    "loginsuccess@example.com",
		Password: string(hashedPassword),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	body := map[string]interface{}{
		"email":    "loginsuccess@example.com",
		"password": "Password123",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	data, ok := response["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected response data object")
	}

	token, ok := data["token"].(string)
	if !ok || token == "" {
		t.Fatalf("expected token in response")
	}
}

func TestLoginInvalidPassword(t *testing.T) {
	setupAuthTestDB(t)
	router := setupAuthRouter()

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Password123"), 14)

	user := models.User{
		Name:     "Test User",
		Email:    "logininvalid@example.com",
		Password: string(hashedPassword),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	body := map[string]interface{}{
		"email":    "logininvalid@example.com",
		"password": "WrongPassword",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusUnauthorized, w.Code, w.Body.String())
	}
}
