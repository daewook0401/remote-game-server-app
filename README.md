# OpenServerHub

OpenServerHub is a desktop application for registering, preparing, and operating game servers across local machines, SSH-accessible Linux servers, and private network servers reached through an external relay node.

The project focuses on a practical workflow: connect to a server, install a lightweight Agent, verify Docker access, create a game server container, open the required ports, and manage the running server from one desktop UI.

Korean documentation is available in [README_kor.md](README_kor.md).

## What Is Implemented

- Electron + React desktop application
- Server-first management UI with a server list, server detail screen, and guide screen
- Local server and SSH Linux server registration
- External-network relay mode using an HAProxy node to reach an internal private server
- SSH connection checks, including direct SSH and jump/relay SSH paths
- Linux Agent install, update, removal, and token-based API access
- Automatic Agent API verification before a server can be registered
- Docker CLI based server discovery and container control through the Agent
- Minecraft Java server creation with EULA confirmation, memory setting, port setting, and persistent volume paths
- Container start, stop, delete, console log viewing, and console command sending
- Internal server firewall port open/close flows
- HAProxy TCP route creation/removal for Agent and game ports
- HAProxy install detection and guided installation on the relay node
- Cleanup flows for deleting containers, firewall rules, HAProxy game routes, registered servers, and remote Agent data

## How It Works

OpenServerHub has two main parts.

The desktop app runs on the operator machine. It stores registered server metadata locally, performs SSH operations through Electron, and talks to the server Agent through HTTP.

The Agent runs on the target server. It exposes a small API used by the desktop app to check Docker status, list managed containers, create Minecraft containers, stream console logs, send console commands, and remove containers.

For a private internal server, OpenServerHub can use an external HAProxy node. The desktop app connects to the external node by SSH, applies TCP proxy routes, opens the external firewall port, then uses the HAProxy endpoint to reach the internal Agent or game server.

## Typical Usage

1. Open the desktop app.
2. Click **Add Server**.
3. Choose the connection path:
   - direct SSH server
   - external HAProxy relay to an internal server
4. Run **SSH Check**.
5. Install or update the Agent and set the Agent port.
6. Register the server only after the Agent API is reachable.
7. Enter the server detail screen.
8. Create a Minecraft Java server.
9. Manage the container with start, stop, console, and delete actions.

When a game server is created in HAProxy relay mode, the app opens the internal game port, applies the external HAProxy TCP route, and opens the relay firewall port. When the container is deleted, the app can close the related firewall rules and remove only the game route while keeping the Agent route alive.

## Current Game Support

The current implemented template is Minecraft Java.

Minecraft data is stored in persistent server-side volume paths:

```text
/remote-game-server/volume/{game}/{server-name}
```

For Snap Docker environments, OpenServerHub uses a home-directory path to avoid bind mount restrictions:

```text
/home/{sshUser}/remote-game-server/volume/{game}/{server-name}
```

## Security Model

The Agent is not intended to be left as an unauthenticated public endpoint. OpenServerHub issues and stores an Agent token during setup, then uses that token for Agent API calls.

For remote Linux actions that require elevated privileges, the desktop app asks for an SSH or sudo password at the moment of the operation. These passwords are used for the current action and are not stored as part of the registered server record.

For HAProxy relay setups, firewall and route changes can require credentials for both the internal server and the external relay node.

## Development

Install dependencies:

```bash
npm install
```

Run the desktop app in development:

```bash
npm run desktop:dev
```

Electron-only features such as SSH, Agent installation, firewall changes, and local storage must be tested in the Electron runtime, not only in a browser tab.

Build and type-check:

```bash
npm run desktop:typecheck
npm run desktop:build
```

Run Go tests from the service modules:

```bash
cd services/agent
go test ./...
```

```bash
cd services/relay
go test ./...
```

## Project Structure

```text
apps/
  desktop/      Electron, React, TypeScript, and Vite desktop app
services/
  agent/        Go Agent installed on managed servers
  relay/        Experimental relay service area
docs/
  plans/        Planning documents
  working/      Stage-by-stage working notes
  feedback/     Feedback and decision records
  troubleshooting/
scripts/        Build and helper scripts
```

## Collaboration With AI

OpenServerHub has been developed with an AI pair-programming workflow. The human operator owns direction, architecture, approval, and final testing. The AI collaborator writes implementation plans, modifies code after approval, records working documents, runs local verification, and responds to real test feedback from the operator's servers.

This workflow shaped several parts of the project:

- server-first navigation replaced a feature-first sidebar
- Agent status checks became automatic on server entry
- public exposure controls were removed from the main navigation
- HAProxy relay support was added after private-network testing
- firewall cleanup, Agent cleanup, and HAProxy route cleanup were refined from live failure reports
- large UI files started being split into smaller components after the operator requested stricter maintainability

The repository intentionally keeps planning, reports, feedback notes, and troubleshooting documents under `docs/` so implementation decisions remain traceable.
