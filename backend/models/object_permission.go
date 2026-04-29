package models

import "gorm.io/gorm"

type ObjectPermission struct {
	gorm.Model
	ProfileID  uint   `json:"profile_id" gorm:"not null;index"`
	ObjectName string `json:"object_name" gorm:"not null;index"`

	CanView   bool `json:"can_view"`
	CanCreate bool `json:"can_create"`
	CanEdit   bool `json:"can_edit"`
	CanDelete bool `json:"can_delete"`
}
