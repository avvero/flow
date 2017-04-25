// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import "log"

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				log.Printf("unregister client on : %v",  client)
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			log.Printf("broadcasting: %v for clients %d",  string(message), len(h.clients))
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					log.Printf("close client on : %v",  string(message))
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
