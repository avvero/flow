// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"sync"
	"github.com/avvero/stomp/frame"
	"bytes"
)

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	subscriptions      map[string]map[string]*Subscription
	subscriptionsMutex sync.Mutex

	// Messages to broadcastfrom the clients.
	broadcast          chan *frame.Frame

	// Register requests from the clients.
	register           chan *Subscription

	// Unregister requests from clients.
	unregister         chan *Subscription
}

func newHub() *Hub {
	return &Hub{
		broadcast:     make(chan *frame.Frame),
		register:      make(chan *Subscription),
		unregister:    make(chan *Subscription),
		subscriptions: make(map[string]map[string]*Subscription),
	}
}

func (this *Hub) subscribe(subscription *Subscription) {
	this.subscriptionsMutex.Lock()
	defer this.subscriptionsMutex.Unlock()

	log.Printf("subscribe client to : %v", subscription)

	markerSubscriptions, ok := this.subscriptions[subscription.marker]
	if ok == false {
		markerSubscriptions = this.registerMarker(subscription.marker)
	}
	id := (*subscription.session).ID()
	if _, ok = markerSubscriptions[id]; ok == false {
		markerSubscriptions[id] = subscription
		go subscription.doSend()
	}
}

func (this *Hub) registerMarker(marker string) map[string]*Subscription {
	markerSubscriptions := this.subscriptions[marker]
	if markerSubscriptions == nil {
		log.Printf("new marker : %v", marker)
		markerSubscriptions = make(map[string]*Subscription)
		this.subscriptions[marker] = markerSubscriptions
	}
	return markerSubscriptions
}

func (this *Hub) registerMarkerSync(marker string) map[string]*Subscription {
	this.subscriptionsMutex.Lock()
	defer this.subscriptionsMutex.Unlock()
	return this.registerMarker(marker)
}

func (this *Hub) unsubscribe(subscription *Subscription) {
	this.subscriptionsMutex.Lock()
	defer this.subscriptionsMutex.Unlock()

	log.Printf("unsubscribe client on : %v", subscription)

	if subscriptions, ok := this.subscriptions[subscription.marker]; ok == true {
		id := (*subscription.session).ID()
		if _, ok = subscriptions[id]; ok == true {
			delete(subscriptions, id)
			close(subscription.send)
		}
	}
}

func (this *Hub) run() {
	for {
		select {
		case subscription := <-this.register:
			this.subscribe(subscription)
		case subscription := <-this.unregister:
			this.unsubscribe(subscription)
		case fr := <-this.broadcast:
			destination := fr.Header.Get("destination")
			if this.subscriptions[destination] == nil {
				this.registerMarkerSync(destination)
			}
			fr.Header.Add("subscription", "sub-0")
			buf := bytes.NewBufferString("")
			frame.NewWriter(buf).Write(fr)
			frameString := buf.String()

			for _, subscription := range this.subscriptions[destination] {
				subscription.send <- frameString
			}
		}
	}
}
