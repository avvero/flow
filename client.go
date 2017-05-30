// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"net"
	"os"
	"bufio"
	"github.com/go-stomp/stomp/frame"
)

const (
	CONN_HOST = "localhost"
	CONN_TYPE = "tcp"
)

type TCPListener struct {
	tcpPort string
	hub *Hub
}

func (c *TCPListener) readPump() {
	ln, err := net.Listen(CONN_TYPE, CONN_HOST+":"+c.tcpPort)
	if err != nil {
		log.Printf("Listen error: %v", err)
		os.Exit(1)
	}
	defer ln.Close()
	log.Println("Tcp server listens on " + CONN_HOST + ":" + c.tcpPort)
	for {
		conn, err := ln.Accept()
		defer conn.Close()
		if err != nil {
			log.Printf("Accept error: %v", err)
			os.Exit(1)
		}
		go func() {
			fr, err := frame.NewReader(bufio.NewReader(conn)).Read()
			if err != nil {
				log.Printf("Read error: %v", err)
			} else {
				c.hub.broadcast <- fr
			}
		}()
	}
}
