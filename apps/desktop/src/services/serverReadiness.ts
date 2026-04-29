import type { DockerStatusResponse } from "../types/api";
import type { DockerIssue, ManagedServer, ServerCreateForm, ServerCreateReadiness } from "../types/server";

interface BuildCreateReadinessOptions {
  activeServer?: ManagedServer;
  createForm: ServerCreateForm;
  dockerStatus?: DockerStatusResponse;
  expectedAgentVersion: string;
  isAgentVersionCurrent: boolean;
}

export function dockerMessage(issue: DockerIssue) {
  if (issue === "none") return "준비됨";
  if (issue === "notInstalled") return "미설치";
  if (issue === "daemonStopped") return "daemon 미실행";
  if (issue === "permissionDenied") return "권한 부족";
  return "확인 필요";
}

export function buildCreateReadiness({
  activeServer,
  createForm,
  dockerStatus,
  expectedAgentVersion,
  isAgentVersionCurrent
}: BuildCreateReadinessOptions): ServerCreateReadiness {
  const selectedServer = Boolean(activeServer);
  const agentChecked = Boolean(dockerStatus?.available);
  const dockerReady = dockerStatus?.mode === "cli";
  const hasServerName = createForm.serverName.trim().length > 0;
  const validPorts = createForm.internalPort > 0 && createForm.externalPort > 0;
  const eulaAccepted = createForm.eulaAccepted;
  const targetReady = activeServer?.targetType === "local" || activeServer?.agentStatus === "connected";

  const items = [
    { label: "서버 선택", ok: selectedServer },
    { label: "Agent API 자동 확인", ok: agentChecked },
    { label: `Agent 버전 ${expectedAgentVersion}`, ok: isAgentVersionCurrent },
    { label: "실제 Docker mode", ok: dockerReady },
    { label: "원격/클라우드 Agent 연결", ok: Boolean(targetReady) },
    { label: "서버 이름 입력", ok: hasServerName },
    { label: "포트 입력", ok: validPorts },
    { label: "Minecraft EULA 동의", ok: eulaAccepted }
  ];

  const canCreate =
    selectedServer && agentChecked && isAgentVersionCurrent && dockerReady && hasServerName && validPorts && eulaAccepted && Boolean(targetReady);

  if (!selectedServer) {
    return { canCreate: false, items, message: "서버를 먼저 선택하세요." };
  }

  if (!agentChecked) {
    return { canCreate: false, items, message: "서버 선택 후 Agent API 자동 확인이 완료되어야 합니다." };
  }

  if (!isAgentVersionCurrent) {
    return { canCreate: false, items, message: "Agent 버전이 오래되었습니다. Agent 설치/업데이트를 실행하세요." };
  }

  if (!dockerReady) {
    return { canCreate: false, items, message: "실제 Docker CLI mode가 확인되어야 Minecraft 서버를 생성할 수 있습니다." };
  }

  if (!targetReady) {
    return { canCreate: false, items, message: "원격/클라우드 서버는 Agent 설치/업데이트 후 API 접근이 확인되어야 합니다." };
  }

  if (!hasServerName || !validPorts || !eulaAccepted) {
    return { canCreate: false, items, message: "서버 이름, 포트, EULA 동의를 확인하세요." };
  }

  return { canCreate, items, message: "서버 생성을 진행할 수 있습니다." };
}
