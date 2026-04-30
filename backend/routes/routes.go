package routes

import (
	"thenucleus-backend/controllers"
	"thenucleus-backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/auth/register", controllers.Register)
		api.POST("/auth/login", controllers.Login)
		api.GET("/auth/me-permissions", controllers.GetMyPermissions)

		protected := api.Group("", middleware.AuthRequired())
		{
			protected.GET("/customers", controllers.GetCustomers)
			protected.POST("/customers", controllers.CreateCustomer)
			protected.GET("/customers/:id", controllers.GetCustomerByID)
			protected.PUT("/customers/:id", controllers.UpdateCustomer)
			protected.DELETE("/customers/:id", controllers.DeleteCustomer)

			protected.GET("/customer-cases/:customerId", controllers.GetCasesByCustomerID)

			protected.GET("/cases", controllers.GetCases)
			protected.POST("/cases", controllers.CreateCase)
			protected.GET("/cases/:id", controllers.GetCaseByID)
			protected.PUT("/cases/:id", controllers.UpdateCase)
			protected.DELETE("/cases/:id", controllers.DeleteCase)

			protected.POST("/recently-viewed/customers/:id", controllers.LogRecentlyViewedCustomer)
			protected.POST("/recently-viewed/cases/:id", controllers.LogRecentlyViewedCase)
			protected.GET("/recently-viewed/cases", controllers.GetRecentlyViewedCases)
			protected.GET("/recently-viewed/customers", controllers.GetRecentlyViewedCustomers)

			protected.GET("/company-information", controllers.GetCompanyInformation)
			protected.POST("/company-information", controllers.CreateCompanyInformation)
			protected.PUT("/company-information", controllers.UpdateCompanyInformation)

			protected.GET("/users", controllers.GetUsers)
			protected.GET("/users/:id", controllers.GetUserByID)
			protected.PUT("/users/:id", controllers.UpdateUser)

			protected.GET("/roles", controllers.GetRoles)
			protected.GET("/roles/:id", controllers.GetRoleByID)
			protected.POST("/roles", controllers.CreateRole)
			protected.PUT("/roles/:id", controllers.UpdateRole)

			protected.GET("/profiles", controllers.GetProfiles)
			protected.POST("/profiles", controllers.CreateProfile)
			protected.GET("/profiles/:id", controllers.GetProfileByID)
			protected.PUT("/profiles/:id", controllers.UpdateProfile)
			protected.DELETE("/profiles/:id", controllers.DeleteProfile)
			protected.PUT("/profiles/:id/object-permissions", controllers.UpsertObjectPermissions)
			protected.PUT("/profiles/:id/field-permissions", controllers.UpsertFieldPermissions)

			protected.GET("/org-wide-defaults", controllers.GetOrgWideDefaults)
			protected.PUT("/org-wide-defaults", controllers.UpsertOrgWideDefaults)
		}
	}
}
