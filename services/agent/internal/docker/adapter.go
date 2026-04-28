package docker

type Adapter interface {
	Status() DockerStatus
	ListManagedContainers() ([]ContainerSummary, error)
	CreateMinecraftServer(request CreateMinecraftServerRequest) (ContainerSummary, error)
	ApplyAction(request ContainerActionRequest) (ContainerSummary, error)
	ConsoleSnapshot(request ConsoleAttachRequest) ConsoleSnapshot
}
