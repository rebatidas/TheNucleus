package models

import "gorm.io/gorm"

type Role struct {
	gorm.Model
	Label       string `json:"label" gorm:"not null"`
	RoleName    string `json:"role_name" gorm:"not null;unique"`
	ReportsToID *uint  `json:"reports_to_id"`
}
