package main

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

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
	route.GET("/recommendation", func(c *gin.Context) {
		uid := c.DefaultQuery("id", "")
		res, e := http.Get("http://localhost:8890/user?id=" + uid)
		var recommendation string
		var u User
		if e == nil {
			defer res.Body.Close()
			body, _ := ioutil.ReadAll(res.Body)
			json.Unmarshal(body, &u)

			if u.Balance > 5000 {
				recommendation = "Should open an investment account!"
			} else if u.Balance > 2000 {
				recommendation = "Should open a saving account!"
			} else {
				recommendation = "Should save more money!"
			}
		} else {
			recommendation = "No recommendation!"
		}

		c.JSON(200, gin.H{
			"user":           u,
			"recommendation": recommendation,
		})
	})
	route.Run(":8891")
}
