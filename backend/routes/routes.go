package routes

import (
	"thenucleus-backend/controllers"
	"thenucleus-backend/middleware"

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
		api.GET("/customer-cases/:customerId", controllers.GetCasesByCustomerID)
		api.POST("/cases", controllers.CreateCase)

		// Case routes
		api.GET("/cases", controllers.GetCases)

		// Protected routes (require auth)
		apiAuth := api.Group("/")
		apiAuth.Use(middleware.AuthMiddleware())
		{
			apiAuth.GET("/me", controllers.Me)
			apiAuth.PUT("/me", controllers.UpdateMe)
			apiAuth.GET("/users", controllers.ListUsers)
			apiAuth.POST("/queues", controllers.CreateQueue)
			apiAuth.GET("/queues", controllers.ListQueues)
		}
	}
}
