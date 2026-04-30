package models

import "gorm.io/gorm"

type OrgWideDefault struct {
	gorm.Model
	ObjectName  string `json:"object_name" gorm:"not null;unique"`
	AccessLevel string `json:"access_level" gorm:"not null"`
}
