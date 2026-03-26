package controllers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

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
