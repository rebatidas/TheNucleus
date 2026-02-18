package main

import (
	"time"

	"thenucleus-backend/config"
	"thenucleus-backend/models"
	"thenucleus-backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Gin
	r := gin.Default()

	// 🔥 CORS Configuration (Frontend Integration Fix)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Connect to Database
	config.ConnectDB()

	// Auto migrate models
	config.DB.AutoMigrate(&models.User{})

	// Setup routes
	routes.SetupRoutes(r)

	// Health check route
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"success": true,
			"message": "TheNucleus Backend Running",
		})
	})

	// Start server
	r.Run(":8080")
}
