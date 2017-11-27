// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"net"
	"os"
	"github.com/go-stomp/stomp/frame"
)

const (
	CONN_HOST = "0.0.0.0"
	CONN_TYPE = "tcp"
)

type SocketService struct {
	hub     *Hub
	tcpPort *string
}

func (c *SocketService) readPump() {
	ln, err := net.Listen(CONN_TYPE, CONN_HOST + ":" + *c.tcpPort)
	if err != nil {
		log.Printf("Socket: listen error: %v", err)
		os.Exit(1)
	}
	defer ln.Close()
	log.Println("Socket: tcp server listens on " + CONN_HOST + ":" + *c.tcpPort)
	for {
		log.Println("Socket: accepting listener")
		conn, err := ln.Accept()
		if err != nil {
			log.Printf("Socket: accept error: %v", err)
			os.Exit(1)
		}
		log.Printf("Socket: connection %v established", conn)
		go handleConnection(c, conn)
	}
}

func handleConnection(c *SocketService, conn net.Conn) {
	defer conn.Close()
	rdr := frame.NewReader(conn)
	for {
		fr, err := rdr.Read()
		if err != nil {
			log.Printf("Socket: read error: %v", err)
			log.Printf("Socket: connection %v will be closed immediately", conn)
			return
		} else if fr != nil {
			//log.Printf("c.hub.broadcast <- %s", fr)
			c.hub.broadcast <- fr
		}
	}
}