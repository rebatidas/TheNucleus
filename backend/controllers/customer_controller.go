package controllers

import (
	"log"
	"net/http"
	"time"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
)

func CreateCustomer(c *gin.Context) {
	var input models.Customer

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("Bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if userID, exists := c.Get("user_id"); exists {
		input.CreatedBy = userID.(uint)
	}

	result := config.DB.Create(&input)
	if result.Error != nil {
		log.Println("Create error:", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer created successfully",
		"data":    input,
	})
}

func GetCustomers(c *gin.Context) {
	view := c.DefaultQuery("view", "all_customers")
	userID, userIDExists := c.Get("user_id")

	switch view {
	case "my_customers":
		if !userIDExists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}
		var customers []models.Customer
		if err := config.DB.Where("created_by = ?", userID).Find(&customers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": customers})

	case "recently_viewed":
		if !userIDExists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}
		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
		var recentEntries []models.RecentlyViewed
		config.DB.
			Where("user_id = ? AND record_type = ? AND viewed_at > ?", userID, "customer", thirtyDaysAgo).
			Order("viewed_at desc").
			Find(&recentEntries)

		if len(recentEntries) == 0 {
			c.JSON(http.StatusOK, gin.H{"data": []models.Customer{}})
			return
		}

		recordIDs := make([]uint, len(recentEntries))
		for i, entry := range recentEntries {
			recordIDs[i] = entry.RecordID
		}

		var customers []models.Customer
		config.DB.Where("id IN ?", recordIDs).Find(&customers)

		// Preserve recently-viewed order
		customerMap := make(map[uint]models.Customer)
		for _, cust := range customers {
			customerMap[cust.ID] = cust
		}
		ordered := make([]models.Customer, 0, len(recordIDs))
		for _, id := range recordIDs {
			if cust, ok := customerMap[id]; ok {
				ordered = append(ordered, cust)
			}
		}
		c.JSON(http.StatusOK, gin.H{"data": ordered})

	default: // "all_customers" or anything else
		var customers []models.Customer
		if err := config.DB.Find(&customers).Error; err != nil {
			log.Println("Fetch customers error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": customers})
	}
}

func GetCustomerByID(c *gin.Context) {
	id := c.Param("id")
	var customer models.Customer

	if err := config.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Customer not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": customer,
	})
}

func UpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	var customer models.Customer

	if err := config.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Customer not found",
		})
		return
	}

	var input models.Customer
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
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
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update customer",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer updated successfully",
		"data":    customer,
	})
}

func DeleteCustomer(c *gin.Context) {
	id := c.Param("id")
	var customer models.Customer

	if err := config.DB.First(&customer, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Customer not found",
		})
		return
	}

	if err := config.DB.Delete(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete customer",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer deleted successfully",
	})
}
