package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis"
	"github.com/streadway/amqp"
)

type QueueItem struct {
	Name      string    `json:"name"`
	QueueType string    `json:"type"`
	StartTime time.Time `json:"starTime,omitempty"`
	EndTime   time.Time `json:"endTime,omitempty"`
	Id        string    `json:"id"`
}

type QueueItems []QueueItem

func WriteToLog(item QueueItem) {
	line := fmt.Sprintf("%s,%s,%d,%d\n", item.Id, item.QueueType, item.StartTime.Unix(), item.EndTime.Unix())
	f, err := os.OpenFile("access.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal(err)
	}

	if _, err := f.Write([]byte(line)); err != nil {
		log.Fatal(err)
	}

	if err := f.Close(); err != nil {
		log.Fatal(err)
	}
}

func main() {
	rc := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	})
	QUEUE_NAME := "myqueue_"
	QUEUE_COUNTER := "myqueue_counter"

	route := gin.Default()
	route.POST("/enqueue", func(c *gin.Context) {
		var item QueueItem
		c.BindJSON(&item)
		item.StartTime = time.Now()
		qt := item.QueueType
		count := rc.Incr(QUEUE_COUNTER + qt)
		id := item.QueueType + strconv.FormatInt(count.Val(), 10)
		item.Id = id
		b, _ := json.Marshal(item)
		rc.ZAdd(QUEUE_NAME+qt, redis.Z{Score: float64(count.Val()), Member: string(b)})
		c.JSON(200, gin.H{
			"id": id,
		})
	})

	/* Setup RabbitMQ client*/
	conn, _ := amqp.Dial("amqp://guest:guest@localhost:5672/")
	defer conn.Close()

	ch, _ := conn.Channel()
	defer ch.Close()

	q, _ := ch.QueueDeclare(
		"notification",
		false,
		false,
		false,
		false,
		nil,
	)

	/* End Setup RabbitMQ client*/
	sendNotification := func(sv string, itemId string) {
		body := sv + ":" + itemId
		ch.Publish(
			"",
			q.Name,
			false,
			false,
			amqp.Publishing{
				DeliveryMode: amqp.Persistent,
				ContentType:  "text/plain",
				Body:         []byte(body),
			})
		log.Printf("Notification Sent %s", body)
	}

	StoreAndNotify := func(sv string, itemId string, jsVal string) {
		rc.Set(QUEUE_NAME+sv, jsVal, 0)
		sendNotification(sv, itemId)
	}

	route.GET("/dequeue", func(c *gin.Context) {
		qt := c.DefaultQuery("type", "")
		sv := c.DefaultQuery("service", "")
		pipe := rc.Pipeline()
		key := QUEUE_NAME + qt
		rawItem := pipe.ZRangeWithScores(key, 0, 0)
		pipe.ZRemRangeByRank(key, 0, 0)
		pipe.Exec()
		var item QueueItem
		val := rawItem.Val()

		if len(val) > 0 {
			jsVal := val[0].Member.(string)
			json.Unmarshal([]byte(jsVal), &item)
			item.EndTime = time.Now()
			go StoreAndNotify(sv, item.Id, jsVal)
			go WriteToLog(item)
			c.JSON(200, gin.H{
				"item": item,
			})
			return
		}

		c.JSON(200, gin.H{
			"item": nil,
		})

	})

	route.GET("/list", func(c *gin.Context) {
		qt := c.DefaultQuery("type", "")
		list := rc.ZRange(QUEUE_NAME+qt, 0, -1)
		vals := list.Val()
		c.JSON(200, gin.H{
			"items": vals,
		})
	})

	route.GET("/services", func(c *gin.Context) {
		query := c.DefaultQuery("query", "")
		svs := strings.Split(query, ",")
		smap := make(map[string]string)
		for _, s := range svs {
			jsVal := rc.Get(QUEUE_NAME + s).Val()
			var item QueueItem
			json.Unmarshal([]byte(jsVal), &item)
			smap[s] = item.Id
		}

		c.JSON(200, smap)
	})

	route.Run(":8889")
}
