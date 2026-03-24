package routes

import (
	"thenucleus-backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Auth routes
		api.POST("/auth/register", controllers.Register)
		api.POST("/auth/login", controllers.Login)

		// Customer routes
		api.GET("/customers", controllers.GetCustomers)
		api.POST("/customers", controllers.CreateCustomer)
		api.GET("/customers/:id", controllers.GetCustomerByID)
		api.PUT("/customers/:id", controllers.UpdateCustomer)
		api.DELETE("/customers/:id", controllers.DeleteCustomer)
		api.GET("/customers/:customerId/cases", controllers.GetCasesByCustomerID)
		api.POST("/cases", controllers.CreateCase)

		// Case routes
		api.GET("/cases", controllers.GetCases)
	}
}
