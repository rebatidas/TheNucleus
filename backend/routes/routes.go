package routes

import (
	"thenucleus-backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	api := r.Group("/api")
	{
		api.POST("/auth/register", controllers.Register)
		api.POST("/auth/login", controllers.Login)
		api.POST("/customers", controllers.CreateCustomer)
		// /api/cases is public (no middleware)
		api.GET("/cases", controllers.GetCases)
	}
}
