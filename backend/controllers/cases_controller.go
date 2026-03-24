package controllers

import (
	"fmt"
	"net/http"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
)

func generateCaseNumber() string {
	var lastCase models.Case

	err := config.DB.Order("id desc").First(&lastCase).Error
	if err != nil || lastCase.ID == 0 {
		return "CASE-1001"
	}

	return fmt.Sprintf("CASE-%d", lastCase.ID+1001)
}

func CreateCase(c *gin.Context) {
	var input models.Case

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	input.CaseNumber = generateCaseNumber()

	if input.Status == "" {
		input.Status = "New"
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create case",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Case created successfully",
		"data":    input,
	})
}

func GetCases(c *gin.Context) {
	var cases []models.Case

	if err := config.DB.Preload("Customer").Find(&cases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch cases",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": cases,
	})
}

func GetCasesByCustomerID(c *gin.Context) {
	customerID := c.Param("customerId")
	var cases []models.Case

	if err := config.DB.
		Where("customer_id = ?", customerID).
		Find(&cases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch customer cases",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": cases,
	})
}
