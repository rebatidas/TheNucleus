package controllers

import (
	"log"
	"net/http"

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
	var customers []models.Customer

	result := config.DB.Find(&customers)
	if result.Error != nil {
		log.Println("Fetch customers error:", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": result.Error.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": customers,
	})
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
