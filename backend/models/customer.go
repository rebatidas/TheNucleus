package models

import "gorm.io/gorm"

type Customer struct {
	gorm.Model
	Salutation      string `json:"salutation"`
	FirstName       string `json:"first_name" binding:"required"`
	MiddleName      string `json:"middle_name"`
	LastName        string `json:"last_name" binding:"required"`
	Email           string `json:"email" binding:"required"`
	Phone           string `json:"phone" binding:"required"`
	ShippingAddress string `json:"shipping_address"`
	BillingAddress  string `json:"billing_address"`
}
