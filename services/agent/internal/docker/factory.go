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

	return NewService(NewCLIAdapter(dockerPath))
}
