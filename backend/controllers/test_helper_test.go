package controllers

import (
	"fmt"
	"testing"
	"time"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

func setupCRMTestDB(t *testing.T) {
	t.Helper()

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())

	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Profile{},
		&models.ObjectPermission{},
		&models.FieldPermission{},
		&models.Customer{},
		&models.Case{},
		&models.CompanyInformation{},
		&models.RecentlyViewed{},
		&models.OrgWideDefault{},
	)
	if err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	config.DB = db
}

func setupCRMRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)

	r := gin.Default()

	r.GET("/api/auth/me-permissions", GetMyPermissions)

	r.GET("/api/profiles", GetProfiles)
	r.POST("/api/profiles", CreateProfile)
	r.GET("/api/profiles/:id", GetProfileByID)
	r.PUT("/api/profiles/:id", UpdateProfile)
	r.DELETE("/api/profiles/:id", DeleteProfile)
	r.PUT("/api/profiles/:id/object-permissions", UpsertObjectPermissions)
	r.PUT("/api/profiles/:id/field-permissions", UpsertFieldPermissions)

	r.GET("/api/customers", GetCustomers)
	r.POST("/api/customers", CreateCustomer)
	r.GET("/api/customers/:id", GetCustomerByID)
	r.PUT("/api/customers/:id", UpdateCustomer)
	r.DELETE("/api/customers/:id", DeleteCustomer)

	r.GET("/api/cases", GetCases)
	r.POST("/api/cases", CreateCase)
	r.GET("/api/cases/:id", GetCaseByID)
	r.PUT("/api/cases/:id", UpdateCase)
	r.DELETE("/api/cases/:id", DeleteCase)
	r.GET("/api/customer-cases/:customerId", GetCasesByCustomerID)

	r.POST("/api/recently-viewed/customers/:id", LogRecentlyViewedCustomer)
	r.POST("/api/recently-viewed/cases/:id", LogRecentlyViewedCase)
	r.GET("/api/recently-viewed/customers", GetRecentlyViewedCustomers)
	r.GET("/api/recently-viewed/cases", GetRecentlyViewedCases)

	r.GET("/api/org-wide-defaults", GetOrgWideDefaults)
	r.PUT("/api/org-wide-defaults", UpsertOrgWideDefaults)

	return r
}

func setupCRMRouterWithUser(userID uint) *gin.Engine {
	gin.SetMode(gin.TestMode)

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})

	r.POST("/api/recently-viewed/customers/:id", LogRecentlyViewedCustomer)
	r.POST("/api/recently-viewed/cases/:id", LogRecentlyViewedCase)
	r.GET("/api/recently-viewed/customers", GetRecentlyViewedCustomers)
	r.GET("/api/recently-viewed/cases", GetRecentlyViewedCases)

	return r
}

func itoaUint(id uint) string {
	return fmt.Sprintf("%d", id)
}

func seedUserWithProfile(t *testing.T, profileName string) (models.User, models.Profile) {
	t.Helper()

	profile := models.Profile{
		Name:        profileName,
		Description: "test profile",
	}
	if err := config.DB.Create(&profile).Error; err != nil {
		t.Fatalf("failed to create profile: %v", err)
	}

	user := models.User{
		FirstName: "Test",
		LastName:  "User",
		Username:  fmt.Sprintf("%s_user", profileName),
		Name:      "Test User",
		Email:     fmt.Sprintf("%s@test.com", profileName),
		Password:  "hashed-password",
		ProfileID: &profile.ID,
	}
	if err := config.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	return user, profile
}

func seedUserWithRoleAndProfile(t *testing.T, username string, roleID *uint) (models.User, models.Profile) {
	t.Helper()

	profile := models.Profile{
		Name:        username + "_profile",
		Description: "test profile",
	}
	if err := config.DB.Create(&profile).Error; err != nil {
		t.Fatalf("failed to create profile: %v", err)
	}

	user := models.User{
		FirstName: "Test",
		LastName:  username,
		Username:  username,
		Name:      "Test " + username,
		Email:     username + "@test.com",
		Password:  "hashed-password",
		RoleID:    roleID,
		ProfileID: &profile.ID,
	}
	if err := config.DB.Create(&user).Error; err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	return user, profile
}

func grantObjectPermission(t *testing.T, profileID uint, objectName string, view, create, edit, delete bool) {
	t.Helper()

	record := models.ObjectPermission{
		ProfileID:  profileID,
		ObjectName: objectName,
		CanView:    view,
		CanCreate:  create,
		CanEdit:    edit,
		CanDelete:  delete,
	}

	if err := config.DB.Create(&record).Error; err != nil {
		t.Fatalf("failed to create object permission: %v", err)
	}
}

func grantFieldPermission(t *testing.T, profileID uint, objectName, fieldName string, visible, readOnly bool) {
	t.Helper()

	record := models.FieldPermission{
		ProfileID:  profileID,
		ObjectName: objectName,
		FieldName:  fieldName,
		Visible:    visible,
		ReadOnly:   readOnly,
	}

	if err := config.DB.Create(&record).Error; err != nil {
		t.Fatalf("failed to create field permission: %v", err)
	}
}

func seedOWD(t *testing.T, objectName string, accessLevel string) {
	t.Helper()

	if err := config.DB.Create(&models.OrgWideDefault{
		ObjectName:  objectName,
		AccessLevel: accessLevel,
	}).Error; err != nil {
		t.Fatalf("failed to seed OWD: %v", err)
	}
}

func makeAuthToken(t *testing.T, userID uint) string {
	t.Helper()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour).Unix(),
	})

	signed, err := token.SignedString(jwtSecret)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	return signed
}
