package main

import (
	"log"
	"net/http"

	"github.com/daewook0401/remote-game-server-app/services/agent/internal/api"
	"github.com/daewook0401/remote-game-server-app/services/agent/internal/docker"
)

func main() {
	server := api.NewServer(docker.NewServiceFromEnvironment())
	log.Fatal(http.ListenAndServe("127.0.0.1:18080", server.Routes()))
}
