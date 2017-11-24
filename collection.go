package main

import "sync"

type LinkedElement struct {
	value *[]byte
	next  *LinkedElement
	prev  *LinkedElement
}

type LinkedList struct {
	listMutex    sync.Mutex
	n            int //size
	capacity     int
	firstElement *LinkedElement
	lastElement  *LinkedElement
}

func (list *LinkedList) add(value *[]byte) {
	defer list.listMutex.Unlock()
	list.listMutex.Lock()

	current := &LinkedElement{value: value}
	if list.capacity < list.n+1 {
		list.firstElement = list.firstElement.next
		list.firstElement.prev = nil
	} else {
		list.n ++
	}
	if list.firstElement == nil {
		list.firstElement = current
		list.lastElement = current
		return
	}
	prev := list.lastElement
	prev.next = current
	current.prev = prev
	list.lastElement = current
}

func (list *LinkedList) size() int {
	return list.n
}

func NewLinkedList(capacity int) *LinkedList {
	return &LinkedList{capacity: capacity}
}
