package main

import (
	"gopkg.in/igm/sockjs-go.v2/sockjs"
	"github.com/go-stomp/stomp/frame"
)

type Observer interface {
	notify(frame string)
	close()
}

// Client is a middleman between the websocket connection and the hub.
type Subscription struct {
	marker  string
	id      string
	session *sockjs.Session
	send    chan *string
}

func NewSubscription(fr *frame.Frame, session *sockjs.Session) *Subscription {
	subscription := &Subscription{
		marker: fr.Header.Get("destination"),
		id:          fr.Header.Get("id"),
		session:     session,
		send:        make(chan *string)}
	go subscription.doSend()
	return subscription
}

func (this *Subscription) notify(s *string) {
	this.send <- s
}

func (this *Subscription) close() {
	close(this.send)
}

func (subscription *Subscription) doSend() {
	for {
		select {
		case frameString := <-subscription.send:
			(*subscription.session).Send(*frameString)
		}
	}
}
