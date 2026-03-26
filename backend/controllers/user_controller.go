package controllers

import (
    "net/http"

    "thenucleus-backend/config"
    "thenucleus-backend/models"

    "github.com/gin-gonic/gin"
)

// Me returns the current logged-in user's basic info (loaded by auth middleware)
func Me(c *gin.Context) {
    // Get user ID from middleware
    uid, ok := c.Get("userID")
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
        return
    }

    userID, ok := uid.(uint)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid user id"})
        return
    }

    var user models.User
    if err := config.DB.First(&user, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "User not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
        "name":       user.Name,
        "email":      user.Email,
        "created_at": user.CreatedAt,
    }})
}

// ListUsers returns all users (without passwords)
func ListUsers(c *gin.Context) {
    var users []models.User
    if err := config.DB.Find(&users).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Could not load users"})
        return
    }

    // Build response without passwords
    out := make([]gin.H, 0, len(users))
    for _, u := range users {
        out = append(out, gin.H{
            "id":         u.ID,
            "name":       u.Name,
            "email":      u.Email,
            "created_at": u.CreatedAt,
        })
    }

    c.JSON(http.StatusOK, gin.H{"success": true, "data": out})
}

// UpdateMe updates the current user's name and email
func UpdateMe(c *gin.Context) {
    // Get user ID from middleware and load from DB
    uid, ok := c.Get("userID")
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
        return
    }

    userID, ok := uid.(uint)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid user id"})
        return
    }

    var current models.User
    if err := config.DB.First(&current, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "User not found"})
        return
    }

    var input struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid input"})
        return
    }

    // Check email uniqueness
    if input.Email != "" {
        var existing models.User
        if err := config.DB.Where("email = ? AND id <> ?", input.Email, current.ID).First(&existing).Error; err == nil {
            c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Email already in use"})
            return
        }
    }

    if input.Name != "" {
        current.Name = input.Name
    }
    if input.Email != "" {
        current.Email = input.Email
    }

    if err := config.DB.Save(current).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Could not update user"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
        "name":       current.Name,
        "email":      current.Email,
        "created_at": current.CreatedAt,
    }})
}
