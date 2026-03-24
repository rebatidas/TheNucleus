package models

import (
	"time"

	"gorm.io/gorm"
)

type Case struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	CaseNumber     string         `json:"case_number" gorm:"uniqueIndex;not null"`
	Status         string         `json:"status"`
	Subject        string         `json:"subject"`
	Description    string         `json:"description"`
	CustomerID     uint           `json:"customer_id"`
	Resolution     string         `json:"resolution"`
	CreatedBy      uint           `json:"created_by"`
	LastModifiedBy uint           `json:"last_modified_by"`
	CreatedAt      time.Time      `json:"created_date"`
	UpdatedAt      time.Time      `json:"last_modified_date"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`

	Customer Customer `json:"customer" gorm:"foreignKey:CustomerID"`
}
