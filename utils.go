package main

import (
	"strconv"
	"net/url"
	"log"
)

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