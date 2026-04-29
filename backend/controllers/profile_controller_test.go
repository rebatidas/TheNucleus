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
)

func TestCreateProfileSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	body := map[string]interface{}{
		"name":        "Restricted User",
		"description": "Limited access profile",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/profiles", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetProfilesSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	if err := config.DB.Create(&models.Profile{Name: "Give all access"}).Error; err != nil {
		t.Fatalf("failed to seed profile: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/profiles", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestGetProfileByIDSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	profile := models.Profile{Name: "Give all access"}
	if err := config.DB.Create(&profile).Error; err != nil {
		t.Fatalf("failed to seed profile: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/profiles/%d", profile.ID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestUpdateProfileSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	profile := models.Profile{Name: "Old Name"}
	if err := config.DB.Create(&profile).Error; err != nil {
		t.Fatalf("failed to seed profile: %v", err)
	}

	body := map[string]interface{}{
		"name":        "New Name",
		"description": "Updated description",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPut,
		fmt.Sprintf("/api/profiles/%d", profile.ID),
		bytes.NewBuffer(jsonBody),
	)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestDeleteProfileSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	profile := models.Profile{Name: "Delete Me"}
	if err := config.DB.Create(&profile).Error; err != nil {
		t.Fatalf("failed to seed profile: %v", err)
	}

	req, _ := http.NewRequest(
		http.MethodDelete,
		fmt.Sprintf("/api/profiles/%d", profile.ID),
		nil,
	)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestUpsertObjectPermissionsSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	profile := models.Profile{Name: "Object Access"}
	if err := config.DB.Create(&profile).Error; err != nil {
		t.Fatalf("failed to seed profile: %v", err)
	}

	body := []map[string]interface{}{
		{
			"object_name": "Customers",
			"can_view":    true,
			"can_create":  true,
			"can_edit":    false,
			"can_delete":  false,
		},
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPut,
		fmt.Sprintf("/api/profiles/%d/object-permissions", profile.ID),
		bytes.NewBuffer(jsonBody),
	)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestUpsertFieldPermissionsSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	profile := models.Profile{Name: "Field Access"}
	if err := config.DB.Create(&profile).Error; err != nil {
		t.Fatalf("failed to seed profile: %v", err)
	}

	body := []map[string]interface{}{
		{
			"object_name": "Customers",
			"field_name":  "email",
			"visible":     true,
			"read_only":   true,
		},
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPut,
		fmt.Sprintf("/api/profiles/%d/field-permissions", profile.ID),
		bytes.NewBuffer(jsonBody),
	)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetMyPermissionsSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "profile_permissions")
	grantObjectPermission(t, profile.ID, "Customers", true, true, false, false)
	grantFieldPermission(t, profile.ID, "Customers", "email", true, true)

	req, _ := http.NewRequest(http.MethodGet, "/api/auth/me-permissions", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}
