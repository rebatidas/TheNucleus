package controllers

import (
	"net/http"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
)

type OrgWideDefaultInput struct {
	ObjectName  string `json:"object_name"`
	AccessLevel string `json:"access_level"`
}

func GetOrgWideDefaults(c *gin.Context) {
	records := seedMissingOrgWideDefaults()
	c.JSON(http.StatusOK, gin.H{"data": records})
}

func UpsertOrgWideDefaults(c *gin.Context) {
	user, err := getCurrentUserFromToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if !enforceObjectPermission(c, user.ProfileID, "Company Information", "edit") {
		return
	}

	var input []OrgWideDefaultInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	allowedObjects := map[string]bool{
		"Customers": true,
		"Cases":     true,
	}

	for _, item := range input {
		if !allowedObjects[item.ObjectName] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported object: " + item.ObjectName})
			return
		}

		if !isValidOrgWideDefaultAccessLevel(item.AccessLevel) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid access level: " + item.AccessLevel})
			return
		}

		var existing models.OrgWideDefault
		err := config.DB.Where("object_name = ?", item.ObjectName).First(&existing).Error

		if err != nil {
			if err := config.DB.Create(&models.OrgWideDefault{
				ObjectName:  item.ObjectName,
				AccessLevel: item.AccessLevel,
			}).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save org-wide defaults"})
				return
			}
			continue
		}

		existing.AccessLevel = item.AccessLevel

		if err := config.DB.Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save org-wide defaults"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Org-wide defaults updated successfully",
		"data":    seedMissingOrgWideDefaults(),
	})
}

func seedMissingOrgWideDefaults() []models.OrgWideDefault {
	defaults := []models.OrgWideDefault{
		{ObjectName: "Customers", AccessLevel: OWDPublicReadWrite},
		{ObjectName: "Cases", AccessLevel: OWDPublicReadWrite},
	}

	for _, d := range defaults {
		var existing models.OrgWideDefault
		if err := config.DB.Where("object_name = ?", d.ObjectName).First(&existing).Error; err != nil {
			_ = config.DB.Create(&d).Error
		}
	}

	var records []models.OrgWideDefault
	_ = config.DB.Order("object_name asc").Find(&records).Error
	return records
}
