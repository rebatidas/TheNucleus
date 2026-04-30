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
		OwnerID:         user.ID,
		CreatedBy:       user.ID,
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
		OwnerID:         user.ID,
		CreatedBy:       user.ID,
	}

	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	req, _ := http.NewRequest(http.MethodGet, "/api/customers/"+itoaUint(customer.ID), nil)
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
		"email":      "john@test.com",
		"phone":      "1234567890",
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

func TestUpdateCustomerBlockedWithoutEditPermission(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_no_edit")
	grantObjectPermission(t, profile.ID, "Customers", true, true, false, false)

	customer := models.Customer{
		FirstName: "Jane",
		LastName:  "Doe",
		Email:     "jane@test.com",
		Phone:     "1111111111",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	body := map[string]interface{}{
		"first_name": "Updated",
		"last_name":  "Doe",
		"email":      "updated@test.com",
		"phone":      "2222222222",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/api/customers/"+itoaUint(customer.ID), bytes.NewBuffer(jsonBody))
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
		Email:     "delete@test.com",
		Phone:     "1111111111",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	req, _ := http.NewRequest(http.MethodDelete, "/api/customers/"+itoaUint(customer.ID), nil)
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
		Phone:     "1111111111",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
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

func TestGetCustomersRecentlyViewed(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_recent")
	grantObjectPermission(t, profile.ID, "Customers", true, false, false, false)

	viewed := models.Customer{
		FirstName: "Viewed",
		LastName:  "Recently",
		Email:     "viewed@example.com",
		Phone:     "3333333333",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	notViewed := models.Customer{
		FirstName: "Not",
		LastName:  "Viewed",
		Email:     "notviewed@example.com",
		Phone:     "4444444444",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}

	config.DB.Create(&viewed)
	config.DB.Create(&notViewed)

	config.DB.Create(&models.RecentlyViewed{
		UserID:     user.ID,
		RecordType: "customer",
		RecordID:   viewed.ID,
		ViewedAt:   time.Now(),
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/customers?view=recently_viewed", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Viewed")) {
		t.Fatalf("expected viewed customer, got %s", w.Body.String())
	}

	if bytes.Contains(w.Body.Bytes(), []byte("notviewed@example.com")) {
		t.Fatalf("expected non-viewed customer hidden, got %s", w.Body.String())
	}
}

func TestGetCustomersPrivateOWDShowsOnlyOwnedRecords(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "customer_private_owner")
	grantObjectPermission(t, profile.ID, "Customers", true, false, false, false)
	seedOWD(t, "Customers", "Private")

	owned := models.Customer{
		FirstName: "Owned",
		LastName:  "Customer",
		Email:     "owned@test.com",
		Phone:     "1111111111",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	other := models.Customer{
		FirstName: "Other",
		LastName:  "Customer",
		Email:     "other@test.com",
		Phone:     "2222222222",
		OwnerID:   user.ID + 100,
		CreatedBy: user.ID + 100,
	}

	config.DB.Create(&owned)
	config.DB.Create(&other)

	req, _ := http.NewRequest(http.MethodGet, "/api/customers", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Owned")) {
		t.Fatalf("expected owned customer in response, got %s", w.Body.String())
	}

	if bytes.Contains(w.Body.Bytes(), []byte("Other")) {
		t.Fatalf("expected other customer hidden, got %s", w.Body.String())
	}
}

func TestGetCustomersParentRoleCanSeeChildRecordsWhenPrivate(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	parentRole := models.Role{Label: "Manager", RoleName: "manager"}
	config.DB.Create(&parentRole)

	childRole := models.Role{Label: "Rep", RoleName: "rep", ReportsToID: &parentRole.ID}
	config.DB.Create(&childRole)

	manager, managerProfile := seedUserWithRoleAndProfile(t, "manager_user", &parentRole.ID)
	rep, _ := seedUserWithRoleAndProfile(t, "rep_user", &childRole.ID)

	grantObjectPermission(t, managerProfile.ID, "Customers", true, false, false, false)
	seedOWD(t, "Customers", "Private")

	childCustomer := models.Customer{
		FirstName: "Child",
		LastName:  "Customer",
		Email:     "child@test.com",
		Phone:     "3333333333",
		OwnerID:   rep.ID,
		CreatedBy: rep.ID,
	}
	config.DB.Create(&childCustomer)

	req, _ := http.NewRequest(http.MethodGet, "/api/customers", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, manager.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Child")) {
		t.Fatalf("expected manager to see child-role customer, got %s", w.Body.String())
	}
}

func TestGetCustomersMyCustomersOnlyOwned(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouter()

	user, profile := seedUserWithProfile(t, "my_customers")
	grantObjectPermission(t, profile.ID, "Customers", true, false, false, false)
	seedOWD(t, "Customers", "PublicReadWrite")

	owned := models.Customer{
		FirstName: "Mine",
		LastName:  "Customer",
		Email:     "mine@test.com",
		Phone:     "1111111111",
		OwnerID:   user.ID,
		CreatedBy: user.ID,
	}
	other := models.Customer{
		FirstName: "NotMine",
		LastName:  "Customer",
		Email:     "notmine@test.com",
		Phone:     "2222222222",
		OwnerID:   user.ID + 10,
		CreatedBy: user.ID + 10,
	}

	config.DB.Create(&owned)
	config.DB.Create(&other)

	req, _ := http.NewRequest(http.MethodGet, "/api/customers?view=my_customers", nil)
	req.Header.Set("Authorization", "Bearer "+makeAuthToken(t, user.ID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d, body: %s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte("Mine")) {
		t.Fatalf("expected owned customer, got %s", w.Body.String())
	}

	if bytes.Contains(w.Body.Bytes(), []byte("NotMine")) {
		t.Fatalf("expected non-owned customer hidden, got %s", w.Body.String())
	}
}
