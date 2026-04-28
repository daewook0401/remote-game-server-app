package docker

import (
	"errors"
	"sort"
)

type MemoryAdapter struct {
	containers map[string]ContainerSummary
}

func NewMemoryAdapter() *MemoryAdapter {
	return &MemoryAdapter{
		containers: make(map[string]ContainerSummary),
	}
}

func (adapter *MemoryAdapter) Status() DockerStatus {
	return DockerStatus{
		Available: true,
		Mode:      "memory",
		Message:   "memory docker adapter is active",
	}
}

func (adapter *MemoryAdapter) ListManagedContainers() ([]ContainerSummary, error) {
	containers := make([]ContainerSummary, 0, len(adapter.containers))
	for _, container := range adapter.containers {
		containers = append(containers, container)
	}

	sort.Slice(containers, func(left, right int) bool {
		return containers[left].Name < containers[right].Name
	})

	return containers, nil
}

func (adapter *MemoryAdapter) CreateMinecraftServer(request CreateMinecraftServerRequest) (ContainerSummary, error) {
	if !request.EulaAccepted {
		return ContainerSummary{}, errors.New("minecraft eula must be accepted")
	}

	container := ContainerSummary{
		ID:         "mc-" + request.ContainerName,
		Name:       request.ContainerName,
		Image:      request.Image,
		Status:     "running",
		Port:       request.ExternalPort,
		InstanceID: request.InstanceID,
	}

	adapter.containers[container.ID] = container
	return container, nil
}

func (adapter *MemoryAdapter) ApplyAction(request ContainerActionRequest) (ContainerSummary, error) {
	container, ok := adapter.containers[request.ContainerID]
	if !ok {
		return ContainerSummary{}, errors.New("container not found")
	}

	switch request.Action {
	case ContainerActionStart:
		container.Status = "running"
	case ContainerActionStop:
		container.Status = "stopped"
	case ContainerActionDelete:
		delete(adapter.containers, request.ContainerID)
		return container, nil
	default:
		return ContainerSummary{}, errors.New("unsupported container action")
	}

	adapter.containers[request.ContainerID] = container
	return container, nil
}

func (adapter *MemoryAdapter) ConsoleSnapshot(request ConsoleAttachRequest) ConsoleSnapshot {
	return ConsoleSnapshot{
		ContainerID: request.ContainerID,
		Lines: []string{
			"[agent] console attach requested",
			"[agent] memory docker adapter is active",
			"> ",
		},
	}
}
