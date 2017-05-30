package main

import (
	"gopkg.in/igm/sockjs-go.v2/sockjs"
)

// Client is a middleman between the websocket connection and the hub.
type Subscription struct {
	marker  string
	id      string
	hub     *Hub
	session *sockjs.Session
	send    chan string
}

func (subscription *Subscription) doSend() {
	for {
		select {
		case frameString := <-subscription.send:
			(*subscription.session).Send(frameString)
		}
	}
}
