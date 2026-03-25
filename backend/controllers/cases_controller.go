package controllers

import (
	"fmt"
	"net/http"
	"time"

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

	if input.Status == "" {
		input.Status = "New"
	}

	// temporary unique value so insert succeeds
	input.CaseNumber = fmt.Sprintf("TEMP-%d", time.Now().UnixNano())

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// now generate final case number from unique DB ID
	input.CaseNumber = fmt.Sprintf("CASE-%d", input.ID+1000)

	if err := config.DB.Save(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := config.DB.Preload("Customer").First(&input, input.ID).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "Case created successfully",
			"data":    input,
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

func GetCaseByID(c *gin.Context) {
	id := c.Param("id")
	var caseRecord models.Case

	if err := config.DB.Preload("Customer").First(&caseRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Case not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": caseRecord,
	})
}

func UpdateCase(c *gin.Context) {
	id := c.Param("id")
	var caseRecord models.Case

	if err := config.DB.First(&caseRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Case not found",
		})
		return
	}

	var input models.Case
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	caseRecord.Status = input.Status
	caseRecord.Subject = input.Subject
	caseRecord.Description = input.Description
	caseRecord.CustomerID = input.CustomerID
	caseRecord.Resolution = input.Resolution
	caseRecord.LastModifiedBy = input.LastModifiedBy

	if err := config.DB.Save(&caseRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update case",
		})
		return
	}

	if err := config.DB.Preload("Customer").First(&caseRecord, caseRecord.ID).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "Case updated successfully",
			"data":    caseRecord,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Case updated successfully",
		"data":    caseRecord,
	})
}

func DeleteCase(c *gin.Context) {
	id := c.Param("id")
	var caseRecord models.Case

	if err := config.DB.First(&caseRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Case not found",
		})
		return
	}

	if err := config.DB.Delete(&caseRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete case",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Case deleted successfully",
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
