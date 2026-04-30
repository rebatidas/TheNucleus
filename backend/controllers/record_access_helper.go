package controllers

import (
	"thenucleus-backend/config"
	"thenucleus-backend/models"
)

const (
	OWDPublicReadWrite = "PublicReadWrite"
	OWDPublicReadOnly  = "PublicReadOnly"
	OWDPrivate         = "Private"
)

func getOrgWideDefault(objectName string) string {
	var owd models.OrgWideDefault
	if err := config.DB.Where("object_name = ?", objectName).First(&owd).Error; err != nil {
		return OWDPublicReadWrite
	}
	return owd.AccessLevel
}

func isValidOrgWideDefaultAccessLevel(accessLevel string) bool {
	return accessLevel == OWDPrivate ||
		accessLevel == OWDPublicReadOnly ||
		accessLevel == OWDPublicReadWrite
}

func getUserByIDForRecordAccess(userID uint) (*models.User, error) {
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func isSameOrAncestorRole(viewerRoleID *uint, ownerRoleID *uint) bool {
	if viewerRoleID == nil || ownerRoleID == nil {
		return false
	}

	if *viewerRoleID == *ownerRoleID {
		return true
	}

	currentRoleID := *ownerRoleID

	for {
		var role models.Role
		if err := config.DB.First(&role, currentRoleID).Error; err != nil {
			return false
		}

		if role.ReportsToID == nil {
			return false
		}

		if *role.ReportsToID == *viewerRoleID {
			return true
		}

		currentRoleID = *role.ReportsToID
	}
}

func hasHierarchyAccess(viewer *models.User, ownerID uint) bool {
	owner, err := getUserByIDForRecordAccess(ownerID)
	if err != nil {
		return false
	}

	return isSameOrAncestorRole(viewer.RoleID, owner.RoleID)
}

func canAccessByOWDAndHierarchy(user *models.User, ownerID uint, objectName string, action string) bool {
	if user == nil {
		return false
	}

	if ownerID == 0 || ownerID == user.ID {
		return true
	}

	if hasHierarchyAccess(user, ownerID) {
		return true
	}

	switch getOrgWideDefault(objectName) {
	case OWDPublicReadWrite:
		return true
	case OWDPublicReadOnly:
		return action == "view"
	case OWDPrivate:
		return false
	default:
		return false
	}
}

func canAccessCustomerRecord(user *models.User, customer *models.Customer, action string) bool {
	if customer == nil {
		return false
	}

	return canAccessByOWDAndHierarchy(user, customer.OwnerID, "Customers", action)
}

func canAccessCaseRecord(user *models.User, caseRecord *models.Case, action string) bool {
	if caseRecord == nil {
		return false
	}

	return canAccessByOWDAndHierarchy(user, caseRecord.OwnerID, "Cases", action)
}

func filterCustomersByRecordAccess(user *models.User, customers []models.Customer, action string) []models.Customer {
	filtered := make([]models.Customer, 0, len(customers))

	for _, customer := range customers {
		if canAccessCustomerRecord(user, &customer, action) {
			filtered = append(filtered, customer)
		}
	}

	return filtered
}

func filterCasesByRecordAccess(user *models.User, cases []models.Case, action string) []models.Case {
	filtered := make([]models.Case, 0, len(cases))

	for _, caseRecord := range cases {
		if canAccessCaseRecord(user, &caseRecord, action) {
			filtered = append(filtered, caseRecord)
		}
	}

	return filtered
}
