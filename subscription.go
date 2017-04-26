package main

import (
	"gopkg.in/igm/sockjs-go.v2/sockjs"
)

// Client is a middleman between the websocket connection and the hub.
type Subscription struct {
	destination string
	hub *Hub
	session *sockjs.Session
	send chan []byte
}
