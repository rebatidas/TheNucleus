package models

import "gorm.io/gorm"

type CompanyInformation struct {
	gorm.Model
	OrganizationName string `json:"organization_name" gorm:"not null"`
	Website          string `json:"website"`
	Phone            string `json:"phone"`
	Street           string `json:"street"`
	City             string `json:"city"`
	State            string `json:"state"`
	PostalCode       string `json:"postal_code"`
	Country          string `json:"country"`
}
