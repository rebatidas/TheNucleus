package models

import "gorm.io/gorm"

type FieldPermission struct {
	gorm.Model
	ProfileID  uint   `json:"profile_id" gorm:"not null;index"`
	ObjectName string `json:"object_name" gorm:"not null;index"`
	FieldName  string `json:"field_name" gorm:"not null;index"`

	Visible  bool `json:"visible"`
	ReadOnly bool `json:"read_only"`
}
