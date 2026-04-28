package docker

const AgentVersion = "0.1.2"

type Service struct {
	adapter Adapter
}

func NewService(adapter Adapter) *Service {
	return &Service{adapter: adapter}
}

func NewMemoryService() *Service {
	return NewService(NewMemoryAdapter())
}

func (service *Service) Status() DockerStatus {
	status := service.adapter.Status()
	status.AgentVersion = AgentVersion
	return status
}

func (service *Service) ListManagedContainers() ([]ContainerSummary, error) {
	return service.adapter.ListManagedContainers()
}

func (service *Service) CreateMinecraftServer(request CreateMinecraftServerRequest) (ContainerSummary, error) {
	return service.adapter.CreateMinecraftServer(request)
}

func (service *Service) ApplyAction(request ContainerActionRequest) (ContainerSummary, error) {
	return service.adapter.ApplyAction(request)
}

func (service *Service) ConsoleSnapshot(request ConsoleAttachRequest) ConsoleSnapshot {
	return service.adapter.ConsoleSnapshot(request)
}
