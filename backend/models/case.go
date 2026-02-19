package models

import (
    "time"

    "gorm.io/gorm"
)

type Case struct {
    ID        uint           `json:"id" gorm:"primaryKey"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"-"`
    DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
    UserID    uint           `json:"user_id"`
    Title     string         `json:"title"`
    Status    string         `json:"status"`
}
