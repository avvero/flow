package main

import (
	"flag"
	"net/http"
	"strconv"
)

func main() {
	var httpPort = flag.Int("port", 8082, "please specify correct port")

	hub := newHub()
	go hub.run()

	http.Handle("/", http.FileServer(http.Dir("D:/dev/kits/GOPATH/src/github.com/avvero/flow/src/main/resources/static")))
	http.HandleFunc("/messages", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})
	http.ListenAndServe(":"+strconv.Itoa(*httpPort), nil)
}
