package main

import (
	"flag"
	"net/http"
	"gopkg.in/igm/sockjs-go.v2/sockjs"
	"log"
	"strings"
	"github.com/avvero/stomp/frame"
	"bytes"
	"encoding/json"
)

import (
	_ "net/http/pprof"
)

type Instance struct {
	Name string
}

type Context struct {
	Instance Instance
	Markers []string
}

var addr = flag.String("addr", ":8080", "http service address")

func main() {
	flag.Parse()

	hub := newHub()
	go hub.run()

	listener := &SocketService{hub: hub}
	go listener.readPump()

	http.Handle("/", http.FileServer(http.Dir("D:/dev/kits/GOPATH/src/github.com/avvero/flow/src/main/resources/static")))
	http.Handle("/echo/", sockjs.NewHandler("/echo", sockjs.DefaultOptions, func(session sockjs.Session) {
		log.Println("new sockjs session established")
		for {
			if msg, err := session.Recv(); err == nil {
				log.Printf("msg: %v", msg)
				fr, err := frame.NewReader(strings.NewReader(msg)).Read()
				if err != nil {
					log.Printf("frame error: %v", err)
					continue
				}
				log.Printf("recived command: %s", fr.Command)

				var respFrame *frame.Frame

				switch fr.Command {
				case frame.CONNECT:
					respFrame = frame.New(frame.CONNECTED, "session", session.ID())
					buf := bytes.NewBufferString("")
					frame.NewWriter(buf).Write(respFrame)
					session.Send(buf.String())
				case frame.SUBSCRIBE:
					log.Printf("subscribe on: %s", fr.Header.Get("destination"))
					subscription := &Subscription{
						destination: fr.Header.Get("destination"),
						id:          fr.Header.Get("id"),
						hub:         hub,
						session:     &session,
						send:        make(chan string)}
					subscription.hub.register <- subscription
				case frame.DISCONNECT:
					//TODO
					log.Printf("DISCONNECT on: %s", fr.Header.Get("destination"))
				}
				continue
			}
			break
		}
		log.Println("Sockjs session closed")
	}))
	http.HandleFunc("/context", func(w http.ResponseWriter, r *http.Request) {
		markers := make([]string, len(hub.subscriptions))
		i := 0
		for k := range hub.subscriptions {
			markers[i] = k
			i++
		}
		context := Context{Markers : markers, Instance : Instance {Name: "flow"}}

		js, err := json.Marshal(context)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
	log.Println("Server started on port: " + *addr)
	http.ListenAndServe(*addr, nil)
}
