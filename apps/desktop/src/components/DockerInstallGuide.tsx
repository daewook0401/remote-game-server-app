import type { ServerOsType } from "../types/server";

interface DockerInstallGuideProps {
  osType: ServerOsType;
}

const guideCommands: Record<ServerOsType, string[]> = {
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

export function DockerInstallGuide({ osType }: DockerInstallGuideProps) {
  return (
    <article className="panel widePanel guidePanel">
      <div className="panelHeader">
        <h2>Docker 설치 안내</h2>
      </div>
      <div className="commandList">
        {guideCommands[osType].map((command) => (
          <code key={command}>{command}</code>
        ))}
      </div>
    </article>
  );
}
