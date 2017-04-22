package main

import (
	"flag"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"fmt"
)

func proxy(w http.ResponseWriter, r *http.Request) {
	var host = strings.Split(r.URL.RawQuery, "=")[1]
	unesc, _ := url.PathUnescape(host)
	resp, err := http.Get(unesc)
	if (err != nil) {
		fmt.Println(err)
	} else {
		defer resp.Body.Close()
		io.Copy(w, resp.Body)
	}
}

func main() {
	var httpPort = flag.Int("port", 8080, "please specify correct port")
	http.Handle("/", http.FileServer(http.Dir("")))
	http.HandleFunc("/proxy", proxy)
	http.ListenAndServe(":" + strconv.Itoa(*httpPort), nil)
}
