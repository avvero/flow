package main

import (
	"gopkg.in/igm/sockjs-go.v2/sockjs"
	"github.com/go-stomp/stomp/frame"
	"bytes"
)

// Client is a middleman between the websocket connection and the hub.
type Subscription struct {
	destination string
	hub         *Hub
	session     *sockjs.Session
	send        chan *frame.Frame
}

func (subscription *Subscription) doSend() {
	for {
		select {
		case frm := <-subscription.send:
			buf := bytes.NewBufferString("")
			frame.NewWriter(buf).Write(frm)
			(*subscription.session).Send(buf.String())
		}
	}
}
