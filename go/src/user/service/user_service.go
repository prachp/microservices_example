package main

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func main() {
	type User struct {
		ID      int64   `json:"id"`
		Name    string  `json:"name"`
		Detail  string  `json:"detail"`
		Balance float64 `json:"balance"`
	}
	route := gin.Default()
	route.GET("/user", func(c *gin.Context) {
		uid, _ := strconv.ParseInt(c.DefaultQuery("id", ""), 10, 64)
		constant := 1000.5
		b := float64(uid) * constant
		u := User{ID: uid, Name: "User", Detail: "Workday", Balance: b}
		c.JSON(200, u)
	})
	route.Run(":8890")
}
