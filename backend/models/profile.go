package models

import "gorm.io/gorm"

type Profile struct {
	gorm.Model
	Name        string `json:"name" gorm:"not null;unique"`
	Description string `json:"description"`
}
