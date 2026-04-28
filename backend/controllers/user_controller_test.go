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
	"gorm.io/gorm"
)

func setupUserTestDB(t *testing.T) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Role{}); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

func setupUserRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/users", GetUsers)
	r.GET("/api/users/:id", GetUserByID)
	r.PUT("/api/users/:id", UpdateUser)
	return r
}

func TestGetUsersSuccess(t *testing.T) {
	setupUserTestDB(t)
	router := setupUserRouter()

	users := []models.User{
		{
			FirstName: "Ankan",
			LastName:  "Ghosh",
			Username:  "ankang",
			Name:      "Ankan Ghosh",
			Email:     "ankan@test.com",
			Password:  "hashed",
		},
		{
			FirstName: "Romit",
			LastName:  "Gupta",
			Username:  "romitg",
			Name:      "Romit Gupta",
			Email:     "romit@test.com",
			Password:  "hashed",
		},
	}

	for _, user := range users {
		if err := config.DB.Create(&user).Error; err != nil {
			t.Fatalf("failed to seed user: %v", err)
		}
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/users", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	data, ok := response["data"].([]interface{})
	if !ok {
		t.Fatalf("expected data array in response")
	}

	if len(data) != 2 {
		t.Fatalf("expected 2 users, got %d", len(data))
	}
}

func TestGetUserByIDSuccess(t *testing.T) {
	setupUserTestDB(t)
	router := setupUserRouter()

	user := models.User{
		FirstName: "Test",
		LastName:  "User",
		Username:  "testuser",
		Name:      "Test User",
		Email:     "testuser@example.com",
		Password:  "hashed",
	}

	if err := config.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/users/%d", user.ID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}
}

func TestUpdateUserSuccess(t *testing.T) {
	setupUserTestDB(t)
	router := setupUserRouter()

	role := models.Role{
		Label:    "Support Manager",
		RoleName: "support_manager",
	}
	if err := config.DB.Create(&role).Error; err != nil {
		t.Fatalf("failed to seed role: %v", err)
	}

	user := models.User{
		FirstName: "Old",
		LastName:  "Name",
		Username:  "olduser",
		Name:      "Old Name",
		Email:     "old@example.com",
		Password:  "hashed",
	}
	if err := config.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to seed user: %v", err)
	}

	body := map[string]interface{}{
		"first_name": "New",
		"last_name":  "User",
		"username":   "newuser",
		"email":      "new@example.com",
		"role_id":    role.ID,
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPut,
		fmt.Sprintf("/api/users/%d", user.ID),
		bytes.NewBuffer(jsonBody),
	)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var updated models.User
	if err := config.DB.First(&updated, user.ID).Error; err != nil {
		t.Fatalf("failed to fetch updated user: %v", err)
	}

	if updated.FirstName != "New" {
		t.Fatalf("expected first_name to be updated, got %s", updated.FirstName)
	}

	if updated.LastName != "User" {
		t.Fatalf("expected last_name to be updated, got %s", updated.LastName)
	}

	if updated.Username != "newuser" {
		t.Fatalf("expected username to be updated, got %s", updated.Username)
	}

	if updated.Email != "new@example.com" {
		t.Fatalf("expected email to be updated, got %s", updated.Email)
	}

	if updated.Name != "New User" {
		t.Fatalf("expected computed name to be 'New User', got %s", updated.Name)
	}

	if updated.RoleID == nil || *updated.RoleID != role.ID {
		t.Fatalf("expected role_id to be updated")
	}
}
