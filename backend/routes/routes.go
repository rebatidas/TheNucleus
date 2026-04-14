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
		api.GET("/customer-cases/:customerId", controllers.GetCasesByCustomerID)
		api.POST("/cases", controllers.CreateCase)

		// Case routes
		api.GET("/cases", controllers.GetCases)
		api.GET("/cases/:id", controllers.GetCaseByID)
		api.PUT("/cases/:id", controllers.UpdateCase)
		api.DELETE("/cases/:id", controllers.DeleteCase)

		api.GET("/company-information", controllers.GetCompanyInformation)
		api.POST("/company-information", controllers.CreateCompanyInformation)
		api.PUT("/company-information", controllers.UpdateCompanyInformation)

		api.GET("/users", controllers.GetUsers)
		api.GET("/users/:id", controllers.GetUserByID)
		api.PUT("/users/:id", controllers.UpdateUser)

		api.GET("/roles", controllers.GetRoles)
		api.GET("/roles/:id", controllers.GetRoleByID)
		api.POST("/roles", controllers.CreateRole)
		api.PUT("/roles/:id", controllers.UpdateRole)
	}
}
