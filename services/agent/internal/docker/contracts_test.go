package docker

import (
	"strings"
	"testing"
)

func TestCreateMinecraftServerRequestRequiresEula(t *testing.T) {
	request := CreateMinecraftServerRequest{
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

	if !request.EulaAccepted {
		t.Fatal("expected EULA to be accepted for Minecraft server creation")
	}
}

func TestContainerActionConstants(t *testing.T) {
	if ContainerActionStart != "start" {
		t.Fatalf("unexpected start action %q", ContainerActionStart)
	}

	if ContainerActionStop != "stop" {
		t.Fatalf("unexpected stop action %q", ContainerActionStop)
	}

	if ContainerActionDelete != "delete" {
		t.Fatalf("unexpected delete action %q", ContainerActionDelete)
	}
}

func TestBuildMinecraftRunArgs(t *testing.T) {
	request := CreateMinecraftServerRequest{
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

	args := BuildMinecraftRunArgs(request)
	joined := strings.Join(args, " ")

	expectedParts := []string{
		"run",
		"-d",
		"--name minecraft-survival",
		"--label remote-game-server.managed=true",
		"--label remote-game-server.instanceId=instance-1",
		"-e EULA=TRUE",
		"-e MEMORY=2G",
		"-p 25565:25565",
		"itzg/minecraft-server",
	}

	for _, expected := range expectedParts {
		if !strings.Contains(joined, expected) {
			t.Fatalf("expected docker args to contain %q, got %q", expected, joined)
		}
	}
}

func TestBuildManagedContainerListArgs(t *testing.T) {
	args := BuildManagedContainerListArgs()
	joined := strings.Join(args, " ")

	expectedParts := []string{
		"ps -a",
		"--filter label=remote-game-server.managed=true",
		"--format",
		"remote-game-server.instanceId",
	}

	for _, expected := range expectedParts {
		if !strings.Contains(joined, expected) {
			t.Fatalf("expected docker list args to contain %q, got %q", expected, joined)
		}
	}
}

func TestParseManagedContainerRows(t *testing.T) {
	output := []byte("abc123\tminecraft-survival\titzg/minecraft-server\tUp 3 minutes\t0.0.0.0:25565->25565/tcp\tinstance-1\n")
	containers := ParseManagedContainerRows(output)

	if len(containers) != 1 {
		t.Fatalf("expected one container, got %d", len(containers))
	}

	container := containers[0]
	if container.ID != "abc123" || container.Name != "minecraft-survival" || container.Status != "running" || container.Port != 25565 || container.InstanceID != "instance-1" {
		t.Fatalf("unexpected parsed container: %+v", container)
	}
}

func TestBuildContainerActionArgs(t *testing.T) {
	args, err := BuildContainerActionArgs(ContainerActionRequest{
		ContainerID: "mc-01",
		Action:      ContainerActionStop,
	})
	if err != nil {
		t.Fatalf("expected stop args to succeed: %v", err)
	}

	if strings.Join(args, " ") != "stop mc-01" {
		t.Fatalf("unexpected stop args: %v", args)
	}
}
