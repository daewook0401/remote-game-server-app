package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/daewook0401/remote-game-server-app/services/agent/internal/docker"
)

func TestCreateMinecraftServer(t *testing.T) {
	server := NewServer(docker.NewMemoryService())
	payload := docker.CreateMinecraftServerRequest{
		ServerID:       "local",
		TargetType:     "local",
		GameTemplateID: "minecraft-java",
		InstanceID:     "instance-1",
		ContainerName:  "minecraft-survival",
		Image:          "itzg/minecraft-server",
		InternalPort:   25565,
		ExternalPort:   25565,
		Memory:         "2G",
		EulaAccepted:   true,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal request: %v", err)
	}

	request := httptest.NewRequest(http.MethodPost, "/docker/minecraft", bytes.NewReader(body))
	response := httptest.NewRecorder()

	server.Routes().ServeHTTP(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", response.Code, response.Body.String())
	}

	var container docker.ContainerSummary
	if err := json.NewDecoder(response.Body).Decode(&container); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if container.Port != 25565 || container.Status != "running" || container.InstanceID != "instance-1" {
		t.Fatalf("unexpected container response: %+v", container)
	}
}

func TestListManagedContainers(t *testing.T) {
	server := NewServer(docker.NewMemoryService())
	payload := docker.CreateMinecraftServerRequest{
		ServerID:       "local",
		TargetType:     "local",
		GameTemplateID: "minecraft-java",
		InstanceID:     "instance-1",
		ContainerName:  "minecraft-survival",
		Image:          "itzg/minecraft-server",
		InternalPort:   25565,
		ExternalPort:   25565,
		Memory:         "2G",
		EulaAccepted:   true,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal request: %v", err)
	}

	createRequest := httptest.NewRequest(http.MethodPost, "/docker/minecraft", bytes.NewReader(body))
	createResponse := httptest.NewRecorder()
	server.Routes().ServeHTTP(createResponse, createRequest)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", createResponse.Code, createResponse.Body.String())
	}

	listRequest := httptest.NewRequest(http.MethodGet, "/docker/containers", nil)
	listResponse := httptest.NewRecorder()
	server.Routes().ServeHTTP(listResponse, listRequest)
	if listResponse.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", listResponse.Code, listResponse.Body.String())
	}

	var containers []docker.ContainerSummary
	if err := json.NewDecoder(listResponse.Body).Decode(&containers); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(containers) != 1 || containers[0].InstanceID != "instance-1" {
		t.Fatalf("unexpected containers response: %+v", containers)
	}
}

func TestCreateMinecraftServerRejectsMissingEula(t *testing.T) {
	server := NewServer(docker.NewMemoryService())
	payload := docker.CreateMinecraftServerRequest{
		ServerID:       "local",
		TargetType:     "local",
		GameTemplateID: "minecraft-java",
		InstanceID:     "instance-1",
		ContainerName:  "minecraft-survival",
		Image:          "itzg/minecraft-server",
		InternalPort:   25565,
		ExternalPort:   25565,
		Memory:         "2G",
		EulaAccepted:   false,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal request: %v", err)
	}

	request := httptest.NewRequest(http.MethodPost, "/docker/minecraft", bytes.NewReader(body))
	response := httptest.NewRecorder()

	server.Routes().ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", response.Code)
	}
}

func TestDockerStatus(t *testing.T) {
	server := NewServer(docker.NewMemoryService())
	request := httptest.NewRequest(http.MethodGet, "/docker/status", nil)
	response := httptest.NewRecorder()

	server.Routes().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}

	var status docker.DockerStatus
	if err := json.NewDecoder(response.Body).Decode(&status); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !status.Available || status.Mode != "memory" || status.AgentVersion == "" {
		t.Fatalf("unexpected docker status: %+v", status)
	}
}

func TestDockerStatusRequiresTokenWhenConfigured(t *testing.T) {
	server := NewServerWithToken(docker.NewMemoryService(), "secret-token")
	request := httptest.NewRequest(http.MethodGet, "/docker/status", nil)
	response := httptest.NewRecorder()

	server.Routes().ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", response.Code)
	}
}

func TestDockerStatusAcceptsBearerToken(t *testing.T) {
	server := NewServerWithToken(docker.NewMemoryService(), "secret-token")
	request := httptest.NewRequest(http.MethodGet, "/docker/status", nil)
	request.Header.Set("Authorization", "Bearer secret-token")
	response := httptest.NewRecorder()

	server.Routes().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}
}

func TestConsoleCommand(t *testing.T) {
	server := NewServer(docker.NewMemoryService())
	createPayload := docker.CreateMinecraftServerRequest{
		ServerID:       "local",
		TargetType:     "local",
		GameTemplateID: "minecraft-java",
		InstanceID:     "instance-1",
		ContainerName:  "minecraft-survival",
		Image:          "itzg/minecraft-server",
		InternalPort:   25565,
		ExternalPort:   25565,
		Memory:         "2G",
		EulaAccepted:   true,
	}

	createBody, err := json.Marshal(createPayload)
	if err != nil {
		t.Fatalf("failed to marshal create request: %v", err)
	}

	createRequest := httptest.NewRequest(http.MethodPost, "/docker/minecraft", bytes.NewReader(createBody))
	createResponse := httptest.NewRecorder()
	server.Routes().ServeHTTP(createResponse, createRequest)
	if createResponse.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", createResponse.Code, createResponse.Body.String())
	}

	commandBody, err := json.Marshal(docker.ConsoleCommandRequest{
		ContainerID: "mc-minecraft-survival",
		Command:     "say hello",
	})
	if err != nil {
		t.Fatalf("failed to marshal command request: %v", err)
	}

	commandRequest := httptest.NewRequest(http.MethodPost, "/docker/containers/console/command", bytes.NewReader(commandBody))
	commandResponse := httptest.NewRecorder()
	server.Routes().ServeHTTP(commandResponse, commandRequest)
	if commandResponse.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", commandResponse.Code, commandResponse.Body.String())
	}

	var result docker.ConsoleCommandResult
	if err := json.NewDecoder(commandResponse.Body).Decode(&result); err != nil {
		t.Fatalf("failed to decode command response: %v", err)
	}

	if result.Command != "say hello" || len(result.Output) == 0 {
		t.Fatalf("unexpected command response: %+v", result)
	}
}
