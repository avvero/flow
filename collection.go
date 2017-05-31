package main

import "sync"

type LinkedElement struct {
	value *[]byte
	next *LinkedElement
}

type LinkedList struct {
	listMutex sync.Mutex

	n int //size
	capacity int
	firstElement *LinkedElement
	lastElement *LinkedElement
}

func (this *LinkedList) add(value *[]byte) {
	defer this.listMutex.Unlock()
	this.listMutex.Lock()

	e := &LinkedElement{value: value}
	if this.capacity < this.n + 1 {
		this.firstElement = this.firstElement.next
	} else {
		this.n ++
	}
	if this.firstElement == nil {
		this.firstElement = e
		this.lastElement = e
		return
	}
	this.lastElement.next = e
	this.lastElement = e
}

func (this *LinkedList) size() int {
	return this.n
}

func NewLinkedList(capacity int) *LinkedList  {
	return &LinkedList{capacity: capacity}
}
