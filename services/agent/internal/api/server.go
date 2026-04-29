package api

import (
	"encoding/json"
	"net/http"

	"github.com/daewook0401/OpenServerHub/services/agent/internal/docker"
)

type Server struct {
	dockerService *docker.Service
	agentToken    string
}

func NewServer(dockerService *docker.Service) *Server {
	return NewServerWithToken(dockerService, "")
}

func NewServerWithToken(dockerService *docker.Service, agentToken string) *Server {
	return &Server{dockerService: dockerService, agentToken: agentToken}
}

func (server *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", server.handleHealth)
	mux.HandleFunc("/docker/status", server.handleDockerStatus)
	mux.HandleFunc("/docker/containers", server.handleManagedContainers)
	mux.HandleFunc("/docker/minecraft", server.handleCreateMinecraft)
	mux.HandleFunc("/docker/containers/action", server.handleContainerAction)
	mux.HandleFunc("/docker/containers/console", server.handleConsoleSnapshot)
	mux.HandleFunc("/docker/containers/console/command", server.handleConsoleCommand)
	return withCORS(server.withAuth(mux))
}

func (server *Server) handleHealth(writer http.ResponseWriter, request *http.Request) {
	writer.WriteHeader(http.StatusOK)
	_, _ = writer.Write([]byte("ok"))
}

func (server *Server) handleDockerStatus(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	writeJSON(writer, http.StatusOK, server.dockerService.Status())
}

func (server *Server) handleManagedContainers(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	containers, err := server.dockerService.ListManagedContainers()
	if err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(writer, http.StatusOK, containers)
}

func (server *Server) handleCreateMinecraft(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload docker.CreateMinecraftServerRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	container, err := server.dockerService.CreateMinecraftServer(payload)
	if err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(writer, http.StatusCreated, container)
}

func (server *Server) handleContainerAction(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload docker.ContainerActionRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	container, err := server.dockerService.ApplyAction(payload)
	if err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(writer, http.StatusOK, container)
}

func (server *Server) handleConsoleSnapshot(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload docker.ConsoleAttachRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(writer, http.StatusOK, server.dockerService.ConsoleSnapshot(payload))
}

func (server *Server) handleConsoleCommand(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload docker.ConsoleCommandRequest
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := server.dockerService.ExecuteConsoleCommand(payload)
	if err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(writer, http.StatusOK, result)
}

func writeJSON(writer http.ResponseWriter, status int, payload any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(payload)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Access-Control-Allow-Origin", "http://127.0.0.1:5173")
		writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

		if request.Method == http.MethodOptions {
			writer.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(writer, request)
	})
}

func (server *Server) withAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if server.agentToken == "" || request.URL.Path == "/healthz" || request.Method == http.MethodOptions {
			next.ServeHTTP(writer, request)
			return
		}

		if request.Header.Get("Authorization") != "Bearer "+server.agentToken {
			http.Error(writer, "unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(writer, request)
	})
}
