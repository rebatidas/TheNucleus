package controllers

import (
	"net/http"
	"strconv"
	"time"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
)

func upsertRecentlyViewed(userID uint, recordType string, recordID uint) {
	config.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{
			{Name: "user_id"},
			{Name: "record_type"},
			{Name: "record_id"},
		},
		DoUpdates: clause.AssignmentColumns([]string{"viewed_at"}),
	}).Create(&models.RecentlyViewed{
		UserID:     userID,
		RecordType: recordType,
		RecordID:   recordID,
		ViewedAt:   time.Now(),
	})
}

func LogRecentlyViewedCustomer(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	recordID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid customer ID"})
		return
	}

	upsertRecentlyViewed(userID.(uint), "customer", uint(recordID))
	c.JSON(http.StatusOK, gin.H{"message": "Logged"})
}

func LogRecentlyViewedCase(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	recordID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case ID"})
		return
	}

	upsertRecentlyViewed(userID.(uint), "case", uint(recordID))
	c.JSON(http.StatusOK, gin.H{"message": "Logged"})
}
