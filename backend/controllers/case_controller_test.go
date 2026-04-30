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

func TestGetCasesSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "case_view")
	grantObjectPermission(t, profile.ID, "Cases", true, false, false, false)

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Email:     "john.doe@getcases.com",
		Phone:     "1234567890",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	customerCase := models.Case{
		CaseNumber:  "CASE-2001",
		Status:      "New",
		Subject:     "Cases page issue",
		Description: "Testing get cases",
		CustomerID:  customer.ID,
		OwnerID:     user.ID,
		CreatedBy:   user.ID,
	}
	if err := config.DB.Create(&customerCase).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/cases", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Cases page issue")) {
		t.Fatalf("expected seeded case in response, got %s", w.Body.String())
	}
}

func TestGetCasesByCustomerIDSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "case_by_customer")
	grantObjectPermission(t, profile.ID, "Cases", true, false, false, false)

	customer := models.Customer{
		FirstName: "Case",
		LastName:  "Owner",
		Email:     "case.owner@example.com",
		Phone:     "4445556666",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	customerCase := models.Case{
		CaseNumber:  "CASE-001",
		Status:      "New",
		Subject:     "Printer issue",
		Description: "Printer not working",
		CustomerID:  customer.ID,
		OwnerID:     user.ID,
		CreatedBy:   user.ID,
	}
	if err := config.DB.Create(&customerCase).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/customer-cases/"+itoaUint(customer.ID), nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCasesMissingTokenRejected(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/cases", nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCasesBlockedWithoutPermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, _ := seedUserWithProfile(t, "case_no_view")

	req, _ := http.NewRequest(http.MethodGet, "/api/cases", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestCreateCaseBlockedWithoutCreatePermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "case_no_create")
	grantObjectPermission(t, profile.ID, "Cases", true, false, true, false)

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Email:     "john@example.com",
		Phone:     "1234567890",
		OwnerID:   user.ID,
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	body := map[string]interface{}{
		"subject":     "Blocked create",
		"status":      "New",
		"customer_id": customer.ID,
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/cases", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestUpdateCaseBlockedWithoutEditPermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "case_no_edit")
	grantObjectPermission(t, profile.ID, "Cases", true, true, false, false)

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Email:     "john2@example.com",
		Phone:     "1234567890",
		OwnerID:   user.ID,
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	caseRecord := models.Case{
		CaseNumber: "CASE-1112",
		Status:     "New",
		Subject:    "Locked Case",
		CustomerID: customer.ID,
		OwnerID:    user.ID,
		CreatedBy:  user.ID,
	}
	if err := config.DB.Create(&caseRecord).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	body := map[string]interface{}{
		"status":      "Closed",
		"subject":     "Updated Subject",
		"customer_id": customer.ID,
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/api/cases/"+itoaUint(caseRecord.ID), bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestDeleteCaseBlockedWithoutDeletePermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "case_no_delete")
	grantObjectPermission(t, profile.ID, "Cases", true, true, true, false)

	customer := models.Customer{
		FirstName: "John",
		LastName:  "Doe",
		Email:     "john3@example.com",
		Phone:     "1234567890",
		OwnerID:   user.ID,
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	caseRecord := models.Case{
		CaseNumber: "CASE-1113",
		Status:     "New",
		Subject:    "Delete Block",
		CustomerID: customer.ID,
		OwnerID:    user.ID,
		CreatedBy:  user.ID,
	}
	if err := config.DB.Create(&caseRecord).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	req, _ := http.NewRequest(http.MethodDelete, "/api/cases/"+itoaUint(caseRecord.ID), nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCasesPrivateOWDShowsOnlyOwnedRecords(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "case_private_owner")
	grantObjectPermission(t, profile.ID, "Cases", true, false, false, false)
	seedOWD(t, "Cases", "Private")

	customer := models.Customer{
		FirstName: "Case",
		LastName:  "Customer",
		Email:     "casecustomer@test.com",
		Phone:     "1111111111",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	config.DB.Create(&customer)

	owned := models.Case{
		CaseNumber: "CASE-OWNED",
		Status:     "New",
		Subject:    "Owned case",
		CustomerID: customer.ID,
		OwnerID:    user.ID,
		CreatedBy:  user.ID,
	}
	other := models.Case{
		CaseNumber: "CASE-OTHER",
		Status:     "New",
		Subject:    "Other case",
		CustomerID: customer.ID,
		OwnerID:    user.ID + 100,
		CreatedBy:  user.ID + 100,
	}

	config.DB.Create(&owned)
	config.DB.Create(&other)

	req, _ := http.NewRequest(http.MethodGet, "/api/cases", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Owned case")) {
		t.Fatalf("expected owned case, got %s", w.Body.String())
	}

	if bytes.Contains(w.Body.Bytes(), []byte("Other case")) {
		t.Fatalf("expected other case hidden, got %s", w.Body.String())
	}
}

func TestGetCasesMyCasesOnlyOwned(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "my_cases")
	grantObjectPermission(t, profile.ID, "Cases", true, false, false, false)
	seedOWD(t, "Cases", "PublicReadWrite")

	customer := models.Customer{
		FirstName: "Case",
		LastName:  "Customer",
		Email:     "casecustomer2@test.com",
		Phone:     "2222222222",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	config.DB.Create(&customer)

	mine := models.Case{
		CaseNumber: "CASE-MINE",
		Status:     "New",
		Subject:    "My case",
		CustomerID: customer.ID,
		OwnerID:    user.ID,
		CreatedBy:  user.ID,
	}
	other := models.Case{
		CaseNumber: "CASE-NOT-MINE",
		Status:     "New",
		Subject:    "Not my case",
		CustomerID: customer.ID,
		OwnerID:    user.ID + 10,
		CreatedBy:  user.ID + 10,
	}

	config.DB.Create(&mine)
	config.DB.Create(&other)

	req, _ := http.NewRequest(http.MethodGet, "/api/cases?view=my_cases", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("My case")) {
		t.Fatalf("expected my case, got %s", w.Body.String())
	}

	if bytes.Contains(w.Body.Bytes(), []byte("Not my case")) {
		t.Fatalf("expected non-owned case hidden, got %s", w.Body.String())
	}
}
