package controllers

import (
    "net/http"

    "thenucleus-backend/config"
    "thenucleus-backend/models"

    "github.com/gin-gonic/gin"
)

// CreateQueue creates a new queue record
func CreateQueue(c *gin.Context) {
    var input struct {
        Name string `json:"name" binding:"required"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid input"})
        return
    }

    q := models.Queue{Name: input.Name}
    if err := config.DB.Create(&q).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Could not create queue"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"success": true, "data": q})
}

// ListQueues returns all queues
func ListQueues(c *gin.Context) {
    var queues []models.Queue
    if err := config.DB.Find(&queues).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Could not load queues"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"success": true, "data": queues})
}
