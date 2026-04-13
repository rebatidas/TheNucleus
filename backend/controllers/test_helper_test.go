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
		&models.RecentlyViewed{},
	); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

// setupCRMRouter creates a router without any user context (for unauthenticated tests).
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

// setupCRMRouterWithUser creates a router that injects the given userID into every request context,
// simulating a logged-in user without requiring a real JWT.
func setupCRMRouterWithUser(userID uint) *gin.Engine {
	gin.SetMode(gin.TestMode)

	r := gin.Default()

	injectUser := func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	}

	r.GET("/api/customers", injectUser, GetCustomers)
	r.POST("/api/customers", injectUser, CreateCustomer)
	r.GET("/api/customers/:id", GetCustomerByID)

	r.GET("/api/customer-cases/:customerId", GetCasesByCustomerID)
	r.GET("/api/cases", injectUser, GetCases)
	r.POST("/api/cases", injectUser, CreateCase)

	r.POST("/api/recently-viewed/customers/:id", injectUser, LogRecentlyViewedCustomer)
	r.POST("/api/recently-viewed/cases/:id", injectUser, LogRecentlyViewedCase)

	return r
}

func itoaUint(id uint) string {
	return fmt.Sprintf("%d", id)
}
