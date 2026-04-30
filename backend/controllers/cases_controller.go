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
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "create") {
		return
	}

	var caseRecord models.Case

	if err := c.ShouldBindJSON(&caseRecord); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	caseRecord.CreatedBy = user.ID
	caseRecord.OwnerID = user.ID

	if err := config.DB.Create(&caseRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create case"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": caseRecord})
}

func GetCases(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "view") {
		return
	}

	view := c.DefaultQuery("view", "all_cases")

	var cases []models.Case

	query := config.DB.Preload("Customer").Preload("Owner")

	if view == "my_cases" {
		query = query.Where("owner_id = ? OR created_by = ?", user.ID, user.ID)
	}

	if err := query.Find(&cases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cases"})
		return
	}

	// US-16: still apply OWD + role hierarchy security
	cases = filterCasesByRecordAccess(user, cases, "view")

	c.JSON(http.StatusOK, gin.H{"data": cases})
}

func GetCaseByID(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "view") {
		return
	}

	id := c.Param("id")

	var caseRecord models.Case
	if err := config.DB.Preload("Customer").Preload("Owner").First(&caseRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
		return
	}

	if !canAccessCaseRecord(user, &caseRecord, "view") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": caseRecord})
}

func UpdateCase(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "edit") {
		return
	}

	id := c.Param("id")

	var caseRecord models.Case
	if err := config.DB.First(&caseRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
		return
	}

	if !canAccessCaseRecord(user, &caseRecord, "edit") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var input models.Case
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.LastModifiedBy = user.ID

	if err := config.DB.Model(&caseRecord).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update case"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": caseRecord})
}

func DeleteCase(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "delete") {
		return
	}

	id := c.Param("id")

	var caseRecord models.Case
	if err := config.DB.First(&caseRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
		return
	}

	if !canAccessCaseRecord(user, &caseRecord, "delete") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := config.DB.Delete(&caseRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete case"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Case deleted"})
}

func GetCasesByCustomerID(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "view") {
		return
	}

	customerID := c.Param("customerId")
	var cases []models.Case

	if err := config.DB.
		Where("customer_id = ?", customerID).
		Preload("Customer").
		Find(&cases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch customer cases",
		})
		return
	}

	filtered := make([]models.Case, 0, len(cases))
	for _, caseRecord := range cases {
		filtered = append(filtered, filterCaseFields(caseRecord, user.ProfileID))
	}

	c.JSON(http.StatusOK, gin.H{
		"data": filtered,
	})
}

func filterCaseFields(caseRecord models.Case, profileID *uint) models.Case {
	if !isFieldVisible(profileID, "Cases", "case_number") {
		caseRecord.CaseNumber = ""
	}
	if !isFieldVisible(profileID, "Cases", "status") {
		caseRecord.Status = ""
	}
	if !isFieldVisible(profileID, "Cases", "subject") {
		caseRecord.Subject = ""
	}
	if !isFieldVisible(profileID, "Cases", "description") {
		caseRecord.Description = ""
	}
	if !isFieldVisible(profileID, "Cases", "customer_id") {
		caseRecord.CustomerID = 0
		caseRecord.Customer = models.Customer{}
	}
	if !isFieldVisible(profileID, "Cases", "resolution") {
		caseRecord.Resolution = ""
	}

	return caseRecord
}
