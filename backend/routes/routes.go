package routes

import (
	"thenucleus-backend/controllers"
	"thenucleus-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
<<<<<<< HEAD
		// Auth routes (no middleware)
=======
		// Auth
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
		api.POST("/auth/register", controllers.Register)
		api.POST("/auth/login", controllers.Login)
		api.GET("/auth/me-permissions", controllers.GetMyPermissions)

<<<<<<< HEAD
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
			protected.GET("/recently-viewed/cases", controllers.GetRecentlyViewedCases)
			protected.GET("/recently-viewed/customers", controllers.GetRecentlyViewedCustomers)

			// Company information routes
			protected.GET("/company-information", controllers.GetCompanyInformation)
			protected.POST("/company-information", controllers.CreateCompanyInformation)
			protected.PUT("/company-information", controllers.UpdateCompanyInformation)

			// User routes
			protected.GET("/users", controllers.GetUsers)
			protected.GET("/users/:id", controllers.GetUserByID)
			protected.PUT("/users/:id", controllers.UpdateUser)

			// Role routes
			protected.GET("/roles", controllers.GetRoles)
			protected.GET("/roles/:id", controllers.GetRoleByID)
			protected.POST("/roles", controllers.CreateRole)
			protected.PUT("/roles/:id", controllers.UpdateRole)
		}
=======
		// Customers
		api.GET("/customers", controllers.GetCustomers)
		api.POST("/customers", controllers.CreateCustomer)
		api.GET("/customers/:id", controllers.GetCustomerByID)
		api.PUT("/customers/:id", controllers.UpdateCustomer)
		api.DELETE("/customers/:id", controllers.DeleteCustomer)

		// Cases
		api.GET("/customer-cases/:customerId", controllers.GetCasesByCustomerID)
		api.POST("/cases", controllers.CreateCase)
		api.GET("/cases", controllers.GetCases)
		api.GET("/cases/:id", controllers.GetCaseByID)
		api.PUT("/cases/:id", controllers.UpdateCase)
		api.DELETE("/cases/:id", controllers.DeleteCase)

		// Company Information
		api.GET("/company-information", controllers.GetCompanyInformation)
		api.POST("/company-information", controllers.CreateCompanyInformation)
		api.PUT("/company-information", controllers.UpdateCompanyInformation)

		// Users
		api.GET("/users", controllers.GetUsers)
		api.GET("/users/:id", controllers.GetUserByID)
		api.PUT("/users/:id", controllers.UpdateUser)

		// Roles
		api.GET("/roles", controllers.GetRoles)
		api.GET("/roles/:id", controllers.GetRoleByID)
		api.POST("/roles", controllers.CreateRole)
		api.PUT("/roles/:id", controllers.UpdateRole)

		// Profiles
		api.GET("/profiles", controllers.GetProfiles)
		api.POST("/profiles", controllers.CreateProfile)
		api.GET("/profiles/:id", controllers.GetProfileByID)
		api.PUT("/profiles/:id", controllers.UpdateProfile)
		api.DELETE("/profiles/:id", controllers.DeleteProfile)
		api.PUT("/profiles/:id/object-permissions", controllers.UpsertObjectPermissions)
		api.PUT("/profiles/:id/field-permissions", controllers.UpsertFieldPermissions)
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
	}
}
