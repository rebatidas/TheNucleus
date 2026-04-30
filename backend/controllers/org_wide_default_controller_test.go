package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"thenucleus-backend/config"
	"thenucleus-backend/models"
)

func TestGetOrgWideDefaultsSeedsDefaults(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/org-wide-defaults", nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var count int64
	config.DB.Model(&models.OrgWideDefault{}).Count(&count)

	if count != 2 {
		t.Fatalf("expected 2 default OWD records, got %d", count)
	}
}

func TestUpsertOrgWideDefaultsSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "owd_admin")
	grantObjectPermission(t, profile.ID, "Company Information", true, true, true, true)

	payload := []map[string]string{
		{"object_name": "Customers", "access_level": "Private"},
		{"object_name": "Cases", "access_level": "PublicReadOnly"},
	}

	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPut, "/api/org-wide-defaults", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var customersOWD models.OrgWideDefault
	if err := config.DB.Where("object_name = ?", "Customers").First(&customersOWD).Error; err != nil {
		t.Fatalf("failed to fetch customer OWD: %v", err)
	}

	if customersOWD.AccessLevel != "Private" {
		t.Fatalf("expected Customers OWD Private, got %s", customersOWD.AccessLevel)
	}
}

func TestUpsertOrgWideDefaultsBlockedWithoutPermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, _ := seedUserWithProfile(t, "owd_no_edit")

	payload := []map[string]string{
		{"object_name": "Customers", "access_level": "Private"},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPut, "/api/org-wide-defaults", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}
