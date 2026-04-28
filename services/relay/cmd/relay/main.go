package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/daewook0401/remote-game-server-app/services/relay/internal/ports"
)

func main() {
	allocator := ports.NewAllocator(31000, 31999)

	http.HandleFunc("/healthz", withCORS(func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusOK)
		_, _ = writer.Write([]byte("ok"))
	}))

	http.HandleFunc("/ports/allocate", withCORS(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost {
			http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		allocation, err := allocator.Allocate()
		if err != nil {
			http.Error(writer, err.Error(), http.StatusConflict)
			return
		}

		writer.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(writer).Encode(allocation)
	}))

	http.HandleFunc("/ports/release", withCORS(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost {
			http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var allocation ports.Allocation
		if err := json.NewDecoder(request.Body).Decode(&allocation); err != nil {
			http.Error(writer, err.Error(), http.StatusBadRequest)
			return
		}

		allocator.Release(allocation.Port)
		writer.WriteHeader(http.StatusNoContent)
	}))

	log.Fatal(http.ListenAndServe(":8080", nil))
}

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
		writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if request.Method == http.MethodOptions {
			writer.WriteHeader(http.StatusNoContent)
			return
		}

		handler(writer, request)
	}
}
