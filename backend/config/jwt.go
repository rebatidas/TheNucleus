package config

// JWTSecret is used to sign and verify JWT tokens. Exported so other packages can use it.
var JWTSecret = []byte("supersecretkey")
