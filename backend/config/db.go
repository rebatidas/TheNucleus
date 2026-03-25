package config

import (
	"database/sql"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := "host=localhost user=postgres password=##### dbname=TheNucleus port=5433 sslmode=disable"

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	sqlDB, err := database.DB()
	if err != nil {
		log.Fatal("Failed to get generic DB object:", err)
	}

	checkDatabaseName(sqlDB)

	fmt.Println("Database connected successfully")

	DB = database
}

func checkDatabaseName(sqlDB *sql.DB) {
	var dbName string

	err := sqlDB.QueryRow("SELECT current_database()").Scan(&dbName)
	if err != nil {
		log.Println("Could not verify current database:", err)
		return
	}

	log.Println("Connected to PostgreSQL database:", dbName)
}
