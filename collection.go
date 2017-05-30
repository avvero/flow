package main

type LinkedElement struct {
	value *string
	next *LinkedElement
}

type LinkedList struct {
	firstElement *LinkedElement
	lastElement *LinkedElement
}

func (this *LinkedList) add(value *string) {
	e := &LinkedElement{value: value}
	if this.firstElement == nil {
		this.firstElement = e
		this.lastElement = e
		return
	}
	this.lastElement.next = e
	this.lastElement = e
}

func (this *LinkedList) size() int {
	i := 0
	next := this.firstElement
	for next != nil {
		i++
		next = next.next
	}
	return i
}

func NewLinkedList() *LinkedList  {
	return &LinkedList{}
}
