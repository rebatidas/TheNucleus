package controllers

import (
	"errors"
	"net/http"
	"strings"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func getCurrentUserFromToken(c *gin.Context) (*models.User, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return nil, errors.New("missing authorization header")
	}

	tokenString := authHeader
	if strings.HasPrefix(tokenString, "Bearer ") {
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, errors.New("invalid user ID")
	}

	var user models.User
	if err := config.DB.First(&user, uint(userIDFloat)).Error; err != nil {
		return nil, errors.New("user not found")
	}

	return &user, nil
}

func getObjectPermission(profileID *uint, objectName string) *models.ObjectPermission {
	if profileID == nil {
		return nil
	}

	var permission models.ObjectPermission
	err := config.DB.
		Where("profile_id = ? AND object_name = ?", *profileID, objectName).
		First(&permission).Error

	if err != nil {
		return nil
	}

	return &permission
}

func getFieldPermission(profileID *uint, objectName, fieldName string) *models.FieldPermission {
	if profileID == nil {
		return nil
	}

	var permission models.FieldPermission
	err := config.DB.
		Where("profile_id = ? AND object_name = ? AND field_name = ?", *profileID, objectName, fieldName).
		First(&permission).Error

	if err != nil {
		return nil
	}

	return &permission
}

func enforceObjectPermission(c *gin.Context, profileID *uint, objectName string, action string) bool {
	if profileID == nil {
		return true
	}

	permission := getObjectPermission(profileID, objectName)
	if permission == nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You do not have access to this object",
		})
		return false
	}

	allowed := false
	switch action {
	case "view":
		allowed = permission.CanView
	case "create":
		allowed = permission.CanCreate
	case "edit":
		allowed = permission.CanEdit
	case "delete":
		allowed = permission.CanDelete
	}

	if !allowed {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You do not have permission for this action",
		})
		return false
	}

	return true
}

func isFieldReadOnly(profileID *uint, objectName, fieldName string) bool {
	if profileID == nil {
		return false
	}

	permission := getFieldPermission(profileID, objectName, fieldName)
	if permission == nil {
		return false
	}

	return permission.ReadOnly
}

func isFieldVisible(profileID *uint, objectName, fieldName string) bool {
	if profileID == nil {
		return true
	}

	permission := getFieldPermission(profileID, objectName, fieldName)
	if permission == nil {
		return true
	}

	return permission.Visible
}
