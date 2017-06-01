package main

import (
	//"errors"
	"sync"
	"log"
)

// Store interface
type Store interface {
	save(key string, value *[]byte)
	find(i string, params *SearchParams) ([]*[]byte)
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

// InMemoryStore is a store
type InMemoryStore struct {
	collectionsMutex   sync.Mutex
	collections        map[string]*LinkedList
	collectionCapacity int
}

// Puts
func (store *InMemoryStore) save(name string, value *[]byte) {
	collection := store.getCollection(name)
	collection.add(value)
}

func (store *InMemoryStore) getCollection(name string) *LinkedList {
	store.collectionsMutex.Lock()
	defer store.collectionsMutex.Unlock()

	collection := store.collections[name]
	if collection == nil {
		collection = NewLinkedList(store.collectionCapacity)
		store.collections[name] = collection
	}
	return collection
}

func (store *InMemoryStore) find(name string, params *SearchParams) ([]*[]byte) {
	log.Println("Search for ", *params)
	elements := make([]*LinkedElement, params.length)
	collection := store.getCollection(name)
	current := collection.lastElement
	if current == nil {
		// empty
		return []*[]byte {}
	}
	i := 0
	for i < params.length {
		if current == nil {
			break
		}
		elements[i] = current
		current = current.prev
		i ++
	}
	result := make([]*[]byte, len(elements))
	for i, e := range elements {
		result[i] = e.value
	}
	return result
}

func NewInMemoryStore(collectionCapacity int) *InMemoryStore {
	return &InMemoryStore{collections: make(map[string]*LinkedList), collectionCapacity: collectionCapacity}
}
