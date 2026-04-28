package models

import "time"

type RecentlyViewed struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"uniqueIndex:idx_user_record"`
	RecordType string    `json:"record_type" gorm:"uniqueIndex:idx_user_record"`
	RecordID   uint      `json:"record_id" gorm:"uniqueIndex:idx_user_record"`
	ViewedAt   time.Time `json:"viewed_at"`
}
