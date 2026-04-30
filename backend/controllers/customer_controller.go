package controllers

import (
	"net/http"
	"time"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
)

func sanitizeCustomerForRead(customer *models.Customer, profileID *uint) {
	if !isFieldVisible(profileID, "Customers", "salutation") {
		customer.Salutation = ""
	}
	if !isFieldVisible(profileID, "Customers", "first_name") {
		customer.FirstName = ""
	}
	if !isFieldVisible(profileID, "Customers", "middle_name") {
		customer.MiddleName = ""
	}
	if !isFieldVisible(profileID, "Customers", "last_name") {
		customer.LastName = ""
	}
	if !isFieldVisible(profileID, "Customers", "email") {
		customer.Email = ""
	}
	if !isFieldVisible(profileID, "Customers", "phone") {
		customer.Phone = ""
	}
	if !isFieldVisible(profileID, "Customers", "shipping_address") {
		customer.ShippingAddress = ""
	}
	if !isFieldVisible(profileID, "Customers", "billing_address") {
		customer.BillingAddress = ""
	}
}

func sanitizeCustomersForRead(customers []models.Customer, profileID *uint) []models.Customer {
	for i := range customers {
		sanitizeCustomerForRead(&customers[i], profileID)
	}
	return customers
}

func CreateCustomer(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Customers", "create") {
		return
	}

	var customer models.Customer
	if err := c.ShouldBindJSON(&customer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customer.CreatedBy = user.ID
	customer.OwnerID = user.ID

	if err := config.DB.Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
		return
	}

	sanitizeCustomerForRead(&customer, user.ProfileID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Customer created successfully",
		"data":    customer,
	})
}

func GetCustomers(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Customers", "view") {
		return
	}

	view := c.DefaultQuery("view", "all_customers")

	var customers []models.Customer

	switch view {
	case "my_customers":
		if err := config.DB.
			Preload("Owner").
			Where("owner_id = ? OR created_by = ?", user.ID, user.ID).
			Find(&customers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers"})
			return
		}

	case "recently_viewed":
		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

		var recentEntries []models.RecentlyViewed
		if err := config.DB.
			Where("user_id = ? AND record_type = ? AND viewed_at > ?", user.ID, "customer", thirtyDaysAgo).
			Order("viewed_at desc").
			Find(&recentEntries).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recently viewed customers"})
			return
		}

		if len(recentEntries) == 0 {
			c.JSON(http.StatusOK, gin.H{"data": []models.Customer{}})
			return
		}

		recordIDs := make([]uint, len(recentEntries))
		for i, entry := range recentEntries {
			recordIDs[i] = entry.RecordID
		}

		var foundCustomers []models.Customer
		if err := config.DB.
			Preload("Owner").
			Where("id IN ?", recordIDs).
			Find(&foundCustomers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recently viewed customers"})
			return
		}

		customerMap := make(map[uint]models.Customer)
		for _, customer := range foundCustomers {
			customerMap[customer.ID] = customer
		}

		for _, id := range recordIDs {
			if customer, ok := customerMap[id]; ok {
				customers = append(customers, customer)
			}
		}

	default:
		if err := config.DB.
			Preload("Owner").
			Find(&customers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch customers"})
			return
		}
	}

	customers = filterCustomersByRecordAccess(user, customers, "view")
	customers = sanitizeCustomersForRead(customers, user.ProfileID)

	c.JSON(http.StatusOK, gin.H{"data": customers})
}

func GetCustomerByID(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Customers", "view") {
		return
	}

	id := c.Param("id")

	var customer models.Customer
	if err := config.DB.Preload("Owner").First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	if !canAccessCustomerRecord(user, &customer, "view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	sanitizeCustomerForRead(&customer, user.ProfileID)

	c.JSON(http.StatusOK, gin.H{"data": customer})
}

func UpdateCustomer(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Customers", "edit") {
		return
	}

	id := c.Param("id")

	var customer models.Customer
	if err := config.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	if !canAccessCustomerRecord(user, &customer, "edit") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var input models.Customer
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	customer.Salutation = input.Salutation
	customer.FirstName = input.FirstName
	customer.MiddleName = input.MiddleName
	customer.LastName = input.LastName
	customer.Email = input.Email
	customer.Phone = input.Phone
	customer.ShippingAddress = input.ShippingAddress
	customer.BillingAddress = input.BillingAddress

	if err := config.DB.Save(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update customer"})
		return
	}

	sanitizeCustomerForRead(&customer, user.ProfileID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer updated successfully",
		"data":    customer,
	})
}

func DeleteCustomer(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Customers", "delete") {
		return
	}

	id := c.Param("id")

	var customer models.Customer
	if err := config.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	if !canAccessCustomerRecord(user, &customer, "delete") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := config.DB.Delete(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete customer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
}
