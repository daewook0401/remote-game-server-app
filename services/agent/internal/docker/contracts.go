package docker

type CreateMinecraftServerRequest struct {
	ServerID       string `json:"serverId"`
	TargetType     string `json:"targetType"`
	SSHHost        string `json:"sshHost,omitempty"`
	SSHPort        int    `json:"sshPort,omitempty"`
	SSHUser        string `json:"sshUser,omitempty"`
	GameTemplateID string `json:"gameTemplateId"`
	InstanceID     string `json:"instanceId"`
	ContainerName  string `json:"containerName"`
	Image          string `json:"image"`
	InternalPort   int    `json:"internalPort"`
	ExternalPort   int    `json:"externalPort"`
	Memory         string `json:"memory"`
	EulaAccepted   bool   `json:"eulaAccepted"`
}

type ContainerActionRequest struct {
	ContainerID string          `json:"containerId"`
	Action      ContainerAction `json:"action"`
}

type ContainerAction string

const (
	ContainerActionStart  ContainerAction = "start"
	ContainerActionStop   ContainerAction = "stop"
	ContainerActionDelete ContainerAction = "delete"
)

type ConsoleAttachRequest struct {
	ContainerID string `json:"containerId"`
}

type ContainerSummary struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Image      string `json:"image"`
	Status     string `json:"status"`
	Port       int    `json:"port"`
	InstanceID string `json:"instanceId"`
}

type ConsoleSnapshot struct {
	ContainerID string   `json:"containerId"`
	Lines       []string `json:"lines"`
}

type DockerStatus struct {
	Available bool   `json:"available"`
	Mode      string `json:"mode"`
	Message   string `json:"message"`
}
