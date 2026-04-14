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

func setupRoleTestDB(t *testing.T) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	if err := db.AutoMigrate(&models.Role{}); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

func setupRoleRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/roles", GetRoles)
	r.GET("/api/roles/:id", GetRoleByID)
	r.POST("/api/roles", CreateRole)
	r.PUT("/api/roles/:id", UpdateRole)
	return r
}

func TestGetRolesSuccess(t *testing.T) {
	setupRoleTestDB(t)
	router := setupRoleRouter()

	roles := []models.Role{
		{Label: "CEO", RoleName: "ceo"},
		{Label: "Support Manager", RoleName: "support_manager"},
	}

	for _, role := range roles {
		if err := config.DB.Create(&role).Error; err != nil {
			t.Fatalf("failed to seed role: %v", err)
		}
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/roles", nil)
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
		t.Fatalf("expected 2 roles, got %d", len(data))
	}
}

func TestGetRoleByIDSuccess(t *testing.T) {
	setupRoleTestDB(t)
	router := setupRoleRouter()

	role := models.Role{
		Label:    "Case Agent",
		RoleName: "case_agent",
	}

	if err := config.DB.Create(&role).Error; err != nil {
		t.Fatalf("failed to seed role: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/roles/%d", role.ID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}
}

func TestCreateRoleSuccess(t *testing.T) {
	setupRoleTestDB(t)
	router := setupRoleRouter()

	body := map[string]interface{}{
		"label":     "Support Manager",
		"role_name": "support_manager",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/roles", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var role models.Role
	if err := config.DB.Where("role_name = ?", "support_manager").First(&role).Error; err != nil {
		t.Fatalf("expected role to be created, got error: %v", err)
	}

	if role.Label != "Support Manager" {
		t.Fatalf("expected role label to be saved")
	}
}

func TestCreateChildRoleSuccess(t *testing.T) {
	setupRoleTestDB(t)
	router := setupRoleRouter()

	parent := models.Role{
		Label:    "Support Manager",
		RoleName: "support_manager",
	}
	if err := config.DB.Create(&parent).Error; err != nil {
		t.Fatalf("failed to seed parent role: %v", err)
	}

	body := map[string]interface{}{
		"label":         "Case Agent",
		"role_name":     "case_agent",
		"reports_to_id": parent.ID,
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/roles", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var child models.Role
	if err := config.DB.Where("role_name = ?", "case_agent").First(&child).Error; err != nil {
		t.Fatalf("expected child role to be created, got error: %v", err)
	}

	if child.ReportsToID == nil || *child.ReportsToID != parent.ID {
		t.Fatalf("expected child role to reference parent role")
	}
}

func TestUpdateRoleSuccess(t *testing.T) {
	setupRoleTestDB(t)
	router := setupRoleRouter()

	parent := models.Role{
		Label:    "CEO",
		RoleName: "ceo",
	}
	if err := config.DB.Create(&parent).Error; err != nil {
		t.Fatalf("failed to seed parent role: %v", err)
	}

	role := models.Role{
		Label:    "Support Lead",
		RoleName: "support_lead",
	}
	if err := config.DB.Create(&role).Error; err != nil {
		t.Fatalf("failed to seed role: %v", err)
	}

	body := map[string]interface{}{
		"label":         "Support Manager",
		"role_name":     "support_manager",
		"reports_to_id": parent.ID,
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPut,
		fmt.Sprintf("/api/roles/%d", role.ID),
		bytes.NewBuffer(jsonBody),
	)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var updated models.Role
	if err := config.DB.First(&updated, role.ID).Error; err != nil {
		t.Fatalf("failed to fetch updated role: %v", err)
	}

	if updated.Label != "Support Manager" {
		t.Fatalf("expected updated label, got %s", updated.Label)
	}

	if updated.RoleName != "support_manager" {
		t.Fatalf("expected updated role_name, got %s", updated.RoleName)
	}

	if updated.ReportsToID == nil || *updated.ReportsToID != parent.ID {
		t.Fatalf("expected updated reports_to_id")
	}
}
