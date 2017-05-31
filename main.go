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
	"net/url"
	"strconv"
)

type Instance struct {
	Name string
}

type Context struct {
	Instance Instance
	Markers  []string
}

var httpPort = flag.String("httpPort", "8080", "http server port")
var tcpPort = flag.String("tcpPort", "4561", "tcp server port")

func main() {
	flag.Parse()

	hub := newHub()
	go hub.run()

	listener := &SocketService{hub: hub, tcpPort: tcpPort}
	go listener.readPump()

	http.Handle("/", http.FileServer(http.Dir("static")))
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
					subscription := NewSubscription(fr, &session)
					hub.register <- subscription
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
		context := Context{Markers: markers, Instance: Instance{Name: "Flow"}}

		js, err := json.Marshal(context)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
	http.HandleFunc("/logs", func(w http.ResponseWriter, r *http.Request) {
		marker := r.URL.Query().Get("marker")
		list := hub.db[marker]
		var logs []interface{}
		if list == nil {
			logs = make([]interface{}, 0)
		} else {
			logs = make([]interface{}, list.n)
			params := parseSearchParams(r.URL.Query())
			logsBytes := search(list, params)
			for i, b := range logsBytes {
				var js map[string]interface{}
				json.Unmarshal(*b, &js)
				logs[i] = js
			}
		}
		js, err := json.Marshal(logs)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(js)
	})
	log.Println("Http server started on port " + *httpPort)
	http.ListenAndServe(":" + *httpPort, nil)
}

type SearchParams struct {
	length       int
	start        int
	showTrace    bool
	showDebug    bool
	showInfo     bool
	showWarn     bool
	showError    bool
	messageQuery string
}

func parseSearchParams(values url.Values) *SearchParams {
	result := SearchParams{length: 100, start: 0, }
	length := values.Get("length")
	if length != "" {
		r, e := strconv.Atoi(length)
		if e != nil {
			result.length = 100
		} else {
			result.length = r
		}
	}
	start := values.Get("start")
	if start != "" {
		r, e := strconv.Atoi(start)
		if e != nil {
			result.start = 0
		} else {
			result.start = r
		}
	}
	result.showTrace = parseBoolParam(values.Get("showTrace"), true)
	result.showDebug = parseBoolParam(values.Get("showDebug"), true)
	result.showInfo = parseBoolParam(values.Get("showInfo"), true)
	result.showWarn = parseBoolParam(values.Get("showWarn"), true)
	result.showError = parseBoolParam(values.Get("showError"), true)
	result.messageQuery = values.Get("messageQuery")

	return &result
}

func parseBoolParam(value string, def bool) bool {
	if value != "" {
		r, e := strconv.ParseBool(value)
		if e != nil {
			return def
		} else {
			return r
		}

	} else {
		return def
	}
}

type LogLevel struct {
	levelInt int
	levelStr string
}

type LogEntry struct {
	message   string
	timeStamp int
	level     LogLevel
}

func search(list *LinkedList, params *SearchParams) []*[]byte {
	log.Println("Search for ", *params)
	var logsBytes = make([]*[]byte, list.n)
	next := list.firstElement
	i := 0
	for next != nil {
		logsBytes[i] = next.value
		next = next.next
		i ++
	}
	return logsBytes
}
