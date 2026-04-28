package docker

import "os"

func NewServiceFromEnvironment() *Service {
	if os.Getenv("AGENT_DOCKER_MODE") == "memory" {
		return NewMemoryService()
	}

	dockerPath := os.Getenv("AGENT_DOCKER_PATH")
	if dockerPath == "" {
		dockerPath = "docker"
	}

	stateFile := os.Getenv("AGENT_STATE_FILE")
	if stateFile == "" {
		stateFile = "/opt/remote-game-agent/data/servers.json"
	}

	return NewService(NewCLIAdapter(dockerPath, stateFile))
}
