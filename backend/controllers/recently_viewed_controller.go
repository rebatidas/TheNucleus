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

func GetRecentlyViewedCases(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var recentEntries []models.RecentlyViewed
	config.DB.
		Where("user_id = ? AND record_type = ?", userID, "case").
		Order("viewed_at desc").
		Limit(5).
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
}

func GetRecentlyViewedCustomers(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var recentEntries []models.RecentlyViewed
	config.DB.
		Where("user_id = ? AND record_type = ?", userID, "customer").
		Order("viewed_at desc").
		Limit(5).
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
}
