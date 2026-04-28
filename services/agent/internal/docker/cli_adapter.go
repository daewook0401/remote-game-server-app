package docker

import (
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
)

type CLIAdapter struct {
	dockerPath string
	stateFile  string
}

func NewCLIAdapter(dockerPath string, stateFile string) *CLIAdapter {
	return &CLIAdapter{dockerPath: dockerPath, stateFile: stateFile}
}

func (adapter *CLIAdapter) Status() DockerStatus {
	if err := exec.Command(adapter.dockerPath, "version", "--format", "{{.Server.Version}}").Run(); err != nil {
		return DockerStatus{
			Available: false,
			Mode:      "cli",
			Message:   err.Error(),
		}
	}

	dockerRootDir := adapter.dockerRootDir()
	return DockerStatus{
		Available:     true,
		Mode:          "cli",
		Message:       "docker cli is available",
		DockerRootDir: dockerRootDir,
		IsSnapDocker:  isSnapDockerRoot(dockerRootDir),
	}
}

func (adapter *CLIAdapter) dockerRootDir() string {
	output, err := exec.Command(adapter.dockerPath, "info", "--format", "{{.DockerRootDir}}").CombinedOutput()
	if err != nil {
		return ""
	}

	return strings.TrimSpace(string(output))
}

func (adapter *CLIAdapter) ListManagedContainers() ([]ContainerSummary, error) {
	args := BuildManagedContainerListArgs()
	output, err := exec.Command(adapter.dockerPath, args...).CombinedOutput()
	if err != nil {
		containers, stateErr := adapter.loadManagedState()
		if stateErr == nil {
			return containers, nil
		}

		return nil, errors.New(strings.TrimSpace(string(output)))
	}

	containers := ParseManagedContainerRows(output)
	_ = adapter.saveManagedState(containers)
	return containers, nil
}

func (adapter *CLIAdapter) CreateMinecraftServer(request CreateMinecraftServerRequest) (ContainerSummary, error) {
	if !request.EulaAccepted {
		return ContainerSummary{}, errors.New("minecraft eula must be accepted")
	}

	request = adapter.normalizeMinecraftServerRequest(request)
	if request.VolumePath != "" {
		if err := ensureManagedVolumePath(request.VolumePath); err != nil {
			return ContainerSummary{}, err
		}
	}

	args := BuildMinecraftRunArgs(request)
	output, err := exec.Command(adapter.dockerPath, args...).CombinedOutput()
	if err != nil {
		return ContainerSummary{}, errors.New(strings.TrimSpace(string(output)))
	}

	container := ContainerSummary{
		ID:         strings.TrimSpace(string(output)),
		Name:       request.ContainerName,
		Image:      request.Image,
		Status:     "running",
		Port:       request.ExternalPort,
		InstanceID: request.InstanceID,
		VolumePath: request.VolumePath,
	}
	_ = adapter.upsertManagedState(container)
	return container, nil
}

func (adapter *CLIAdapter) ApplyAction(request ContainerActionRequest) (ContainerSummary, error) {
	args, err := BuildContainerActionArgs(request)
	if err != nil {
		return ContainerSummary{}, err
	}

	if output, err := exec.Command(adapter.dockerPath, args...).CombinedOutput(); err != nil {
		return ContainerSummary{}, errors.New(strings.TrimSpace(string(output)))
	}

	if request.Action == ContainerActionDelete {
		if request.DeleteData && request.VolumePath != "" {
			if err := removeManagedVolumePath(request.VolumePath); err != nil {
				return ContainerSummary{}, err
			}
		}
		_ = adapter.removeManagedState(request.ContainerID)
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

func (adapter *CLIAdapter) ExecuteConsoleCommand(request ConsoleCommandRequest) (ConsoleCommandResult, error) {
	command := strings.TrimSpace(request.Command)
	if command == "" {
		return ConsoleCommandResult{}, errors.New("console command is required")
	}

	output, err := exec.Command(adapter.dockerPath, "exec", request.ContainerID, "rcon-cli", command).CombinedOutput()
	lines := splitLines(output)
	if err != nil {
		return ConsoleCommandResult{}, errors.New(strings.TrimSpace(string(output)))
	}

	return ConsoleCommandResult{
		ContainerID: request.ContainerID,
		Command:     command,
		Output:      lines,
	}, nil
}

func (adapter *CLIAdapter) loadManagedState() ([]ContainerSummary, error) {
	if adapter.stateFile == "" {
		return nil, errors.New("agent state file is not configured")
	}

	content, err := os.ReadFile(adapter.stateFile)
	if err != nil {
		return nil, err
	}

	var containers []ContainerSummary
	if err := json.Unmarshal(content, &containers); err != nil {
		return nil, err
	}

	return containers, nil
}

func (adapter *CLIAdapter) saveManagedState(containers []ContainerSummary) error {
	if adapter.stateFile == "" {
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(adapter.stateFile), 0o755); err != nil {
		return err
	}

	content, err := json.MarshalIndent(containers, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(adapter.stateFile, content, 0o644)
}

func (adapter *CLIAdapter) upsertManagedState(container ContainerSummary) error {
	containers, err := adapter.loadManagedState()
	if err != nil {
		containers = []ContainerSummary{}
	}

	next := make([]ContainerSummary, 0, len(containers)+1)
	for _, current := range containers {
		if current.ID != container.ID && current.Name != container.Name {
			next = append(next, current)
		}
	}

	next = append(next, container)
	return adapter.saveManagedState(next)
}

func (adapter *CLIAdapter) removeManagedState(containerID string) error {
	containers, err := adapter.loadManagedState()
	if err != nil {
		return err
	}

	next := make([]ContainerSummary, 0, len(containers))
	for _, container := range containers {
		if container.ID != containerID && container.Name != containerID {
			next = append(next, container)
		}
	}

	return adapter.saveManagedState(next)
}

func BuildManagedContainerListArgs() []string {
	return []string{
		"ps",
		"-a",
		"--filter", "label=remote-game-server.managed=true",
		"--format", "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Label \"remote-game-server.instanceId\"}}\t{{.Label \"remote-game-server.volumePath\"}}",
	}
}

func BuildMinecraftRunArgs(request CreateMinecraftServerRequest) []string {
	request = NormalizeMinecraftServerRequest(request)
	args := []string{
		"run",
		"-d",
		"--name", request.ContainerName,
		"--label", "remote-game-server.managed=true",
		"--label", "remote-game-server.instanceId=" + request.InstanceID,
		"--label", "remote-game-server.templateId=" + request.GameTemplateID,
		"--label", "remote-game-server.targetType=" + request.TargetType,
		"--label", "remote-game-server.volumePath=" + request.VolumePath,
		"-e", "EULA=TRUE",
		"-e", "MEMORY=" + request.Memory,
		"-p", strconv.Itoa(request.ExternalPort) + ":" + strconv.Itoa(request.InternalPort),
	}

	if request.VolumePath != "" {
		args = append(args, "-v", request.VolumePath+":/data")
	}

	args = append(args, request.Image)
	return args
}

func (adapter *CLIAdapter) normalizeMinecraftServerRequest(request CreateMinecraftServerRequest) CreateMinecraftServerRequest {
	return adapter.normalizeMinecraftServerRequestWithRoot(request, adapter.dockerRootDir())
}

func (adapter *CLIAdapter) normalizeMinecraftServerRequestWithRoot(request CreateMinecraftServerRequest, dockerRootDir string) CreateMinecraftServerRequest {
	request = NormalizeMinecraftServerRequest(request)
	if !isSnapDockerRoot(dockerRootDir) {
		return request
	}

	if request.GameTemplateID != "minecraft-java" || strings.TrimSpace(request.ContainerName) == "" {
		return request
	}

	if shouldUseSnapSafeVolumePath(request.VolumePath) {
		request.VolumePath = buildHomeVolumePath(request.SSHUser, "minecraft", request.ContainerName)
	}

	return request
}

func NormalizeMinecraftServerRequest(request CreateMinecraftServerRequest) CreateMinecraftServerRequest {
	if strings.TrimSpace(request.VolumePath) != "" {
		request.VolumePath = cleanManagedVolumePath(request.VolumePath)
		return request
	}

	if request.GameTemplateID == "minecraft-java" && strings.TrimSpace(request.ContainerName) != "" {
		request.VolumePath = "/remote-game-server/volume/minecraft/" + sanitizePathSegment(request.ContainerName)
	}

	return request
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
		volumePath := ""
		if len(columns) > 6 {
			volumePath = columns[6]
		}

		containers = append(containers, ContainerSummary{
			ID:         columns[0],
			Name:       columns[1],
			Image:      columns[2],
			Status:     normalizeDockerStatus(columns[3]),
			Port:       parseDockerPort(columns[4]),
			InstanceID: instanceID,
			VolumePath: volumePath,
		})
	}

	return containers
}

func removeManagedVolumePath(volumePath string) error {
	cleanPath := cleanManagedVolumePath(volumePath)
	if !isSafeManagedVolumePath(cleanPath) {
		return errors.New("refusing to delete unmanaged volume path")
	}

	return os.RemoveAll(cleanPath)
}

func ensureManagedVolumePath(volumePath string) error {
	cleanPath := cleanManagedVolumePath(volumePath)
	if !isSafeManagedVolumePath(cleanPath) {
		return errors.New("refusing to create unmanaged volume path")
	}

	if err := os.MkdirAll(cleanPath, 0o777); err != nil {
		return err
	}

	return os.Chmod(cleanPath, 0o777)
}

func isSafeManagedVolumePath(volumePath string) bool {
	normalized := cleanManagedVolumePath(volumePath)
	if strings.HasPrefix(normalized, "/remote-game-server/volume/") && len(strings.Split(strings.Trim(normalized, "/"), "/")) >= 4 {
		return true
	}

	parts := strings.Split(strings.Trim(normalized, "/"), "/")
	return len(parts) >= 5 && parts[0] == "home" && parts[2] == "remote-game-server" && parts[3] == "volume"
}

func cleanManagedVolumePath(volumePath string) string {
	return path.Clean(filepath.ToSlash(strings.TrimSpace(volumePath)))
}

func sanitizePathSegment(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "server"
	}

	var builder strings.Builder
	for _, char := range trimmed {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char == '_' || char == '-' || char == '.' {
			builder.WriteRune(char)
			continue
		}

		builder.WriteRune('-')
	}

	result := strings.Trim(builder.String(), ".-")
	if result == "" {
		return "server"
	}

	return result
}

func isSnapDockerRoot(dockerRootDir string) bool {
	return strings.HasPrefix(cleanManagedVolumePath(dockerRootDir), "/var/snap/docker/")
}

func shouldUseSnapSafeVolumePath(volumePath string) bool {
	normalized := cleanManagedVolumePath(volumePath)
	return normalized == "." || normalized == "" || strings.HasPrefix(normalized, "/remote-game-server/volume/")
}

func buildHomeVolumePath(sshUser string, gameName string, serverName string) string {
	user := sanitizePathSegment(sshUser)
	if user == "server" {
		user = "remote-game-server"
	}

	return "/home/" + user + "/remote-game-server/volume/" + sanitizePathSegment(gameName) + "/" + sanitizePathSegment(serverName)
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
