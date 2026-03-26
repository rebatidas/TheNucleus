package controllers

import (
	"fmt"
	"testing"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupCRMTestDB(t *testing.T) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Customer{},
		&models.Case{},
	); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

func setupCRMRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)

	r := gin.Default()

	r.GET("/api/customers", GetCustomers)
	r.POST("/api/customers", CreateCustomer)
	r.GET("/api/customers/:id", GetCustomerByID)

	r.GET("/api/customer-cases/:customerId", GetCasesByCustomerID)
	r.GET("/api/cases", GetCases)
	r.POST("/api/cases", CreateCase)

	return r
}

func itoaUint(id uint) string {
	return fmt.Sprintf("%d", id)
}
