package controllers

import (
	"net/http"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
)

type ObjectPermissionInput struct {
	ObjectName string `json:"object_name"`
	CanView    bool   `json:"can_view"`
	CanCreate  bool   `json:"can_create"`
	CanEdit    bool   `json:"can_edit"`
	CanDelete  bool   `json:"can_delete"`
}

type FieldPermissionInput struct {
	ObjectName string `json:"object_name"`
	FieldName  string `json:"field_name"`
	Visible    bool   `json:"visible"`
	ReadOnly   bool   `json:"read_only"`
}

type ProfileDetailResponse struct {
	Profile           models.Profile            `json:"profile"`
	ObjectPermissions []models.ObjectPermission `json:"object_permissions"`
	FieldPermissions  []models.FieldPermission  `json:"field_permissions"`
}

func GetProfiles(c *gin.Context) {
	var profiles []models.Profile

	if err := config.DB.Order("name asc").Find(&profiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch profiles",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": profiles,
	})
}

func CreateProfile(c *gin.Context) {
	var input models.Profile

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if input.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Profile name is required",
		})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create profile",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile created successfully",
		"data":    input,
	})
}

func GetProfileByID(c *gin.Context) {
	id := c.Param("id")

	var profile models.Profile
	if err := config.DB.First(&profile, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Profile not found",
		})
		return
	}

	var objectPermissions []models.ObjectPermission
	var fieldPermissions []models.FieldPermission

	config.DB.Where("profile_id = ?", profile.ID).Order("object_name asc").Find(&objectPermissions)
	config.DB.Where("profile_id = ?", profile.ID).Order("object_name asc, field_name asc").Find(&fieldPermissions)

	c.JSON(http.StatusOK, gin.H{
		"data": ProfileDetailResponse{
			Profile:           profile,
			ObjectPermissions: objectPermissions,
			FieldPermissions:  fieldPermissions,
		},
	})
}

func UpdateProfile(c *gin.Context) {
	id := c.Param("id")

	var profile models.Profile
	if err := config.DB.First(&profile, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Profile not found",
		})
		return
	}

	var input models.Profile
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if input.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Profile name is required",
		})
		return
	}

	profile.Name = input.Name
	profile.Description = input.Description

	if err := config.DB.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update profile",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"data":    profile,
	})
}

func DeleteProfile(c *gin.Context) {
	id := c.Param("id")

	var profile models.Profile
	if err := config.DB.First(&profile, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Profile not found",
		})
		return
	}

	if err := config.DB.Where("profile_id = ?", profile.ID).Delete(&models.ObjectPermission{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete object permissions",
		})
		return
	}

	if err := config.DB.Where("profile_id = ?", profile.ID).Delete(&models.FieldPermission{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete field permissions",
		})
		return
	}

	if err := config.DB.Model(&models.User{}).
		Where("profile_id = ?", profile.ID).
		Update("profile_id", nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to unassign profile from users",
		})
		return
	}

	if err := config.DB.Delete(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete profile",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile deleted successfully",
	})
}

func UpsertObjectPermissions(c *gin.Context) {
	id := c.Param("id")

	var profile models.Profile
	if err := config.DB.First(&profile, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Profile not found",
		})
		return
	}

	var input []ObjectPermissionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	for _, item := range input {
		var existing models.ObjectPermission
		err := config.DB.Where("profile_id = ? AND object_name = ?", profile.ID, item.ObjectName).First(&existing).Error

		if err == nil {
			existing.CanView = item.CanView
			existing.CanCreate = item.CanCreate
			existing.CanEdit = item.CanEdit
			existing.CanDelete = item.CanDelete
			config.DB.Save(&existing)
		} else {
			newPermission := models.ObjectPermission{
				ProfileID:  profile.ID,
				ObjectName: item.ObjectName,
				CanView:    item.CanView,
				CanCreate:  item.CanCreate,
				CanEdit:    item.CanEdit,
				CanDelete:  item.CanDelete,
			}
			config.DB.Create(&newPermission)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Object permissions updated successfully",
	})
}

func UpsertFieldPermissions(c *gin.Context) {
	id := c.Param("id")

	var profile models.Profile
	if err := config.DB.First(&profile, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Profile not found",
		})
		return
	}

	var input []FieldPermissionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	for _, item := range input {
		var existing models.FieldPermission
		err := config.DB.Where(
			"profile_id = ? AND object_name = ? AND field_name = ?",
			profile.ID,
			item.ObjectName,
			item.FieldName,
		).First(&existing).Error

		if err == nil {
			existing.Visible = item.Visible
			existing.ReadOnly = item.ReadOnly
			config.DB.Save(&existing)
		} else {
			newPermission := models.FieldPermission{
				ProfileID:  profile.ID,
				ObjectName: item.ObjectName,
				FieldName:  item.FieldName,
				Visible:    item.Visible,
				ReadOnly:   item.ReadOnly,
			}
			config.DB.Create(&newPermission)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Field permissions updated successfully",
	})
}
