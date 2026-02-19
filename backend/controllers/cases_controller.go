package controllers

import (
    "net/http"

    "thenucleus-backend/config"
    "thenucleus-backend/models"

    "github.com/gin-gonic/gin"
)

func GetCases(c *gin.Context) {
    userIDVal, ok := c.Get("userID")
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
        return
    }

    userID := userIDVal.(uint)

    var cases []models.Case
    if err := config.DB.Where("user_id = ?", userID).Find(&cases).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch cases"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"cases": cases}})
}
