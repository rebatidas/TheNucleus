package controllers

import (
	"net/http"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type PermissionSummaryResponse struct {
	ProfileID         *uint                     `json:"profile_id"`
	ObjectPermissions []models.ObjectPermission `json:"object_permissions"`
	FieldPermissions  []models.FieldPermission  `json:"field_permissions"`
}

func GetMyPermissions(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
		return
	}

	tokenString := authHeader
	if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
		tokenString = tokenString[7:]
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		return
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, uint(userIDFloat)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.ProfileID == nil {
		c.JSON(http.StatusOK, gin.H{
			"data": PermissionSummaryResponse{
				ProfileID:         nil,
				ObjectPermissions: []models.ObjectPermission{},
				FieldPermissions:  []models.FieldPermission{},
			},
		})
		return
	}

	var objectPermissions []models.ObjectPermission
	var fieldPermissions []models.FieldPermission

	config.DB.Where("profile_id = ?", *user.ProfileID).Find(&objectPermissions)
	config.DB.Where("profile_id = ?", *user.ProfileID).Find(&fieldPermissions)

	c.JSON(http.StatusOK, gin.H{
		"data": PermissionSummaryResponse{
			ProfileID:         user.ProfileID,
			ObjectPermissions: objectPermissions,
			FieldPermissions:  fieldPermissions,
		},
	})
}
