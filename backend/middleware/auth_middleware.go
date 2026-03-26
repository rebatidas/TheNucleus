package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("supersecretkey")

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Missing Authorization header"})
			return
		}

		tokenString := authHeader
		if strings.HasPrefix(strings.ToLower(tokenString), "bearer ") {
			tokenString = tokenString[7:]
		}

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid token claims"})
			return
		}

		if uid, exists := claims["user_id"]; exists {
			switch v := uid.(type) {
			case float64:
				c.Set("userID", uint(v))
			default:
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid user id in token"})
				return
			}
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "User id not found in token"})
			return
		}

		c.Next()
	}
}
