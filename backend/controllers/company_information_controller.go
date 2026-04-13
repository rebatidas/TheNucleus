package controllers

import (
	"errors"
	"net/http"

	"thenucleus-backend/config"
	"thenucleus-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetCompanyInformation(c *gin.Context) {
	var company models.CompanyInformation

	err := config.DB.First(&company).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusOK, gin.H{
				"data": nil,
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch company information",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": company,
	})
}

func CreateCompanyInformation(c *gin.Context) {
	var existing models.CompanyInformation
	if err := config.DB.First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Company Information already exists. Please edit the existing record.",
		})
		return
	}

	var input models.CompanyInformation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if input.OrganizationName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization Name is required",
		})
		return
	}

	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create company information",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Company Information created successfully",
		"data":    input,
	})
}

func UpdateCompanyInformation(c *gin.Context) {
	var company models.CompanyInformation

	if err := config.DB.First(&company).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Company Information does not exist yet",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch company information",
		})
		return
	}

	var input models.CompanyInformation
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if input.OrganizationName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Organization Name is required",
		})
		return
	}

	company.OrganizationName = input.OrganizationName
	company.Website = input.Website
	company.Phone = input.Phone
	company.Street = input.Street
	company.City = input.City
	company.State = input.State
	company.PostalCode = input.PostalCode
	company.Country = input.Country

	if err := config.DB.Save(&company).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update company information",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Company Information updated successfully",
		"data":    company,
	})
}
