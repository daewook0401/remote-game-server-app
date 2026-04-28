package frp

import (
	"strings"
	"testing"
)

func TestRenderClientConfig(t *testing.T) {
	config := ProxyConfig{
		ServerAddress: "relay.example.com",
		ServerPort:    7000,
		ProxyName:     "minecraft-java-25565",
		LocalIP:       "127.0.0.1",
		LocalPort:     25565,
		RemotePort:    31001,
		Protocol:      "tcp",
	}

	rendered := RenderClientConfig(config)

	expectedParts := []string{
		"server_addr = relay.example.com",
		"server_port = 7000",
		"[minecraft-java-25565]",
		"type = tcp",
		"local_ip = 127.0.0.1",
		"local_port = 25565",
		"remote_port = 31001",
	}

	for _, expected := range expectedParts {
		if !strings.Contains(rendered, expected) {
			t.Fatalf("expected rendered config to contain %q, got:\n%s", expected, rendered)
		}
	}
}

func TestNewProxyConfig(t *testing.T) {
	request := CreateProxyRequest{
		GameInstanceID: "server-1",
		GameName:       "minecraft-java",
		InternalPort:   25565,
		RemotePort:     31001,
		Protocol:       "tcp",
		RelayHost:      "relay.example.com",
		RelayPort:      7000,
	}

	config := NewProxyConfig(request)

	if config.ServerAddress != "relay.example.com" {
		t.Fatalf("expected relay host, got %q", config.ServerAddress)
	}

	if config.ProxyName != "minecraft-java-server-1-25565" {
		t.Fatalf("expected deterministic proxy name, got %q", config.ProxyName)
	}

	if config.LocalPort != 25565 || config.RemotePort != 31001 {
		t.Fatalf("expected local and remote ports to match request, got %+v", config)
	}
}
