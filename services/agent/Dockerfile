FROM golang:1.23-alpine AS builder

WORKDIR /src
COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal
RUN go build -o /out/agent ./cmd/agent

FROM alpine:3.20

RUN apk add --no-cache docker-cli ca-certificates
WORKDIR /opt/remote-game-agent
COPY --from=builder /out/agent /opt/remote-game-agent/agent

ENV AGENT_ADDR=0.0.0.0:18080
ENV AGENT_DOCKER_MODE=cli
ENV AGENT_DOCKER_PATH=docker

EXPOSE 18080
ENTRYPOINT ["/opt/remote-game-agent/agent"]
