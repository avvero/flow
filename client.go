// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"log"
	"net"
	"os"
	"fmt"
	"github.com/avvero/stomp/frame"
)

const (
	CONN_HOST = "localhost"
	CONN_PORT = "4561"
	CONN_TYPE = "tcp"
)

type TCPListener struct {
	hub *Hub
}

func (c *TCPListener) readPump() {
	ln, err := net.Listen(CONN_TYPE, CONN_HOST+":"+CONN_PORT)
	if err != nil {
		log.Printf("Listen error: %v", err)
		os.Exit(1)
	}
	defer ln.Close()
	fmt.Println("Listening on " + CONN_HOST + ":" + CONN_PORT)
	bfr := make([]byte, 4096)
	for {
		conn, err := ln.Accept()
		defer conn.Close()
		if err != nil {
			log.Printf("Accept error: %v", err)
			os.Exit(1)
		}
		readAndBroadcast(c, conn, bfr)
	}
}

func readAndBroadcast(c *TCPListener, conn net.Conn, bfr []byte) {
	cleanBuffer(bfr)
	var rdr *frame.Reader
	rdr = frame.NewReaderBuffer(conn, bfr)
	fr, err := rdr.Read()
	if err != nil {
		log.Printf("Read error: %v", err)
	} else {
		c.hub.broadcast <- fr
	}
	conn.Close()
}

func cleanBuffer(bfr []byte) {
	for i, _ := range bfr {
		bfr[i] = 0
	}
}
