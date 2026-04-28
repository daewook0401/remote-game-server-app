package main

import (
	"log"
	"net/http"
	"os"

	"github.com/daewook0401/remote-game-server-app/services/agent/internal/api"
	"github.com/daewook0401/remote-game-server-app/services/agent/internal/docker"
)

func main() {
	server := api.NewServerWithToken(docker.NewServiceFromEnvironment(), os.Getenv("AGENT_TOKEN"))
	log.Fatal(http.ListenAndServe("127.0.0.1:18080", server.Routes()))
}
