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

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("expected status 200 or 201, got %d, body: %s", w.Code, w.Body.String())
	}

	var customer models.Customer
	err := config.DB.Where("email = ?", "john.doe@example.com").First(&customer).Error
	if err != nil {
		t.Fatalf("expected customer to be created, got error: %v", err)
	}

	if customer.FirstName != "John" {
		t.Fatalf("expected first name John, got %s", customer.FirstName)
	}
}

func TestGetCustomersSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

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
		t.Fatalf("expected at least one customer in response")
	}
}

func TestGetCustomerByIDSuccess(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

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

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
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
