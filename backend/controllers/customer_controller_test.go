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
