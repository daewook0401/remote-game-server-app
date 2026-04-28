package ports

import "testing"

func TestAllocatorAllocatesSequentialPorts(t *testing.T) {
	allocator := NewAllocator(31000, 31001)

	first, err := allocator.Allocate()
	if err != nil {
		t.Fatalf("expected first allocation to succeed: %v", err)
	}

	second, err := allocator.Allocate()
	if err != nil {
		t.Fatalf("expected second allocation to succeed: %v", err)
	}

	if first.Port != 31000 {
		t.Fatalf("expected first port 31000, got %d", first.Port)
	}

	if second.Port != 31001 {
		t.Fatalf("expected second port 31001, got %d", second.Port)
	}
}

func TestAllocatorReturnsErrorWhenPoolIsExhausted(t *testing.T) {
	allocator := NewAllocator(31000, 31000)

	if _, err := allocator.Allocate(); err != nil {
		t.Fatalf("expected first allocation to succeed: %v", err)
	}

	if _, err := allocator.Allocate(); err == nil {
		t.Fatal("expected exhausted pool to return an error")
	}
}

func TestAllocatorReusesReleasedPort(t *testing.T) {
	allocator := NewAllocator(31000, 31001)

	first, err := allocator.Allocate()
	if err != nil {
		t.Fatalf("expected first allocation to succeed: %v", err)
	}

	if _, err := allocator.Allocate(); err != nil {
		t.Fatalf("expected second allocation to succeed: %v", err)
	}

	allocator.Release(first.Port)

	reused, err := allocator.Allocate()
	if err != nil {
		t.Fatalf("expected released port allocation to succeed: %v", err)
	}

	if reused.Port != first.Port {
		t.Fatalf("expected released port %d to be reused, got %d", first.Port, reused.Port)
	}
}
