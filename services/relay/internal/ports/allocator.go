package ports

import (
	"errors"
	"sync"
)

type Allocation struct {
	Port int `json:"port"`
}

type Allocator struct {
	mu    sync.Mutex
	next  int
	end   int
	inUse map[int]bool
}

func NewAllocator(start int, end int) *Allocator {
	return &Allocator{
		next:  start,
		end:   end,
		inUse: make(map[int]bool),
	}
}

func (allocator *Allocator) Allocate() (Allocation, error) {
	allocator.mu.Lock()
	defer allocator.mu.Unlock()

	for port := allocator.next; port <= allocator.end; port++ {
		if allocator.inUse[port] {
			continue
		}

		allocator.inUse[port] = true
		allocator.next = port + 1
		return Allocation{Port: port}, nil
	}

	return Allocation{}, errors.New("no relay ports available")
}

func (allocator *Allocator) Release(port int) {
	allocator.mu.Lock()
	defer allocator.mu.Unlock()

	delete(allocator.inUse, port)

	if port < allocator.next {
		allocator.next = port
	}
}
