// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"github.com/go-stomp/stomp/server/client"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	subscriptions map[*Subscription]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Subscription

	// Unregister requests from clients.
	unregister chan *Subscription
}

func newHub() *Hub {
	return &Hub{
		broadcast:     make(chan []byte),
		register:      make(chan *Subscription),
		unregister:    make(chan *Subscription),
		subscriptions: make(map[*Subscription]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case subscription := <-h.register:
			h.subscriptions[subscription] = true
		case subscription := <-h.unregister:
			if _, ok := h.subscriptions[subscription]; ok {
				log.Printf("unsubscribe client on : %v", subscription)
				delete(h.subscriptions, subscription)
				close(subscription.send)
			}
		case message := <-h.broadcast:
			log.Printf("broadcasting: %v for clients %d", string(message), len(h.subscriptions))
			for subscription := range h.subscriptions {
				select {
				case subscription.send <- message:
				default:
					log.Printf("close client on : %v", string(message))
					close(subscription.send)
					delete(h.subscriptions, subscription)
				}
			}
		}
	}
}
