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

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupCompanyInfoTestDB(t *testing.T) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	if err := db.AutoMigrate(&models.CompanyInformation{}); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

func setupCompanyInfoRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.GET("/api/company-information", GetCompanyInformation)
	r.POST("/api/company-information", CreateCompanyInformation)
	r.PUT("/api/company-information", UpdateCompanyInformation)
	return r
}

func TestGetCompanyInformationReturnsNilWhenMissing(t *testing.T) {
	setupCompanyInfoTestDB(t)
	router := setupCompanyInfoRouter()

	req, _ := http.NewRequest(http.MethodGet, "/api/company-information", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if _, exists := response["data"]; !exists {
		t.Fatalf("expected response to include data")
	}

	if response["data"] != nil {
		t.Fatalf("expected data to be nil when no company information exists")
	}
}

func TestCreateCompanyInformationSuccess(t *testing.T) {
	setupCompanyInfoTestDB(t)
	router := setupCompanyInfoRouter()

	body := map[string]interface{}{
		"organization_name": "University of Florida Foundation",
		"website":           "https://example.org",
		"phone":             "1234567890",
		"city":              "Gainesville",
		"state":             "FL",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/company-information", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var company models.CompanyInformation
	err := config.DB.First(&company).Error
	if err != nil {
		t.Fatalf("expected company information to be created, got error: %v", err)
	}

	if company.OrganizationName != "University of Florida Foundation" {
		t.Fatalf("expected organization name to be saved")
	}
}

func TestCreateCompanyInformationRejectedWhenAlreadyExists(t *testing.T) {
	setupCompanyInfoTestDB(t)
	router := setupCompanyInfoRouter()

	existing := models.CompanyInformation{
		OrganizationName: "Existing Company",
	}
	if err := config.DB.Create(&existing).Error; err != nil {
		t.Fatalf("failed to seed company information: %v", err)
	}

	body := map[string]interface{}{
		"organization_name": "Another Company",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPost, "/api/company-information", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusConflict, w.Code, w.Body.String())
	}
}

func TestUpdateCompanyInformationSuccess(t *testing.T) {
	setupCompanyInfoTestDB(t)
	router := setupCompanyInfoRouter()

	existing := models.CompanyInformation{
		OrganizationName: "Old Company",
		Website:          "https://old.example.com",
	}
	if err := config.DB.Create(&existing).Error; err != nil {
		t.Fatalf("failed to seed company information: %v", err)
	}

	body := map[string]interface{}{
		"organization_name": "New Company",
		"website":           "https://new.example.com",
		"phone":             "9999999999",
		"country":           "USA",
	}

	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPut, "/api/company-information", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d, body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	var updated models.CompanyInformation
	if err := config.DB.First(&updated).Error; err != nil {
		t.Fatalf("failed to fetch updated company information: %v", err)
	}

	if updated.OrganizationName != "New Company" {
		t.Fatalf("expected updated organization name, got %s", updated.OrganizationName)
	}

	if updated.Phone != "9999999999" {
		t.Fatalf("expected updated phone, got %s", updated.Phone)
	}
}
