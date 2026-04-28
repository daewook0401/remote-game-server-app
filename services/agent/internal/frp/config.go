package frp

import "fmt"

type CreateProxyRequest struct {
	GameInstanceID string
	GameName       string
	InternalPort   int
	RemotePort     int
	Protocol       string
	RelayHost      string
	RelayPort      int
}

type ProxyConfig struct {
	ServerAddress string
	ServerPort    int
	ProxyName     string
	LocalIP       string
	LocalPort     int
	RemotePort    int
	Protocol      string
}

func NewProxyConfig(request CreateProxyRequest) ProxyConfig {
	return ProxyConfig{
		ServerAddress: request.RelayHost,
		ServerPort:    request.RelayPort,
		ProxyName:     fmt.Sprintf("%s-%s-%d", request.GameName, request.GameInstanceID, request.InternalPort),
		LocalIP:       "127.0.0.1",
		LocalPort:     request.InternalPort,
		RemotePort:    request.RemotePort,
		Protocol:      request.Protocol,
	}
}

func RenderClientConfig(config ProxyConfig) string {
	return fmt.Sprintf(`[common]
server_addr = %s
server_port = %d

[%s]
type = %s
local_ip = %s
local_port = %d
remote_port = %d
`, config.ServerAddress, config.ServerPort, config.ProxyName, config.Protocol, config.LocalIP, config.LocalPort, config.RemotePort)
}
