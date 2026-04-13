package routes

import (
	"thenucleus-backend/controllers"
	"thenucleus-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Auth routes (no middleware)
		api.POST("/auth/register", controllers.Register)
		api.POST("/auth/login", controllers.Login)

		// Protected routes
		protected := api.Group("", middleware.AuthRequired())
		{
			// Customer routes
			protected.GET("/customers", controllers.GetCustomers)
			protected.POST("/customers", controllers.CreateCustomer)
			protected.GET("/customers/:id", controllers.GetCustomerByID)
			protected.PUT("/customers/:id", controllers.UpdateCustomer)
			protected.DELETE("/customers/:id", controllers.DeleteCustomer)
			protected.GET("/customer-cases/:customerId", controllers.GetCasesByCustomerID)

			// Case routes
			protected.POST("/cases", controllers.CreateCase)
			protected.GET("/cases", controllers.GetCases)
			protected.GET("/cases/:id", controllers.GetCaseByID)
			protected.PUT("/cases/:id", controllers.UpdateCase)
			protected.DELETE("/cases/:id", controllers.DeleteCase)

			// Recently viewed routes
			protected.POST("/recently-viewed/customers/:id", controllers.LogRecentlyViewedCustomer)
			protected.POST("/recently-viewed/cases/:id", controllers.LogRecentlyViewedCase)

			// Company information routes
			protected.GET("/company-information", controllers.GetCompanyInformation)
			protected.POST("/company-information", controllers.CreateCompanyInformation)
			protected.PUT("/company-information", controllers.UpdateCompanyInformation)

			// User routes
			protected.GET("/users", controllers.GetUsers)
			protected.GET("/users/:id", controllers.GetUserByID)
			protected.PUT("/users/:id", controllers.UpdateUser)
		}
	}
}
