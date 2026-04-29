package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"thenucleus-backend/config"
	"thenucleus-backend/models"
)

func TestCreateCustomerSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_create")
	grantObjectPermission(t, profile.ID, "Customers", true, true, true, false)

	body := map[string]interface{}{
		"salutation":       "Mr.",
		"first_name":       "John",
		"middle_name":      "M",
		"last_name":        "Doe",
		"email":            "john.doe@example.com",
		"phone":            "1234567890",
		"shipping_address": "123 Ship Street",
		"billing_address":  "456 Bill Street",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/customers", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("expected 200 or 201, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCustomersSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_view")
	grantObjectPermission(t, profile.ID, "Customers", true, false, false, false)

	customer := models.Customer{
		Salutation:      "Ms.",
		FirstName:       "Jane",
		MiddleName:      "A",
		LastName:        "Smith",
		Email:           "jane.smith@example.com",
		Phone:           "9998887777",
		ShippingAddress: "Ship Lane",
		BillingAddress:  "Bill Lane",
	}

	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/customers", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCustomerByIDSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_view_one")
	grantObjectPermission(t, profile.ID, "Customers", true, false, false, false)

	customer := models.Customer{
		Salutation:      "Mr.",
		FirstName:       "Alex",
		LastName:        "Brown",
		Email:           "alex.brown@example.com",
		Phone:           "5551234567",
		ShippingAddress: "One Street",
		BillingAddress:  "Two Street",
	}

	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	url := "/api/customers/" + itoaUint(customer.ID)
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCustomersMissingTokenRejected(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/customers", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCustomersBlockedWithoutPermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, _ := seedUserWithProfile(t, "customer_no_view")

	req, _ := http.NewRequest(http.MethodGet, "/api/customers", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestCreateCustomerBlockedWithoutCreatePermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_no_create")
	grantObjectPermission(t, profile.ID, "Customers", true, false, true, false)

	body := map[string]interface{}{
		"first_name": "John",
		"last_name":  "Doe",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/customers", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestUpdateCustomerReadOnlyFieldNotUpdated(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_edit")
	grantObjectPermission(t, profile.ID, "Customers", true, true, true, false)
	grantFieldPermission(t, profile.ID, "Customers", "email", true, true)

	customer := models.Customer{
		FirstName: "Jane",
		LastName:  "Doe",
		Email:     "old@example.com",
		Phone:     "1111111111",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	body := map[string]interface{}{
		"first_name": "Jane",
		"last_name":  "Doe",
		"email":      "new@example.com",
		"phone":      "2222222222",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPut,
		"/api/customers/"+itoaUint(customer.ID),
		bytes.NewBuffer(jsonBody),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var updated models.Customer
	if err := config.DB.First(&updated, customer.ID).Error; err != nil {
		t.Fatalf("failed to reload customer: %v", err)
	}

	if updated.Email != "old@example.com" {
		t.Fatalf("expected read-only email to remain unchanged, got %s", updated.Email)
	}
}

func TestUpdateCustomerBlockedWithoutEditPermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_no_edit")
	grantObjectPermission(t, profile.ID, "Customers", true, true, false, false)

	customer := models.Customer{
		FirstName: "Jane",
		LastName:  "Doe",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	body := map[string]interface{}{
		"first_name": "Updated",
		"last_name":  "Doe",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(
		http.MethodPut,
		"/api/customers/"+itoaUint(customer.ID),
		bytes.NewBuffer(jsonBody),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestDeleteCustomerBlockedWithoutDeletePermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_no_delete")
	grantObjectPermission(t, profile.ID, "Customers", true, true, true, false)

	customer := models.Customer{
		FirstName: "Delete",
		LastName:  "Me",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	req, _ := http.NewRequest(
		http.MethodDelete,
		"/api/customers/"+itoaUint(customer.ID),
		nil,
	)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestGetCustomersHiddenFieldStripped(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_hidden")
	grantObjectPermission(t, profile.ID, "Customers", true, false, false, false)
	grantFieldPermission(t, profile.ID, "Customers", "email", false, false)

	customer := models.Customer{
		FirstName: "Hidden",
		LastName:  "Field",
		Email:     "hidden@example.com",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/customers", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var response map[string][]map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if response["data"][0]["email"] != "" {
		t.Fatalf("expected hidden email to be blank in response")
	}
}

func TestGetCustomersMyCustomers(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	// created_by=1 — should appear
	mine := models.Customer{
		FirstName: "Mine",
		LastName:  "Owner",
		Email:     "mine@example.com",
		Phone:     "1111111111",
		CreatedBy: 1,
	}
	// created_by=2 — should not appear
	other := models.Customer{
		FirstName: "Other",
		LastName:  "Person",
		Email:     "other@example.com",
		Phone:     "2222222222",
		CreatedBy: 2,
	}

	if err := config.DB.Create(&mine).Error; err != nil {
		t.Fatalf("failed to seed mine customer: %v", err)
	}
	if err := config.DB.Create(&other).Error; err != nil {
		t.Fatalf("failed to seed other customer: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/customers?view=my_customers", nil)
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
		t.Fatalf("expected 1 customer for my_customers, got %d", len(data))
	}

	first := data[0].(map[string]interface{})
	if first["first_name"] != "Mine" {
		t.Fatalf("expected customer 'Mine', got %v", first["first_name"])
	}
}

func TestGetCustomersRecentlyViewed(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	viewed := models.Customer{
		FirstName: "Viewed",
		LastName:  "Recently",
		Email:     "viewed@example.com",
		Phone:     "3333333333",
	}
	notViewed := models.Customer{
		FirstName: "Not",
		LastName:  "Viewed",
		Email:     "notviewed@example.com",
		Phone:     "4444444444",
	}

	if err := config.DB.Create(&viewed).Error; err != nil {
		t.Fatalf("failed to seed viewed customer: %v", err)
	}
	if err := config.DB.Create(&notViewed).Error; err != nil {
		t.Fatalf("failed to seed not-viewed customer: %v", err)
	}

	config.DB.Create(&models.RecentlyViewed{
		UserID:     1,
		RecordType: "customer",
		RecordID:   viewed.ID,
		ViewedAt:   time.Now(),
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/customers?view=recently_viewed", nil)
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
		t.Fatalf("expected 1 recently viewed customer, got %d", len(data))
	}

	first := data[0].(map[string]interface{})
	if first["first_name"] != "Viewed" {
		t.Fatalf("expected customer 'Viewed', got %v", first["first_name"])
	}
}
