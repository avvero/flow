// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"net"
	"os"
	"github.com/avvero/stomp/frame"
)

const (
	CONN_HOST = "localhost"
	CONN_TYPE = "tcp"
)

type SocketService struct {
	hub     *Hub
	tcpPort *string
}

func (c *SocketService) readPump() {
	ln, err := net.Listen(CONN_TYPE, CONN_HOST + ":" + *c.tcpPort)
	if err != nil {
		log.Printf("Listen error: %v", err)
		os.Exit(1)
	}
	defer ln.Close()
	log.Println("Tcp server listens on " + CONN_HOST + ":" + *c.tcpPort)
	for {
		log.Println("Accepting listener")
		conn, err := ln.Accept()
		defer conn.Close()
		if err != nil {
			log.Printf("Accept error: %v", err)
			os.Exit(1)
		}
		go handleConnection(c, conn)
	}
}

func handleConnection(c *SocketService, conn net.Conn) {
	defer conn.Close()
	for {
		rdr := frame.NewReaderSize(conn, 16)
		fr, err := rdr.Read()
		if err != nil {
			log.Printf("Read error: %v", err)
			return
		} else if fr != nil {
			//log.Printf("c.hub.broadcast <- %s", fr)
			c.hub.broadcast <- fr
		}
	}
}