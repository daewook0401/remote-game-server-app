package docker

import (
	"bytes"
	"errors"
	"os/exec"
	"strconv"
	"strings"
)

type CLIAdapter struct {
	dockerPath string
}

func NewCLIAdapter(dockerPath string) *CLIAdapter {
	return &CLIAdapter{dockerPath: dockerPath}
}

func (adapter *CLIAdapter) Status() DockerStatus {
	if err := exec.Command(adapter.dockerPath, "version", "--format", "{{.Server.Version}}").Run(); err != nil {
		return DockerStatus{
			Available: false,
			Mode:      "cli",
			Message:   err.Error(),
		}
	}

	return DockerStatus{
		Available: true,
		Mode:      "cli",
		Message:   "docker cli is available",
	}
}

func (adapter *CLIAdapter) ListManagedContainers() ([]ContainerSummary, error) {
	args := BuildManagedContainerListArgs()
	output, err := exec.Command(adapter.dockerPath, args...).CombinedOutput()
	if err != nil {
		return nil, errors.New(strings.TrimSpace(string(output)))
	}

	return ParseManagedContainerRows(output), nil
}

func (adapter *CLIAdapter) CreateMinecraftServer(request CreateMinecraftServerRequest) (ContainerSummary, error) {
	if !request.EulaAccepted {
		return ContainerSummary{}, errors.New("minecraft eula must be accepted")
	}

	args := BuildMinecraftRunArgs(request)
	output, err := exec.Command(adapter.dockerPath, args...).CombinedOutput()
	if err != nil {
		return ContainerSummary{}, errors.New(strings.TrimSpace(string(output)))
	}

	return ContainerSummary{
		ID:         strings.TrimSpace(string(output)),
		Name:       request.ContainerName,
		Image:      request.Image,
		Status:     "running",
		Port:       request.ExternalPort,
		InstanceID: request.InstanceID,
	}, nil
}

func (adapter *CLIAdapter) ApplyAction(request ContainerActionRequest) (ContainerSummary, error) {
	args, err := BuildContainerActionArgs(request)
	if err != nil {
		return ContainerSummary{}, err
	}

	if output, err := exec.Command(adapter.dockerPath, args...).CombinedOutput(); err != nil {
		return ContainerSummary{}, errors.New(strings.TrimSpace(string(output)))
	}

	status := "running"
	if request.Action == ContainerActionStop {
		status = "stopped"
	}

	return ContainerSummary{
		ID:     request.ContainerID,
		Name:   request.ContainerID,
		Status: status,
	}, nil
}

func (adapter *CLIAdapter) ConsoleSnapshot(request ConsoleAttachRequest) ConsoleSnapshot {
	output, err := exec.Command(adapter.dockerPath, "logs", "--tail", "80", request.ContainerID).CombinedOutput()
	if err != nil {
		return ConsoleSnapshot{
			ContainerID: request.ContainerID,
			Lines:       []string{strings.TrimSpace(string(output)), err.Error()},
		}
	}

	return ConsoleSnapshot{
		ContainerID: request.ContainerID,
		Lines:       splitLines(output),
	}
}

func BuildManagedContainerListArgs() []string {
	return []string{
		"ps",
		"-a",
		"--filter", "label=remote-game-server.managed=true",
		"--format", "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Label \"remote-game-server.instanceId\"}}",
	}
}

func BuildMinecraftRunArgs(request CreateMinecraftServerRequest) []string {
	return []string{
		"run",
		"-d",
		"--name", request.ContainerName,
		"--label", "remote-game-server.managed=true",
		"--label", "remote-game-server.instanceId=" + request.InstanceID,
		"--label", "remote-game-server.templateId=" + request.GameTemplateID,
		"--label", "remote-game-server.targetType=" + request.TargetType,
		"-e", "EULA=TRUE",
		"-e", "MEMORY=" + request.Memory,
		"-p", strconv.Itoa(request.ExternalPort) + ":" + strconv.Itoa(request.InternalPort),
		request.Image,
	}
}

func ParseManagedContainerRows(output []byte) []ContainerSummary {
	rows := splitLines(output)
	containers := make([]ContainerSummary, 0, len(rows))

	for _, row := range rows {
		columns := strings.Split(row, "\t")
		if len(columns) < 5 {
			continue
		}

		instanceID := ""
		if len(columns) > 5 {
			instanceID = columns[5]
		}

		containers = append(containers, ContainerSummary{
			ID:         columns[0],
			Name:       columns[1],
			Image:      columns[2],
			Status:     normalizeDockerStatus(columns[3]),
			Port:       parseDockerPort(columns[4]),
			InstanceID: instanceID,
		})
	}

	return containers
}

func BuildContainerActionArgs(request ContainerActionRequest) ([]string, error) {
	switch request.Action {
	case ContainerActionStart:
		return []string{"start", request.ContainerID}, nil
	case ContainerActionStop:
		return []string{"stop", request.ContainerID}, nil
	case ContainerActionDelete:
		return []string{"rm", "-f", request.ContainerID}, nil
	default:
		return nil, errors.New("unsupported container action")
	}
}

func normalizeDockerStatus(rawStatus string) string {
	if strings.HasPrefix(strings.ToLower(rawStatus), "up") {
		return "running"
	}

	return "stopped"
}

func parseDockerPort(rawPorts string) int {
	for _, token := range strings.FieldsFunc(rawPorts, func(char rune) bool {
		return char == ':' || char == '-' || char == '>' || char == '/' || char == ','
	}) {
		port, err := strconv.Atoi(strings.TrimSpace(token))
		if err == nil && port > 0 {
			return port
		}
	}

	return 0
}

func splitLines(output []byte) []string {
	normalized := bytes.ReplaceAll(output, []byte("\r\n"), []byte("\n"))
	rawLines := strings.Split(strings.TrimSpace(string(normalized)), "\n")
	if len(rawLines) == 1 && rawLines[0] == "" {
		return []string{}
	}

	return rawLines
}
