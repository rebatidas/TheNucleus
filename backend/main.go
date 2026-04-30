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
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	config.ConnectDB()

	config.DB.AutoMigrate(
		&models.User{},
		&models.Customer{},
		&models.Case{},
		&models.Queue{},
		&models.CompanyInformation{},
		&models.RecentlyViewed{},
		&models.Role{},
		&models.Profile{},
		&models.ObjectPermission{},
		&models.FieldPermission{},
		&models.OrgWideDefault{},
	)

	routes.SetupRoutes(r)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"success": true, "message": "TheNucleus Backend Running"})
	})

	r.Run(":8080")
}
