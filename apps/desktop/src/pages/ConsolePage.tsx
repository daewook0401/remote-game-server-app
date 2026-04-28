import { useEffect, useMemo, useState } from "react";
import { Topbar } from "../components/Topbar";
import {
  getConsoleSnapshot,
  listManagedContainers,
  sendConsoleCommand
} from "../services/agentClient";
import { loadStoredServers } from "../services/serverStorage";
import type { ContainerSummaryResponse } from "../types/api";
import type { ManagedServer } from "../types/server";

const localServer: ManagedServer = {
  id: "local",
  name: "내 로컬 서버",
  targetType: "local",
  osType: "windows",
  host: "localhost",
  agentBaseUrl: "http://127.0.0.1:18080",
  agentToken: "",
  status: "connected",
  agentStatus: "connected",
  dockerStatus: "ready"
};

export function ConsolePage() {
  const [servers, setServers] = useState<ManagedServer[]>([localServer]);
  const [selectedServerId, setSelectedServerId] = useState(localServer.id);
  const [containers, setContainers] = useState<ContainerSummaryResponse[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState("");
  const [lines, setLines] = useState<string[]>(["서버와 컨테이너를 선택한 뒤 콘솔을 새로고침하세요."]);
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("저장된 서버 정보를 불러오는 중입니다.");
  const [noticeKind, setNoticeKind] = useState<"info" | "success" | "warning" | "error">("info");
  const [isBusy, setIsBusy] = useState(false);

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId) ?? servers[0],
    [selectedServerId, servers]
  );

  useEffect(() => {
    let ignore = false;

    async function loadServers() {
      try {
        const storedServers = await loadStoredServers();
        if (ignore) {
          return;
        }

        const nextServers = storedServers?.length ? storedServers : [localServer];
        setServers(nextServers);
        setSelectedServerId(nextServers[0].id);
        setNoticeKind("info");
        setMessage("서버를 선택하고 컨테이너 목록을 불러오세요.");
      } catch (error) {
        if (!ignore) {
          setNoticeKind("error");
          setMessage(error instanceof Error ? error.message : "저장된 서버 정보를 불러오지 못했습니다.");
        }
      }
    }

    void loadServers();
    return () => {
      ignore = true;
    };
  }, []);

  async function refreshContainers() {
    if (!selectedServer) {
      setNoticeKind("error");
      setMessage("먼저 서버를 선택하세요.");
      return;
    }

    try {
      setIsBusy(true);
      const managedContainers = await listManagedContainers(selectedServer.agentBaseUrl, selectedServer.agentToken);
      setContainers(managedContainers);
      const firstContainerId = managedContainers[0]?.id ?? "";
      setSelectedContainerId(firstContainerId);
      setNoticeKind(managedContainers.length > 0 ? "success" : "warning");
      setMessage(
        managedContainers.length > 0
          ? `${selectedServer.name} 컨테이너 ${managedContainers.length}개를 불러왔습니다.`
          : "이 서버에서 관리 중인 컨테이너가 없습니다."
      );
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "컨테이너 목록을 불러오지 못했습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshConsole(containerId = selectedContainerId) {
    if (!selectedServer || !containerId) {
      setNoticeKind("error");
      setMessage("콘솔을 볼 컨테이너를 선택하세요.");
      return;
    }

    try {
      setIsBusy(true);
      const snapshot = await getConsoleSnapshot(
        { containerId },
        selectedServer.agentBaseUrl,
        selectedServer.agentToken
      );
      setLines(snapshot.lines.length > 0 ? snapshot.lines : ["콘솔 출력이 없습니다."]);
      setNoticeKind("success");
      setMessage(`${selectedServer.name} 콘솔을 새로고침했습니다.`);
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "콘솔 로그를 불러오지 못했습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSendCommand() {
    const trimmedCommand = command.trim();
    if (!selectedServer || !selectedContainerId || !trimmedCommand) {
      setNoticeKind("error");
      setMessage("컨테이너와 보낼 명령을 입력하세요.");
      return;
    }

    try {
      setIsBusy(true);
      const result = await sendConsoleCommand(
        { containerId: selectedContainerId, command: trimmedCommand },
        selectedServer.agentBaseUrl,
        selectedServer.agentToken
      );
      setCommand("");
      setLines((current) => [
        ...current,
        `> ${result.command}`,
        ...(result.output.length > 0 ? result.output : ["명령을 전송했습니다."])
      ]);
      setNoticeKind("success");
      setMessage("Minecraft 콘솔 명령을 전송했습니다.");
      await refreshConsole(selectedContainerId);
    } catch (error) {
      setNoticeKind("error");
      setMessage(error instanceof Error ? error.message : "콘솔 명령 전송에 실패했습니다.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleServerChange(serverId: string) {
    setSelectedServerId(serverId);
    setContainers([]);
    setSelectedContainerId("");
    setLines(["컨테이너 목록을 먼저 불러오세요."]);
    setNoticeKind("info");
    setMessage("서버가 바뀌었습니다. 컨테이너 목록을 새로고침하세요.");
  }

  return (
    <>
      <Topbar
        actionLabel="콘솔 새로고침"
        secondaryActionLabel="컨테이너 불러오기"
        description="등록된 서버의 Minecraft 컨테이너 로그를 보고 콘솔 명령을 전송합니다."
        onAction={() => refreshConsole()}
        onSecondaryAction={refreshContainers}
        title="Docker 콘솔"
      />

      <div className={`noticeBar ${noticeKind}`}>{message}</div>

      <article className="panel consolePanel">
        <div className="formGrid">
          <label className="fieldGroup">
            <span>서버</span>
            <select
              className="textInput"
              onChange={(event) => handleServerChange(event.target.value)}
              value={selectedServerId}
            >
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name}
                </option>
              ))}
            </select>
          </label>

          <label className="fieldGroup">
            <span>컨테이너</span>
            <select
              className="textInput"
              onChange={(event) => setSelectedContainerId(event.target.value)}
              value={selectedContainerId}
            >
              <option value="">컨테이너 선택</option>
              {containers.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.name} ({container.status})
                </option>
              ))}
            </select>
          </label>

          <label className="fieldGroup">
            <span>Agent URL</span>
            <input className="textInput readonlyInput" readOnly value={selectedServer?.agentBaseUrl ?? ""} />
          </label>
        </div>

        <div className="terminalOutput" aria-label="Docker console output">
          {lines.map((line, index) => (
            <div key={`${line}-${index}`}>{line}</div>
          ))}
        </div>
        <div className="terminalInput">
          <span>&gt;</span>
          <input
            aria-label="console command"
            disabled={isBusy || !selectedContainerId}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSendCommand();
              }
            }}
            placeholder="예: say hello"
            value={command}
          />
          <button
            className="smallButton"
            disabled={isBusy || !selectedContainerId || !command.trim()}
            onClick={handleSendCommand}
            type="button"
          >
            전송
          </button>
        </div>
      </article>
    </>
  );
}
