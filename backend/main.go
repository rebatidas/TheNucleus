package main

import (
	"thenucleus-backend/config"
	"thenucleus-backend/models"
	"thenucleus-backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {

	r := gin.Default()

	// Connect Database
	config.ConnectDB()

	// Auto Migrate
	config.DB.AutoMigrate(&models.User{})

	// Setup Routes
	routes.SetupRoutes(r)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "TheNucleus Backend Running"})
	})

	r.Run(":8080")
}