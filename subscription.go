package main

import (
	"gopkg.in/igm/sockjs-go.v2/sockjs"
	"github.com/avvero/stomp/frame"
	"bytes"
)

// Client is a middleman between the websocket connection and the hub.
type Subscription struct {
	destination string
	id          string
	hub         *Hub
	session     *sockjs.Session
	send        chan *frame.Frame
}

func (subscription *Subscription) doSend() {
	for {
		select {
		case frm := <-subscription.send:
			//frm.Header.Add("subscription", subscription.id)
			frm.Header.Add("subscription", "sub-0")
			buf := bytes.NewBufferString("")
			frame.NewWriter(buf).Write(frm)
			(*subscription.session).Send(buf.String())
		}
	}
}
