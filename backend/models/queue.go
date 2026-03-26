package models

import "gorm.io/gorm"

type Queue struct {
    gorm.Model
    Name string `json:"name"`
}
