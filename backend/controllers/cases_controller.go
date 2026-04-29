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
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "create") {
		return
	}

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

<<<<<<< HEAD
	if userID, exists := c.Get("user_id"); exists {
		input.CreatedBy = userID.(uint)
		input.LastModifiedBy = userID.(uint)
	}

	// temporary unique value so insert succeeds
=======
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
	input.CaseNumber = fmt.Sprintf("TEMP-%d", time.Now().UnixNano())

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	input.CaseNumber = fmt.Sprintf("CASE-%d", input.ID+1000)

	if err := config.DB.Save(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	_ = config.DB.Preload("Customer").First(&input, input.ID).Error

	c.JSON(http.StatusOK, gin.H{
		"message": "Case created successfully",
		"data":    filterCaseFields(input, user.ProfileID),
	})
}

func GetCases(c *gin.Context) {
<<<<<<< HEAD
	view := c.DefaultQuery("view", "all_cases")
	userID, userIDExists := c.Get("user_id")
=======
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "view") {
		return
	}

	var cases []models.Case
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

	switch view {
	case "my_cases":
		if !userIDExists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}
		var cases []models.Case
		if err := config.DB.Preload("Customer").Where("created_by = ?", userID).Find(&cases).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cases"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": cases})

	case "recently_viewed":
		if !userIDExists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}
		thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
		var recentEntries []models.RecentlyViewed
		config.DB.
			Where("user_id = ? AND record_type = ? AND viewed_at > ?", userID, "case", thirtyDaysAgo).
			Order("viewed_at desc").
			Find(&recentEntries)

		if len(recentEntries) == 0 {
			c.JSON(http.StatusOK, gin.H{"data": []models.Case{}})
			return
		}

		recordIDs := make([]uint, len(recentEntries))
		for i, entry := range recentEntries {
			recordIDs[i] = entry.RecordID
		}

		var cases []models.Case
		config.DB.Preload("Customer").Where("id IN ?", recordIDs).Find(&cases)

		// Preserve recently-viewed order
		caseMap := make(map[uint]models.Case)
		for _, cs := range cases {
			caseMap[cs.ID] = cs
		}
		ordered := make([]models.Case, 0, len(recordIDs))
		for _, id := range recordIDs {
			if cs, ok := caseMap[id]; ok {
				ordered = append(ordered, cs)
			}
		}
		c.JSON(http.StatusOK, gin.H{"data": ordered})

	default: // "all_cases" or anything else
		var cases []models.Case
		if err := config.DB.Preload("Customer").Find(&cases).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch cases",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": cases})
	}
<<<<<<< HEAD
=======

	filtered := make([]models.Case, 0, len(cases))
	for _, caseRecord := range cases {
		filtered = append(filtered, filterCaseFields(caseRecord, user.ProfileID))
	}

	c.JSON(http.StatusOK, gin.H{
		"data": filtered,
	})
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
}

func GetCaseByID(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "view") {
		return
	}

	id := c.Param("id")
	var caseRecord models.Case

	if err := config.DB.Preload("Customer").First(&caseRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Case not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": filterCaseFields(caseRecord, user.ProfileID),
	})
}

func UpdateCase(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "edit") {
		return
	}

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

<<<<<<< HEAD
	caseRecord.Status = input.Status
	caseRecord.Subject = input.Subject
	caseRecord.Description = input.Description
	caseRecord.CustomerID = input.CustomerID
	caseRecord.Resolution = input.Resolution

	if userID, exists := c.Get("user_id"); exists {
		caseRecord.LastModifiedBy = userID.(uint)
	}
=======
	if !isFieldReadOnly(user.ProfileID, "Cases", "status") {
		caseRecord.Status = input.Status
	}
	if !isFieldReadOnly(user.ProfileID, "Cases", "subject") {
		caseRecord.Subject = input.Subject
	}
	if !isFieldReadOnly(user.ProfileID, "Cases", "description") {
		caseRecord.Description = input.Description
	}
	if !isFieldReadOnly(user.ProfileID, "Cases", "customer_id") {
		caseRecord.CustomerID = input.CustomerID
	}
	if !isFieldReadOnly(user.ProfileID, "Cases", "resolution") {
		caseRecord.Resolution = input.Resolution
	}

	caseRecord.LastModifiedBy = input.LastModifiedBy
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

	if err := config.DB.Save(&caseRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update case",
		})
		return
	}

	_ = config.DB.Preload("Customer").First(&caseRecord, caseRecord.ID).Error

	c.JSON(http.StatusOK, gin.H{
		"message": "Case updated successfully",
		"data":    filterCaseFields(caseRecord, user.ProfileID),
	})
}

func DeleteCase(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Cases", "delete") {
		return
	}

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
