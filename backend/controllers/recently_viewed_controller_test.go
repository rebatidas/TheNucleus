package controllers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"thenucleus-backend/config"
	"thenucleus-backend/models"
)

func TestLogRecentlyViewedCustomer(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	customer := models.Customer{
		FirstName: "Log",
		LastName:  "Me",
		Email:     "log.me@example.com",
		Phone:     "9990001111",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	url := "/api/recently-viewed/customers/" + itoaUint(customer.ID)
	req, _ := http.NewRequest(http.MethodPost, url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var entry models.RecentlyViewed
	err := config.DB.Where(
		"user_id = ? AND record_type = ? AND record_id = ?",
		1, "customer", customer.ID,
	).First(&entry).Error
	if err != nil {
		t.Fatalf("expected recently viewed entry to exist: %v", err)
	}
}

func TestLogRecentlyViewedCustomerNoDuplicates(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	customer := models.Customer{
		FirstName: "NoDup",
		LastName:  "Customer",
		Email:     "nodup.customer@example.com",
		Phone:     "9990002222",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	url := "/api/recently-viewed/customers/" + itoaUint(customer.ID)

	// Call the endpoint twice
	for i := 0; i < 2; i++ {
		req, _ := http.NewRequest(http.MethodPost, url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("call %d: expected status %d, got %d: %s", i+1, http.StatusOK, w.Code, w.Body.String())
		}
	}

	var entries []models.RecentlyViewed
	config.DB.Where(
		"user_id = ? AND record_type = ? AND record_id = ?",
		1, "customer", customer.ID,
	).Find(&entries)

	if len(entries) != 1 {
		t.Fatalf("expected exactly 1 recently viewed entry after 2 calls, got %d", len(entries))
	}
}

func TestLogRecentlyViewedCase(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	customer := models.Customer{
		FirstName: "Case",
		LastName:  "Log",
		Email:     "case.log@example.com",
		Phone:     "9990003333",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	caseRecord := models.Case{
		CaseNumber: "CASE-LOG-001",
		Status:     "New",
		Subject:    "Log this case",
		CustomerID: customer.ID,
	}
	if err := config.DB.Create(&caseRecord).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	url := "/api/recently-viewed/cases/" + itoaUint(caseRecord.ID)
	req, _ := http.NewRequest(http.MethodPost, url, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var entry models.RecentlyViewed
	err := config.DB.Where(
		"user_id = ? AND record_type = ? AND record_id = ?",
		1, "case", caseRecord.ID,
	).First(&entry).Error
	if err != nil {
		t.Fatalf("expected recently viewed entry to exist: %v", err)
	}
}

func TestLogRecentlyViewedCaseNoDuplicates(t *testing.T) {
	setupCRMTestDB(t)
	router := setupCRMRouterWithUser(1)

	customer := models.Customer{
		FirstName: "NoDup",
		LastName:  "CaseOwner",
		Email:     "nodup.case@example.com",
		Phone:     "9990004444",
	}
	if err := config.DB.Create(&customer).Error; err != nil {
		t.Fatalf("failed to seed customer: %v", err)
	}

	caseRecord := models.Case{
		CaseNumber: "CASE-NODUP-001",
		Status:     "New",
		Subject:    "No duplicate case",
		CustomerID: customer.ID,
	}
	if err := config.DB.Create(&caseRecord).Error; err != nil {
		t.Fatalf("failed to seed case: %v", err)
	}

	url := "/api/recently-viewed/cases/" + itoaUint(caseRecord.ID)

	// Call the endpoint twice
	for i := 0; i < 2; i++ {
		req, _ := http.NewRequest(http.MethodPost, url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("call %d: expected status %d, got %d: %s", i+1, http.StatusOK, w.Code, w.Body.String())
		}
	}

	var entries []models.RecentlyViewed
	config.DB.Where(
		"user_id = ? AND record_type = ? AND record_id = ?",
		1, "case", caseRecord.ID,
	).Find(&entries)

	if len(entries) != 1 {
		t.Fatalf("expected exactly 1 recently viewed entry after 2 calls, got %d", len(entries))
	}
}
