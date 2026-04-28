import type { DockerIssue, ServerOsType } from "../types/server";

interface DockerInstallGuideProps {
  issue: DockerIssue;
  osType: ServerOsType;
}

const installCommands: Record<ServerOsType, string[]> = {
  "linux-ubuntu": [
    "sudo apt-get update",
    "sudo apt-get install -y ca-certificates curl gnupg",
    "curl -fsSL https://get.docker.com | sudo sh",
    "sudo usermod -aG docker $USER"
  ],
  "linux-fedora": [
    "sudo dnf install -y dnf-plugins-core",
    "sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo",
    "sudo dnf install -y docker-ce docker-ce-cli containerd.io",
    "sudo systemctl enable --now docker"
  ],
  "linux-arch": [
    "sudo pacman -Syu docker",
    "sudo systemctl enable --now docker",
    "sudo usermod -aG docker $USER"
  ],
  linux: [
    "curl -fsSL https://get.docker.com | sudo sh",
    "sudo systemctl enable --now docker",
    "sudo usermod -aG docker $USER"
  ],
  windows: [
    "winget install Docker.DockerDesktop",
    "Docker Desktop 실행 후 WSL2 backend 활성화"
  ],
  macos: [
    "brew install --cask docker",
    "Docker.app 실행"
  ]
};

const daemonCommands: Record<ServerOsType, string[]> = {
  "linux-ubuntu": ["sudo systemctl enable --now docker", "sudo systemctl status docker"],
  "linux-fedora": ["sudo systemctl enable --now docker", "sudo systemctl status docker"],
  "linux-arch": ["sudo systemctl enable --now docker", "sudo systemctl status docker"],
  linux: ["sudo systemctl enable --now docker", "sudo systemctl status docker"],
  windows: ["Docker Desktop 실행", "Settings에서 Docker Engine 상태 확인"],
  macos: ["Docker.app 실행", "Docker Desktop 상태 확인"]
};

const permissionCommands: Record<ServerOsType, string[]> = {
  "linux-ubuntu": ["sudo usermod -aG docker $USER", "newgrp docker"],
  "linux-fedora": ["sudo usermod -aG docker $USER", "newgrp docker"],
  "linux-arch": ["sudo usermod -aG docker $USER", "newgrp docker"],
  linux: ["sudo usermod -aG docker $USER", "newgrp docker"],
  windows: ["관리자 권한 또는 Docker Desktop 권한 확인"],
  macos: ["Docker Desktop 권한과 socket 접근 확인"]
};

function commandsForIssue(osType: ServerOsType, issue: DockerIssue) {
  if (issue === "daemonStopped") return daemonCommands[osType];
  if (issue === "permissionDenied") return permissionCommands[osType];
  return installCommands[osType];
}

function titleForIssue(issue: DockerIssue) {
  if (issue === "daemonStopped") return "Docker 실행 안내";
  if (issue === "permissionDenied") return "Docker 권한 안내";
  return "Docker 설치 안내";
}

export function DockerInstallGuide({ issue, osType }: DockerInstallGuideProps) {
  return (
    <article className="panel widePanel guidePanel">
      <div className="panelHeader">
        <h2>{titleForIssue(issue)}</h2>
      </div>
      <div className="commandList">
        {commandsForIssue(osType, issue).map((command) => (
          <code key={command}>{command}</code>
        ))}
      </div>
    </article>
  );
}
