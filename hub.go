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
	broadcast          chan *frame.Frame
	register           chan *Subscription
	unregister         chan *Subscription

	db		   map[string][]*string
}

func newHub() *Hub {
	return &Hub{
		broadcast:     make(chan *frame.Frame),
		register:      make(chan *Subscription),
		unregister:    make(chan *Subscription),
		subscriptions: make(map[string]map[string]*Subscription),
		db: make(map[string][]*string),
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
	}
}

func (this *Hub) registerMarker(marker string) map[string]*Subscription {
	markerSubscriptions := this.subscriptions[marker]
	if markerSubscriptions == nil {
		log.Printf("new marker : %v", marker)
		markerSubscriptions = make(map[string]*Subscription)
		this.subscriptions[marker] = markerSubscriptions

		ss := make([]*string, 50, 50)
		this.db[marker] = ss
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
			subscription.close()
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

			this.store(&destination, &frameString)

			for _, subscription := range this.subscriptions[destination] {
				subscription.notify(&frameString)
			}
		}
	}
}

func (this *Hub) store(marker *string, fr *string) {
	old := this.db[*marker]
	log.Printf("old : %v", old)
	log.Printf("len : %v", len(old))
	new := append(old, fr)
	log.Printf("new : %v", new)
	this.db[*marker] = new
	log.Printf("stored : %v, %t", len(this.db[*marker]), &old == &new)
}