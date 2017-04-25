package main

import (
	"flag"
	"net/http"
	"strconv"
	"gopkg.in/igm/sockjs-go.v2/sockjs"
	"log"
	"strings"
	"github.com/go-stomp/stomp/frame"
	"bytes"
)

func main() {
	var httpPort = flag.Int("port", 8082, "please specify correct port")

	http.Handle("/", http.FileServer(http.Dir("D:/dev/kits/GOPATH/src/github.com/avvero/flow/src/main/resources/static")))
	http.Handle("/echo/", sockjs.NewHandler("/echo", sockjs.DefaultOptions, echoHandler))
	log.Println("Server started on port: 8080")
	http.ListenAndServe(":"+strconv.Itoa(*httpPort), nil)
}

func echoHandler(session sockjs.Session) {
	log.Println("new sockjs session established")
	for {
		if msg, err := session.Recv(); err == nil {
			log.Printf("msg: %v",  msg)
			fr, err := frame.NewReader(strings.NewReader(msg)).Read()
			if err != nil {
				log.Printf("frame error: %v",  err)
				continue
			}
			log.Printf("recived command: %s",  fr.Command)

			respFrame := frame.New(frame.CONNECTED, "session", "1092296064")
			buf := bytes.NewBufferString("")
			frame.NewWriter(buf).Write(respFrame)
			session.Send(buf.String())
			continue
		}
		break
	}
	log.Println("sockjs session closed")
}