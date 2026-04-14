package controllers

import (
	"net/http"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
)

func GetRoles(c *gin.Context) {
	var roles []models.Role

	if err := config.DB.Order("created_at asc").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch roles",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": roles,
	})
}

func GetRoleByID(c *gin.Context) {
	id := c.Param("id")
	var role models.Role

	if err := config.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": role,
	})
}

func CreateRole(c *gin.Context) {
	var input models.Role

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if input.Label == "" || input.RoleName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Label and Role Name are required",
		})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create role",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role created successfully",
		"data":    input,
	})
}

func UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var role models.Role

	if err := config.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Role not found",
		})
		return
	}

	var input models.Role
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if input.Label == "" || input.RoleName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Label and Role Name are required",
		})
		return
	}

	role.Label = input.Label
	role.RoleName = input.RoleName
	role.ReportsToID = input.ReportsToID

	if err := config.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update role",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role updated successfully",
		"data":    role,
	})
}
