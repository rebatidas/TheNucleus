package controllers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"thenucleus-backend/config"
	"thenucleus-backend/models"
)

func TestGetCasesSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	customer := models.Customer{
		Salutation:      "Mr.",
		FirstName:       "John",
		LastName:        "Doe",
		Email:           "john.doe@getcases.com",
		Phone:           "1234567890",
		ShippingAddress: "Ship Street",
		BillingAddress:  "Bill Street",
	}

	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	customerCase := models.Case{
		CaseNumber:  "CASE-2001",
		Status:      "New",
		Subject:     "Cases page issue",
		Description: "Testing get cases",
		Resolution:  "",
		CustomerID:  customer.ID,
	}

	if err := config.DB.Create(&customerCase).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/cases", nil)

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
		t.Fatalf("expected response data array")
	}

	if len(data) == 0 {
		t.Fatalf("expected at least one case in response")
	}
}
func TestGetCasesMyCases(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	customer := models.Customer{
		FirstName: "Case",
		LastName:  "Owner",
		Email:     "case.owner.my@example.com",
		Phone:     "5550001111",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	// created_by=1 — should appear
	mine := models.Case{
		CaseNumber: "CASE-MY-001",
		Status:     "New",
		Subject:    "My case",
		CustomerID: customer.ID,
		CreatedBy:  1,
	}
	// created_by=2 — should not appear
	other := models.Case{
		CaseNumber: "CASE-OTHER-001",
		Status:     "New",
		Subject:    "Other case",
		CustomerID: customer.ID,
		CreatedBy:  2,
	}

	if err := config.DB.Create(&mine).Error; err != nil {
		t.Fatalf("failed to seed mine case: %v", err)
	}
	if err := config.DB.Create(&other).Error; err != nil {
		t.Fatalf("failed to seed other case: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/cases?view=my_cases", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	data := response["data"].([]interface{})
	if len(data) != 1 {
		t.Fatalf("expected 1 case for my_cases, got %d", len(data))
	}

	first := data[0].(map[string]interface{})
	if first["subject"] != "My case" {
		t.Fatalf("expected subject 'My case', got %v", first["subject"])
	}
}

func TestGetCasesRecentlyViewed(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	customer := models.Customer{
		FirstName: "Case",
		LastName:  "Customer",
		Email:     "case.customer.rv@example.com",
		Phone:     "5550002222",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	viewed := models.Case{
		CaseNumber: "CASE-VIEWED-001",
		Status:     "New",
		Subject:    "Viewed case",
		CustomerID: customer.ID,
	}
	notViewed := models.Case{
		CaseNumber: "CASE-NOTVIEWED-001",
		Status:     "New",
		Subject:    "Not viewed case",
		CustomerID: customer.ID,
	}

	if err := config.DB.Create(&viewed).Error; err != nil {
		t.Fatalf("failed to seed viewed case: %v", err)
	}
	if err := config.DB.Create(&notViewed).Error; err != nil {
		t.Fatalf("failed to seed not-viewed case: %v", err)
	}

	config.DB.Create(&models.RecentlyViewed{
		UserID:     1,
		RecordType: "case",
		RecordID:   viewed.ID,
		ViewedAt:   time.Now(),
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/cases?view=recently_viewed", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	data := response["data"].([]interface{})
	if len(data) != 1 {
		t.Fatalf("expected 1 recently viewed case, got %d", len(data))
	}

	first := data[0].(map[string]interface{})
	if first["subject"] != "Viewed case" {
		t.Fatalf("expected subject 'Viewed case', got %v", first["subject"])
	}
}

func TestGetCasesByCustomerIDSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	customer := models.Customer{
		Salutation:      "Ms.",
		FirstName:       "Case",
		LastName:        "Owner",
		Email:           "case.owner@example.com",
		Phone:           "4445556666",
		ShippingAddress: "A Street",
		BillingAddress:  "B Street",
	}

	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	customerCase := models.Case{
		CaseNumber:  "CASE-001",
		Status:      "New",
		Subject:     "Printer issue",
		Description: "Printer not working",
		Resolution:  "",
		CustomerID:  customer.ID,
	}

	if err := config.DB.Create(&customerCase).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	url := "/api/customer-cases/" + itoaUint(customer.ID)
	req, _ := http.NewRequest(http.MethodGet, url, nil)

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
		t.Fatalf("expected response data array")
	}

	if len(data) != 1 {
		t.Fatalf("expected 1 case, got %d", len(data))
	}
}
